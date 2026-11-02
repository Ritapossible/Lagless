// Craft for the four runners, built from primitives so the game ships no model files
import * as THREE from 'three';
import { AbilityType } from '../types';

export interface CraftParts {
  root: THREE.Group;
  /** Tilts with lane changes; the root moves, the body banks */
  body: THREE.Group;
  /** Emissive materials that brighten when the ability is active */
  glow: THREE.MeshLambertMaterial[];
  /** Ring shown while the ability runs */
  shield: THREE.Mesh;
  /** Volt only: drives on wheels and flies on thrusters, see updateFlyingCar */
  car?: {
    wheels: { fold: THREE.Group; spin: THREE.Group }[];
    jets: THREE.Group;
    flames: THREE.Mesh[];
    fold: number;
  };
}

interface CraftLook {
  hull: number;
  trim: number;
  canopy: number;
  glow: number;
}

export const CRAFT_LOOKS: Record<AbilityType, CraftLook> = {
  speed_warp: { hull: 0xe9e6df, trim: 0xf2a33a, canopy: 0x1d2633, glow: 0xffb54d },
  relay_chain: { hull: 0xdfe7e6, trim: 0x2fb6a8, canopy: 0x17262a, glow: 0x5ff2df },
  node_deploy: { hull: 0x3b4250, trim: 0xe0663a, canopy: 0x121820, glow: 0xff8a52 },
  lift_off: { hull: 0xf1f2f4, trim: 0xe5484d, canopy: 0x10141c, glow: 0x7cc4ff },
};

const flat = (color: number) => new THREE.MeshLambertMaterial({ color, flatShading: true });

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function thruster(mat: THREE.MeshLambertMaterial, x: number, y: number, z: number, r = 0.12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.3, 0.12, 10), mat);
  m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

function buildDart(look: CraftLook, glow: THREE.MeshLambertMaterial) {
  const g = new THREE.Group();
  const hull = flat(look.hull), trim = flat(look.trim), canopy = flat(look.canopy);
  g.add(box(0.7, 0.32, 2.0, hull, 0, 0.32, 0.1));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.9, 4), hull);
  nose.rotation.set(-Math.PI / 2, Math.PI / 4, 0);
  nose.scale.set(1, 1, 0.45);
  nose.position.set(0, 0.32, -1.32);
  g.add(nose);
  g.add(box(0.42, 0.2, 0.7, canopy, 0, 0.56, -0.2));
  g.add(box(0.08, 0.06, 2.0, trim, 0, 0.5, 0.1));
  // Swept wings
  for (const s of [-1, 1]) {
    const wing = box(0.9, 0.06, 0.8, hull, s * 0.72, 0.26, 0.55);
    wing.rotation.y = s * 0.35;
    g.add(wing);
    g.add(box(0.06, 0.32, 0.5, trim, s * 1.12, 0.4, 0.75));
  }
  g.add(thruster(glow, -0.2, 0.32, 1.12), thruster(glow, 0.2, 0.32, 1.12));
  return g;
}

function buildHopper(look: CraftLook, glow: THREE.MeshLambertMaterial) {
  const g = new THREE.Group();
  const hull = flat(look.hull), trim = flat(look.trim), canopy = flat(look.canopy);
  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.3, 4, 8), hull);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(s * 0.68, 0.36, 0);
    g.add(pod);
    g.add(box(0.1, 0.08, 1.2, trim, s * 0.68, 0.66, 0));
    g.add(thruster(glow, s * 0.68, 0.36, 0.98, 0.16));
  }
  g.add(box(1.1, 0.12, 0.6, hull, 0, 0.42, 0.1));
  g.add(box(0.5, 0.3, 0.7, hull, 0, 0.5, -0.25));
  g.add(box(0.36, 0.18, 0.4, canopy, 0, 0.7, -0.35));
  const mast = box(0.06, 0.5, 0.06, trim, 0, 0.9, 0.2);
  g.add(mast);
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), glow);
  beacon.position.set(0, 1.18, 0.2);
  g.add(beacon);
  return g;
}

function buildAnchor(look: CraftLook, glow: THREE.MeshLambertMaterial) {
  const g = new THREE.Group();
  const hull = flat(look.hull), trim = flat(look.trim), canopy = flat(look.canopy);
  g.add(box(1.5, 0.42, 2.1, hull, 0, 0.42, 0.05));
  g.add(box(1.2, 0.26, 1.2, hull, 0, 0.76, 0.3));
  g.add(box(0.8, 0.22, 0.42, canopy, 0, 0.68, -0.72));
  g.add(box(1.54, 0.1, 0.18, trim, 0, 0.58, -0.92));
  g.add(box(1.54, 0.1, 0.18, trim, 0, 0.58, 0.98));
  // Hover pads at the corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.14, 8), trim);
    pad.position.set(sx * 0.7, 0.16, sz * 0.78);
    g.add(pad);
  }
  g.add(thruster(glow, -0.42, 0.46, 1.12, 0.14), thruster(glow, 0.42, 0.46, 1.12, 0.14));
  return g;
}

// Side profile (z forward-to-back, y up) extruded across the car's width
function profile(points: [number, number][], width: number, mat: THREE.Material) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geo.rotateY(-Math.PI / 2);
  geo.translate(width / 2, 0, 0);
  return new THREE.Mesh(geo, mat);
}

// Volt: a low road coupe with four wheels that fold flat and four thrusters that fire when it flies
function buildVolt(look: CraftLook, glow: THREE.MeshLambertMaterial) {
  const g = new THREE.Group();
  const hull = flat(look.hull), canopy = flat(look.canopy), dark = flat(0x1a1d24);
  const tail = new THREE.MeshLambertMaterial({ color: 0x220808, emissive: look.trim, emissiveIntensity: 1.6 });
  const head = new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0xffffff, emissiveIntensity: 1.2 });

  g.add(profile([[-1.6, 0.3], [-1.6, 0.4], [-0.7, 0.6], [-0.15, 0.92], [0.55, 0.92], [1.5, 0.62], [1.5, 0.3]], 1.6, hull));
  const glass = profile([[-0.62, 0.62], [-0.15, 0.95], [0.5, 0.95], [1.05, 0.7], [1.05, 0.62]], 1.3, canopy);
  glass.position.y = 0.005;
  g.add(glass);
  g.add(box(1.5, 0.05, 0.04, tail, 0, 0.6, 1.52));
  g.add(box(1.3, 0.04, 0.04, head, 0, 0.42, -1.62));

  // Wheels: fold group turns the wheel flat for flight, spin group rolls it on the road
  const wheelMat = flat(0x15171c);
  const wheels: { fold: THREE.Group; spin: THREE.Group }[] = [];
  for (const [x, z] of [[-0.82, -1.0], [0.82, -1.0], [-0.82, 1.0], [0.82, 1.0]]) {
    const fold = new THREE.Group();
    fold.position.set(x, 0.26, z);
    const spin = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 12), wheelMat);
    tyre.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.21, 8), hull);
    hub.rotation.z = Math.PI / 2;
    spin.add(tyre, hub);
    fold.add(spin);
    g.add(fold);
    wheels.push({ fold, spin });
  }

  // Thrusters under the floor, with flames that only show in flight
  const jets = new THREE.Group();
  const flames: THREE.Mesh[] = [];
  const flameMat = new THREE.MeshBasicMaterial({ color: look.glow, transparent: true, opacity: 0.75, depthWrite: false });
  for (const [x, z] of [[-0.5, -0.75], [0.5, -0.75], [-0.5, 0.75], [0.5, 0.75]]) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.1, 10), dark);
    nozzle.position.set(x, 0.25, z);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 10), glow);
    ring.position.set(x, 0.19, z);
    g.add(nozzle, ring);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 1, 10, 1, true), flameMat);
    flame.rotation.x = Math.PI;
    flame.position.set(x, -0.3, z);
    jets.add(flame);
    flames.push(flame);
  }
  jets.visible = false;
  g.add(jets);
  return { group: g, car: { wheels, jets, flames, fold: 0 } };
}

/** Rolls the wheels on the road, or folds them flat and fires the jets in the air */
export function updateFlyingCar(parts: CraftParts, flying: boolean, dt: number, time: number, roll: number) {
  const car = parts.car;
  if (!car) return;
  car.fold += ((flying ? 1 : 0) - car.fold) * Math.min(1, dt * 10);
  for (const w of car.wheels) {
    w.fold.rotation.z = (w.fold.position.x < 0 ? -1 : 1) * car.fold * (Math.PI / 2);
    if (!flying) w.spin.rotation.x = -roll;
  }
  car.jets.visible = car.fold > 0.2;
  car.flames.forEach((f, i) => {
    f.scale.set(1, 0.7 + car.fold * 0.5 + Math.sin(time * 40 + i * 1.7) * 0.12, 1);
    f.position.y = 0.2 - f.scale.y * 0.5;
  });
}

export function buildCraft(ability: AbilityType): CraftParts {
  const look = CRAFT_LOOKS[ability];
  const glow = new THREE.MeshLambertMaterial({ color: 0x222222, emissive: look.glow, emissiveIntensity: 0.9, flatShading: true });
  const volt = ability === 'lift_off' ? buildVolt(look, glow) : null;
  const body = volt ? volt.group
    : ability === 'speed_warp' ? buildDart(look, glow)
    : ability === 'relay_chain' ? buildHopper(look, glow)
    : buildAnchor(look, glow);

  const shield = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.04, 6, 40),
    new THREE.MeshBasicMaterial({ color: look.glow, transparent: true, opacity: 0.8 }),
  );
  shield.rotation.x = Math.PI / 2;
  shield.position.y = 0.4;
  shield.visible = false;

  const root = new THREE.Group();
  const bank = new THREE.Group();
  bank.add(body);
  root.add(bank, shield);
  return { root, body: bank, glow: [glow], shield, car: volt?.car };
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse(o => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach(m => m.dispose());
    else mat?.dispose();
  });
}
