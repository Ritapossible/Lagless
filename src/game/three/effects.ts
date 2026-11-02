// Atmosphere that the 2D renderer used to draw: one ambient effect per world,
// a visual for each ability, and speed particles. Purely visual; reads nothing but its inputs.
import * as THREE from 'three';
import { AbilityType } from '../types';

const LANE_WIDTH = 3;
const laneX = (lane: number) => (lane - 1) * LANE_WIDTH;
// Same span as the scenery loop in GameRenderer
const NEAR_Z = 15;
const FAR_Z = -105;
const SPAN = NEAR_Z - FAR_Z;
const wrap = (offset: number, near = NEAR_Z, span = SPAN) => near - span + (((offset % span) + span) % span);

// Seeded so the layout is the same on every load
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface EffectsInput {
  world: number;
  scroll: number;
  speed: number;
  time: number;
  dt: number;
  craftX: number;
  ability: AbilityType | null;
  abilityActive: boolean;
}

export class SceneEffects {
  private dummy = new THREE.Object3D();
  private worldGroups: THREE.Group[] = [];

  // World 0: signal static
  private noise: THREE.InstancedMesh;
  // World 1: glitching panels
  private panels: { mesh: THREE.Mesh; x: number; y: number; z: number }[] = [];
  // World 2: relay masts and the links between them
  private masts: THREE.Group[] = [];
  private links: THREE.LineSegments;
  private linkMat: THREE.LineBasicMaterial;
  // World 3: yard grid
  private grid: THREE.GridHelper;
  // World 4: drifting light
  private motes: THREE.Points;
  private moteSeeds: Float32Array;

  // Abilities
  private hopRings: THREE.Mesh[] = [];
  private pads: THREE.Mesh[] = [];
  private padMat: THREE.MeshBasicMaterial;
  private hopTime = 0;

  // Always on
  private speedLines: THREE.InstancedMesh;
  private speedMat: THREE.MeshBasicMaterial;
  private speedSeeds: { x: number; y: number; z: number }[] = [];

  constructor(scene: THREE.Scene) {
    const rand = rng(7);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      g.visible = false;
      scene.add(g);
      this.worldGroups.push(g);
    }

    // --- World 0: thin red slivers of static hanging in the haze
    this.noise = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 0.03, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xff5a46, transparent: true, opacity: 0.45, depthWrite: false }),
      36,
    );
    this.worldGroups[0].add(this.noise);

    // --- World 1: broken screen panels beside the track that cut in and out
    const panelMat = new THREE.MeshLambertMaterial({ color: 0x10141c, emissive: 0x7f9cff, emissiveIntensity: 0.9 });
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2 + rand() * 1.6, 0.6 + rand() * 1.2, 0.08), panelMat);
      mesh.rotation.y = side * (0.3 + rand() * 0.4);
      const panel = { mesh, x: side * (7 + rand() * 4), y: 2 + rand() * 5, z: i * (SPAN / 16) };
      this.panels.push(panel);
      this.worldGroups[1].add(mesh);
    }

    // --- World 2: relay masts on both sides, linked across the track in a zigzag mesh
    const mastMat = new THREE.MeshLambertMaterial({ color: 0xe7eeec, flatShading: true });
    const beaconMat = new THREE.MeshLambertMaterial({ color: 0x0b2b28, emissive: 0x2fd1bf, emissiveIntensity: 1.4 });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 7, 0.16), mastMat);
      pole.position.y = 3.5;
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), beaconMat);
      beacon.position.y = 7.2;
      m.add(pole, beacon);
      this.masts.push(m);
      this.worldGroups[2].add(m);
    }
    this.linkMat = new THREE.LineBasicMaterial({ color: 0x137a70, transparent: true, opacity: 0.8 });
    this.links = new THREE.LineSegments(new THREE.BufferGeometry(), this.linkMat);
    this.links.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 2 * 3), 3));
    this.links.frustumCulled = false;
    this.worldGroups[2].add(this.links);

    // --- World 3: a lit yard grid on the ground below the causeway
    this.grid = new THREE.GridHelper(240, 60, 0xffb347, 0x6b4f2c);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.35;
    this.grid.position.set(0, -6.9, -60);
    this.worldGroups[3].add(this.grid);

    // --- World 4: motes of light drifting past
    const moteCount = 220;
    const positions = new Float32Array(moteCount * 3);
    this.moteSeeds = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      this.moteSeeds[i * 3] = (rand() - 0.5) * 40;
      this.moteSeeds[i * 3 + 1] = rand() * 12 - 1;
      this.moteSeeds[i * 3 + 2] = rand() * SPAN;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0x3a8dde, size: 0.16, transparent: true, opacity: 0.8 }));
    this.motes.frustumCulled = false;
    this.worldGroups[4].add(this.motes);

    // --- Hop: hexagonal rings racing ahead of the craft
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5ff2df, transparent: true, opacity: 0.8, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 4, 6), ringMat.clone());
      ring.rotation.z = Math.PI / 6;
      ring.visible = false;
      scene.add(ring);
      this.hopRings.push(ring);
    }

    // --- Clear lanes: safe platforms laid down the length of every lane
    this.padMat = new THREE.MeshBasicMaterial({ color: 0xffa25c, transparent: true, opacity: 0.85, depthWrite: false });
    for (let lane = 0; lane < 3; lane++) {
      for (let i = 0; i < 6; i++) {
        const pad = new THREE.Mesh(new THREE.BoxGeometry(LANE_WIDTH - 0.5, 0.05, 2.6), this.padMat);
        pad.position.x = laneX(lane);
        pad.position.y = 0.07;
        pad.userData.slot = i;
        pad.visible = false;
        scene.add(pad);
        this.pads.push(pad);
      }
    }

    // --- Speed lines around the track in normal play
    this.speedMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false });
    this.speedLines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.025, 1), this.speedMat, 48);
    this.speedLines.frustumCulled = false;
    for (let i = 0; i < 48; i++) {
      const a = rand() * Math.PI * 2;
      const r = 7 + rand() * 9;
      this.speedSeeds.push({ x: Math.cos(a) * r, y: 3 + Math.sin(a) * r * 0.5, z: rand() * SPAN });
    }
    scene.add(this.speedLines);
  }

  update(input: EffectsInput) {
    const { world, scroll, time } = input;
    this.worldGroups.forEach((g, i) => { g.visible = i === world; });

    if (world === 0) this.updateNoise(time);
    if (world === 1) this.updatePanels(scroll, time);
    if (world === 2) this.updateMasts(scroll, time);
    if (world === 3) this.grid.position.z = -60 + (scroll % 4);
    if (world === 4) this.updateMotes(scroll, time);

    this.updateHop(input);
    this.updatePads(input);
    this.updateSpeedLines(input);
  }

  private updateNoise(time: number) {
    // Re-roll every other frame or so, like the old static
    if (Math.floor(time * 30) % 2 !== 0) return;
    for (let i = 0; i < 36; i++) {
      this.dummy.position.set((Math.random() - 0.5) * 26, 0.5 + Math.random() * 8, -4 - Math.random() * 60);
      this.dummy.scale.set(0.6 + Math.random() * 3, 1, 1);
      this.dummy.updateMatrix();
      this.noise.setMatrixAt(i, this.dummy.matrix);
    }
    this.noise.instanceMatrix.needsUpdate = true;
  }

  private updatePanels(scroll: number, time: number) {
    const tick = Math.floor(time * 12);
    this.panels.forEach((p, i) => {
      // Each panel drops out on its own rhythm and jumps sideways when it glitches
      const glitch = ((tick * 7 + i * 13) % 23) < 3;
      p.mesh.visible = ((tick + i * 5) % 17) > 1;
      p.mesh.position.set(p.x + (glitch ? (Math.random() - 0.5) * 0.8 : 0), p.y, wrap(p.z + scroll));
    });
  }

  private updateMasts(scroll: number, time: number) {
    const pos = this.links.geometry.getAttribute('position') as THREE.BufferAttribute;
    const perSide = this.masts.length / 2;
    const spacing = SPAN / perSide;
    const tops: THREE.Vector3[] = [];
    this.masts.forEach((m, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const slot = Math.floor(i / 2);
      // Right-side masts sit half a step behind, so links zigzag across the track
      m.position.set(side * 6.5, 0, wrap(slot * spacing + (side > 0 ? spacing / 2 : 0) + scroll));
      tops[i] = new THREE.Vector3(m.position.x, 7.2, m.position.z);
    });
    // Each left mast links to the two right masts beside it; a link that would span the wrap collapses to a point
    let k = 0;
    for (let s = 0; s < perSide; s++) {
      const left = tops[s * 2];
      for (const r of [s, (s + perSide - 1) % perSide]) {
        const right = tops[r * 2 + 1];
        const ok = Math.abs(left.z - right.z) < spacing;
        pos.setXYZ(k++, left.x, left.y, left.z);
        pos.setXYZ(k++, ok ? right.x : left.x, left.y, ok ? right.z : left.z);
      }
    }
    pos.needsUpdate = true;
    this.linkMat.opacity = 0.7 + Math.sin(time * 2) * 0.15;
  }

  private updateMotes(scroll: number, time: number) {
    const pos = this.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const sx = this.moteSeeds[i * 3], sy = this.moteSeeds[i * 3 + 1], sz = this.moteSeeds[i * 3 + 2];
      pos.setXYZ(i, sx + Math.sin(time * 0.5 + i) * 0.4, sy + Math.sin(time * 0.8 + i * 1.7) * 0.3, wrap(sz + scroll * 0.7));
    }
    pos.needsUpdate = true;
  }

  private updateHop({ ability, abilityActive, craftX, dt }: EffectsInput) {
    const on = abilityActive && ability === 'relay_chain';
    this.hopTime = on ? this.hopTime + dt : 0;
    this.hopRings.forEach((ring, i) => {
      ring.visible = on;
      if (!on) return;
      const t = (this.hopTime * 1.6 + i / this.hopRings.length) % 1;
      ring.position.set(craftX, 0.9, -2 - t * 28);
      ring.scale.setScalar(0.6 + t * 1.2);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
    });
  }

  private updatePads({ ability, abilityActive, scroll, time }: EffectsInput) {
    const on = abilityActive && ability === 'node_deploy';
    this.padMat.opacity = 0.8 + Math.sin(time * 6) * 0.1;
    this.pads.forEach(pad => {
      pad.visible = on;
      if (on) pad.position.z = wrap(pad.userData.slot * 8 + scroll, 6, 48);
    });
  }

  private updateSpeedLines({ scroll, speed, world }: EffectsInput) {
    // Dark streaks in the bright worlds, light ones elsewhere
    this.speedMat.color.setHex(world === 2 || world === 4 ? 0x41505c : 0xffffff);
    const length = 1 + speed * 0.5;
    this.speedSeeds.forEach((s, i) => {
      this.dummy.position.set(s.x, s.y, wrap(s.z + scroll * 1.6));
      this.dummy.scale.set(1, 1, length);
      this.dummy.updateMatrix();
      this.speedLines.setMatrixAt(i, this.dummy.matrix);
    });
    this.speedLines.instanceMatrix.needsUpdate = true;
  }
}
