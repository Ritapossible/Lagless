// Turntable used on the runner select screen
import * as THREE from 'three';
import { AbilityType } from '../types';
import { buildCraft, CraftParts, disposeObject } from './craft';

export class CraftStage {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  private craft: CraftParts | null = null;
  private pivot = new THREE.Group();
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene.add(new THREE.HemisphereLight(0xdfe6f5, 0x1a1e28, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(-3, 5, 4);
    const rim = new THREE.DirectionalLight(0xf2a33a, 0.9);
    rim.position.set(4, 2, -5);
    this.scene.add(key, rim);

    // Stand: a low plinth with a lit edge
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 0.3, 48),
      new THREE.MeshLambertMaterial({ color: 0x222735 }),
    );
    plinth.position.y = -0.2;
    const edge = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.025, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0x3a4152 }),
    );
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -0.05;
    this.scene.add(plinth, edge, this.pivot);

    this.camera.position.set(0, 2.3, 5.4);
    this.camera.lookAt(0, 0.45, 0);
  }

  setCraft(ability: AbilityType) {
    if (this.craft) {
      this.pivot.remove(this.craft.root);
      disposeObject(this.craft.root);
    }
    this.craft = buildCraft(ability);
    this.pivot.add(this.craft.root);
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render(dt: number) {
    this.time += dt;
    this.pivot.rotation.y = -0.6 + this.time * 0.5;
    if (this.craft) this.craft.root.position.y = 0.15 + Math.sin(this.time * 2) * 0.05;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    disposeObject(this.scene);
    this.renderer.dispose();
  }
}
