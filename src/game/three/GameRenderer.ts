// Three.js view of the game. It only reads GameState; the engine stays the single source of truth.
import * as THREE from 'three';
import { AbilityType, GameState, LaneState, Obstacle, Pickup } from '../types';
import { buildCraft, CraftParts, disposeObject } from './craft';
import { LANE_COLORS, WORLD_PALETTES, WorldPalette } from './palettes';
import { SceneEffects } from './effects';

// Engine z runs from 800 (spawn) to -100; the player sits at z = 50.
const Z_SCALE = 0.1;
const PLAYER_Z = 50;
// Obstacles move speed * 60 engine units per second while distance grows by speed, so scroll = distance * 6
const SCROLL_PER_DISTANCE = 60 * Z_SCALE;
const LANE_WIDTH = 3;
const TRACK_HALF = LANE_WIDTH * 1.5;
const SEGMENT = 10;
const SEGMENTS = 12;
const LOOP = SEGMENT * SEGMENTS;
const FAR_Z = -105;
const JUMP_SCALE = 0.7;

const laneX = (lane: number) => (lane - 1) * LANE_WIDTH;
const toWorldZ = (z: number) => -(z - PLAYER_Z) * Z_SCALE;
const wrapZ = (offset: number) => FAR_Z + (((offset % LOOP) + LOOP) % LOOP);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

type PaletteKey = keyof Omit<WorldPalette, 'fogNear' | 'fogFar'>;
const COLOR_KEYS: PaletteKey[] = ['sky', 'fog', 'ground', 'deck', 'structure', 'structureDark', 'edge', 'lamp', 'skyLight', 'groundLight'];
const BOSS_TINT = new THREE.Color(0x6e1f1a);

export class GameRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200);
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private fog: THREE.Fog;

  private colors = {} as Record<PaletteKey, THREE.Color>;
  private mats: {
    deck: THREE.MeshLambertMaterial;
    structure: THREE.MeshLambertMaterial;
    structureDark: THREE.MeshLambertMaterial;
    ground: THREE.MeshLambertMaterial;
    lamp: THREE.MeshLambertMaterial;
    edge: THREE.LineBasicMaterial;
    dash: THREE.MeshBasicMaterial;
  };

  private lanes: { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; color: THREE.Color }[] = [];
  private segments: THREE.Group[] = [];
  private dashes: THREE.InstancedMesh;
  private streaks: THREE.InstancedMesh;
  private obstaclePools: Record<Obstacle['type'], THREE.Group[]> = { spam: [], storm: [], failure: [] };
  private pickupPools: Record<Pickup['type'], THREE.Group[]> = { relay: [], health: [], score: [] };

  private craft: CraftParts | null = null;
  private craftAbility: AbilityType | null = null;
  private shadow: THREE.Mesh;
  private effects: SceneEffects;

  private world = 0;
  private time = 0;
  private lastX = 0;
  private shake = 0;
  private flash = 0;
  private wasAbilityActive = false;
  private attractScroll = 0;
  private dummy = new THREE.Object3D();
  private paletteReady = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const p = WORLD_PALETTES[0];
    for (const k of COLOR_KEYS) this.colors[k] = new THREE.Color(p[k]);

    this.scene.background = this.colors.sky.clone();
    this.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);
    this.scene.fog = this.fog;

    this.hemi = new THREE.HemisphereLight(p.skyLight, p.groundLight, 1.6);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sun.position.set(-6, 12, 4);
    this.scene.add(this.hemi, this.sun);

    this.mats = {
      deck: new THREE.MeshLambertMaterial({ color: p.deck, flatShading: true }),
      structure: new THREE.MeshLambertMaterial({ color: p.structure, flatShading: true }),
      structureDark: new THREE.MeshLambertMaterial({ color: p.structureDark, flatShading: true }),
      ground: new THREE.MeshLambertMaterial({ color: p.ground, flatShading: true }),
      lamp: new THREE.MeshLambertMaterial({ color: 0x111111, emissive: p.lamp, emissiveIntensity: 1.2 }),
      edge: new THREE.LineBasicMaterial({ color: p.edge, transparent: true, opacity: 0.55 }),
      dash: new THREE.MeshBasicMaterial({ color: 0xf1ede4, transparent: true, opacity: 0.7 }),
    };

    this.buildTrack();
    this.buildSegments();
    this.buildSkyline();
    this.dashes = this.buildDashes();
    this.streaks = this.buildStreaks();
    this.effects = new SceneEffects(this.scene);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.02;
    this.shadow.scale.set(1.1, 1.5, 1);
    this.scene.add(this.shadow);
  }

  // ---------- Build ----------

  private withEdges(mesh: THREE.Mesh) {
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), this.mats.edge);
    mesh.add(lines);
    return mesh;
  }

  private box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, edges = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    return edges ? this.withEdges(m) : m;
  }

  private buildTrack() {
    const length = LOOP + 20;
    const centerZ = FAR_Z + length / 2 - 5;
    this.scene.add(this.box(TRACK_HALF * 2 + 1.2, 0.6, length, this.mats.deck, 0, -0.32, centerZ, false));
    // Low side barriers
    for (const s of [-1, 1]) {
      this.scene.add(this.box(0.3, 0.5, length, this.mats.structure, s * (TRACK_HALF + 0.45), 0.2, centerZ, false));
    }
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshLambertMaterial({ color: LANE_COLORS.fast, flatShading: true, emissive: 0x000000 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(LANE_WIDTH - 0.16, 0.06, length), mat);
      mesh.position.set(laneX(i), 0.0, centerZ);
      this.scene.add(mesh);
      this.lanes.push({ mesh, mat, color: new THREE.Color(LANE_COLORS.fast) });
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), this.mats.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -7, -60);
    this.scene.add(ground);
  }

  private buildSegments() {
    for (let i = 0; i < SEGMENTS; i++) {
      const g = new THREE.Group();
      const px = TRACK_HALF + 1.1;
      for (const s of [-1, 1]) {
        // Support pier down to the ground and a post up to the gantry
        g.add(this.box(0.9, 7, 0.9, this.mats.structureDark, s * (TRACK_HALF - 0.5), -3.8, 0));
        g.add(this.box(0.5, 6.2, 0.5, this.mats.structure, s * px, 2.8, 0));
      }
      if (i % 2 === 0) {
        // Gantry with signal lamps over each lane
        g.add(this.box(px * 2 + 0.5, 0.45, 0.6, this.mats.structure, 0, 6.0, 0));
        for (let l = 0; l < 3; l++) {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.22), this.mats.lamp);
          lamp.position.set(laneX(l), 5.7, 0.2);
          g.add(lamp);
        }
      } else {
        // Side buildings that sell the depth
        for (const s of [-1, 1]) {
          const h = 2 + ((i * 7 + (s > 0 ? 3 : 0)) % 5);
          g.add(this.box(4, h, 6, this.mats.structure, s * (px + 7), h / 2 - 3, 0));
          g.add(this.box(4.05, 0.25, 6.05, this.mats.lamp, s * (px + 7), h - 3.3, 0, false));
        }
      }
      this.scene.add(g);
      this.segments.push(g);
    }
  }

  private buildSkyline() {
    for (let i = 0; i < 18; i++) {
      const s = i % 2 === 0 ? -1 : 1;
      const w = 4 + (i % 4) * 2;
      const h = 10 + ((i * 13) % 22);
      const tower = this.box(w, h, w, this.mats.structureDark, s * (24 + ((i * 17) % 40)), h / 2 - 7, -40 - ((i * 23) % 70));
      this.scene.add(tower);
    }
  }

  private buildDashes() {
    const per = LOOP / 4;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.02, 1.6), this.mats.dash, per * 2);
    this.scene.add(mesh);
    return mesh;
  }

  private buildStreaks() {
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.03, 0.03, 3),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }),
      40,
    );
    mesh.visible = false;
    this.scene.add(mesh);
    return mesh;
  }

  private makeObstacle(type: Obstacle['type']) {
    const g = new THREE.Group();
    if (type === 'spam') {
      const crate = new THREE.MeshLambertMaterial({ color: 0xc8793a, flatShading: true });
      const band = new THREE.MeshLambertMaterial({ color: 0x3a2a1e, flatShading: true });
      g.add(this.box(1.5, 0.75, 1.1, crate, -0.35, 0.38, 0));
      g.add(this.box(1.1, 0.7, 1.0, crate, 0.45, 0.35, 0.1));
      g.add(this.box(1.0, 0.6, 0.9, crate, 0.0, 1.05, 0));
      g.add(this.box(1.52, 0.08, 1.12, band, -0.35, 0.5, 0, false));
    } else if (type === 'storm') {
      const post = new THREE.MeshLambertMaterial({ color: 0x3f4654, flatShading: true });
      const core = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0x9fd2ff, emissiveIntensity: 1.6 });
      g.add(this.box(0.35, 1.5, 0.35, post, 0, 0.75, 0));
      g.add(this.box(1.4, 0.2, 0.4, post, 0, 1.4, 0));
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), core);
      orb.position.y = 1.55;
      orb.name = 'spin';
      g.add(orb);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 4, 16), core);
      ring.position.y = 1.0;
      ring.rotation.x = Math.PI / 2;
      ring.name = 'ring';
      g.add(ring);
    } else {
      const frame = new THREE.MeshLambertMaterial({ color: 0x2d2f36, flatShading: true });
      const warn = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0xe5484d, emissiveIntensity: 1.1 });
      for (const s of [-1, 1]) g.add(this.box(0.25, 1.5, 0.25, frame, s * 1.1, 0.75, 0));
      const bar = this.box(2.4, 0.3, 0.2, warn, 0, 1.0, 0, false);
      bar.rotation.z = 0.28;
      g.add(bar);
      g.add(this.box(0.9, 0.12, 0.6, frame, 0.6, 0.06, 0.3));
    }
    g.visible = false;
    this.scene.add(g);
    return g;
  }

  private makePickup(type: Pickup['type']) {
    const g = new THREE.Group();
    if (type === 'relay') {
      const m = new THREE.MeshLambertMaterial({ color: 0x0b2b28, emissive: 0x2fd1bf, emissiveIntensity: 1.3, flatShading: true });
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), m));
    } else if (type === 'health') {
      const m = new THREE.MeshLambertMaterial({ color: 0x0f2a1a, emissive: 0x4cc38a, emissiveIntensity: 1.2, flatShading: true });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.22), m));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), m));
    } else {
      const m = new THREE.MeshLambertMaterial({ color: 0x2b1d08, emissive: 0xf2a33a, emissiveIntensity: 1.2, flatShading: true });
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12), m);
      coin.rotation.x = Math.PI / 2;
      g.add(coin);
    }
    g.visible = false;
    this.scene.add(g);
    return g;
  }

  setCharacter(ability: AbilityType) {
    if (this.craftAbility === ability) return;
    if (this.craft) {
      this.scene.remove(this.craft.root);
      disposeObject(this.craft.root);
    }
    this.craft = buildCraft(ability);
    this.craftAbility = ability;
    this.scene.add(this.craft.root);
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // Portrait phones need a wider view to keep all three lanes on screen
    this.camera.fov = this.camera.aspect < 0.8 ? 78 : 62;
    this.camera.updateProjectionMatrix();
  }

  // ---------- Per frame ----------

  private blendPalette(world: number, boss: boolean, dt: number) {
    const target = WORLD_PALETTES[world] ?? WORLD_PALETTES[0];
    // Snap on the first frame so a resumed run starts in its own world, then blend
    const k = this.paletteReady ? Math.min(1, dt * 2.5) : 1;
    this.paletteReady = true;
    const tmp = new THREE.Color();
    for (const key of COLOR_KEYS) {
      tmp.set(target[key]);
      if (boss && (key === 'sky' || key === 'fog' || key === 'lamp')) tmp.lerp(BOSS_TINT, key === 'lamp' ? 0.7 : 0.45);
      this.colors[key].lerp(tmp, k);
    }
    (this.scene.background as THREE.Color).copy(this.colors.sky);
    this.fog.color.copy(this.colors.fog);
    this.fog.near += (target.fogNear - this.fog.near) * k;
    this.fog.far += (target.fogFar - this.fog.far) * k;
    this.hemi.color.copy(this.colors.skyLight);
    this.hemi.groundColor.copy(this.colors.groundLight);
    this.mats.deck.color.copy(this.colors.deck);
    this.mats.structure.color.copy(this.colors.structure);
    this.mats.structureDark.color.copy(this.colors.structureDark);
    this.mats.ground.color.copy(this.colors.ground);
    this.mats.edge.color.copy(this.colors.edge);
    this.mats.lamp.emissive.copy(this.colors.lamp);
  }

  private updateScroll(scroll: number) {
    this.segments.forEach((g, i) => { g.position.z = wrapZ(i * SEGMENT + scroll); });
    const per = LOOP / 4;
    for (let s = 0; s < 2; s++) {
      const x = s === 0 ? -LANE_WIDTH / 2 : LANE_WIDTH / 2;
      for (let j = 0; j < per; j++) {
        this.dummy.position.set(x, 0.05, wrapZ(j * 4 + scroll));
        this.dummy.updateMatrix();
        this.dashes.setMatrixAt(s * per + j, this.dummy.matrix);
      }
    }
    this.dashes.instanceMatrix.needsUpdate = true;
  }

  private updateLanes(states: LaneState[], dt: number) {
    const tmp = new THREE.Color();
    states.forEach((state, i) => {
      const lane = this.lanes[i];
      tmp.set(LANE_COLORS[state]);
      lane.color.lerp(tmp, Math.min(1, dt * 8));
      lane.mat.color.copy(lane.color);
      const pulse = state === 'collapsing' ? 0.5 + 0.5 * Math.sin(this.time * 18) : 0;
      lane.mat.emissive.setHex(state === 'relay' ? 0x0d4a43 : state === 'collapsing' ? 0x5a0f0b : 0x000000);
      lane.mat.emissiveIntensity = state === 'collapsing' ? pulse : 1;
      lane.mesh.position.y = state === 'collapsing' ? -0.12 - pulse * 0.05 : 0;
    });
  }

  private placeObstacles(obstacles: Obstacle[]) {
    const used = { spam: 0, storm: 0, failure: 0 };
    for (const o of obstacles) {
      const pool = this.obstaclePools[o.type];
      const idx = used[o.type]++;
      if (!pool[idx]) pool[idx] = this.makeObstacle(o.type);
      const g = pool[idx];
      g.visible = true;
      g.position.set(laneX(o.lane), 0, toWorldZ(o.z));
      if (o.hit) {
        // Knocked aside once struck
        const t = Math.min(1, (PLAYER_Z - o.z + 40) / 120);
        g.position.y = t * 1.5;
        g.position.x += (o.lane === 0 ? -1 : 1) * t * 3;
        g.rotation.set(t * 2, 0, t * 3);
      } else {
        g.rotation.set(0, 0, 0);
      }
      const spin = g.getObjectByName('spin');
      if (spin) spin.rotation.y = this.time * 3;
      const ring = g.getObjectByName('ring');
      if (ring) ring.scale.setScalar(0.85 + 0.15 * Math.sin(this.time * 12 + o.z));
    }
    for (const type of Object.keys(this.obstaclePools) as Obstacle['type'][]) {
      this.obstaclePools[type].forEach((g, i) => { if (i >= used[type]) g.visible = false; });
    }
  }

  private placePickups(pickups: Pickup[]) {
    const used = { relay: 0, health: 0, score: 0 };
    for (const p of pickups) {
      if (p.collected) continue;
      const pool = this.pickupPools[p.type];
      const idx = used[p.type]++;
      if (!pool[idx]) pool[idx] = this.makePickup(p.type);
      const g = pool[idx];
      g.visible = true;
      g.position.set(laneX(p.lane), 1.0 + Math.sin(this.time * 3 + p.z * 0.05) * 0.12, toWorldZ(p.z));
      g.rotation.y = this.time * 2;
    }
    for (const type of Object.keys(this.pickupPools) as Pickup['type'][]) {
      this.pickupPools[type].forEach((g, i) => { if (i >= used[type]) g.visible = false; });
    }
  }

  private placeCraft(x: number, y: number, dt: number, ability: boolean, warp: boolean) {
    if (!this.craft) return;
    const { root, body, glow, shield } = this.craft;
    const vx = dt > 0 ? (x - this.lastX) / dt : 0;
    this.lastX = x;
    root.position.set(x, y + 0.25 + Math.sin(this.time * 4) * 0.05, 0);
    body.rotation.z += (THREE.MathUtils.clamp(-vx * 0.05, -0.45, 0.45) - body.rotation.z) * Math.min(1, dt * 12);
    body.rotation.x = THREE.MathUtils.clamp(y * 0.08, 0, 0.25);
    shield.visible = ability;
    shield.rotation.z = this.time * 2;
    glow.forEach(m => { m.emissiveIntensity = ability ? 2.2 : 0.9 + Math.sin(this.time * 20) * 0.1; });

    this.shadow.position.x = x;
    const lift = Math.max(0.4, 1 - y * 0.25);
    this.shadow.scale.set(1.1 * lift, 1.5 * lift, 1);

    this.streaks.visible = warp;
    if (warp) {
      for (let i = 0; i < 40; i++) {
        const a = (i * 2.399) % (Math.PI * 2);
        const r = 3 + (i % 5);
        this.dummy.position.set(x + Math.cos(a) * r, 2 + Math.sin(a) * r * 0.6, wrapZ(i * 7 + this.time * 160) * 0.4);
        this.dummy.updateMatrix();
        this.streaks.setMatrixAt(i, this.dummy.matrix);
      }
      this.streaks.instanceMatrix.needsUpdate = true;
    }
  }

  private placeCamera(x: number, dt: number, warp: boolean) {
    const shakeX = (Math.random() - 0.5) * this.shake;
    const shakeY = (Math.random() - 0.5) * this.shake;
    this.camera.position.set(x * 0.5 + shakeX, 4.3 + shakeY, 8.6);
    this.camera.lookAt(x * 0.7, 0.4, -16);
    const baseFov = this.camera.aspect < 0.8 ? 78 : 62;
    const targetFov = warp ? baseFov + 12 : baseFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
      this.camera.updateProjectionMatrix();
    }
    this.shake = Math.max(0, this.shake - dt * 1.6);
  }

  render(state: GameState, dt: number) {
    this.time += dt;
    this.setCharacter(state.character.ability);
    if (state.audioEvents.hit) this.shake = 0.45;
    if (state.abilityActive && !this.wasAbilityActive) this.flash = 1;
    this.wasAbilityActive = state.abilityActive;
    this.flash = Math.max(0, this.flash - dt * 3);
    this.hemi.intensity = 1.6 + this.flash * 1.4;

    this.blendPalette(state.world, state.isBossLevel, dt);
    this.updateScroll(state.distance * SCROLL_PER_DISTANCE);
    this.updateLanes(state.lanes.map(l => l.state), dt);
    this.placeObstacles(state.obstacles);
    this.placePickups(state.pickups);

    const from = laneX(state.currentLane);
    const to = laneX(state.targetLane);
    const x = from + (to - from) * easeOut(state.laneChangeProgress);
    const warp = state.abilityActive && state.character.ability === 'speed_warp';
    this.placeCraft(x, state.playerY * JUMP_SCALE, dt, state.abilityActive, warp);
    this.placeCamera(x, dt, warp);
    this.effects.update({
      world: state.world,
      scroll: state.distance * SCROLL_PER_DISTANCE,
      speed: state.speed,
      time: this.time,
      dt,
      craftX: x,
      ability: state.character.ability,
      abilityActive: state.abilityActive,
    });

    this.renderer.render(this.scene, this.camera);
  }

  /** Idle scene for menus: the causeway scrolling with the craft cruising, no hazards */
  renderAttract(world: number, dt: number) {
    this.time += dt;
    this.attractScroll += dt * 24;
    this.blendPalette(world, false, dt);
    this.updateScroll(this.attractScroll);
    this.updateLanes(['fast', 'relay', 'fast'], dt);
    this.placeObstacles([]);
    this.placePickups([]);
    const x = laneX(1) + Math.sin(this.time * 0.35) * 0.6;
    this.placeCraft(x, 0, dt, false, false);
    this.effects.update({ world, scroll: this.attractScroll, speed: 4, time: this.time, dt, craftX: x, ability: null, abilityActive: false });
    // Craft sits right of centre so the headline has calm space on the left
    const portrait = this.camera.aspect < 0.8;
    this.camera.position.set(portrait ? 0 : -1.5, portrait ? 5.5 : 3.6, portrait ? 11 : 7.5);
    this.camera.lookAt(portrait ? 0 : -4.2, portrait ? 3.4 : 0.6, -8);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    disposeObject(this.scene);
    this.renderer.dispose();
  }
}
