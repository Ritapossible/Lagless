import { GameState, LaneState } from './types';
import warpRunnerImg from '@/assets/char-warp-runner.png';
import relayMasterImg from '@/assets/char-relay-master.png';
import nodeEngineerImg from '@/assets/char-node-engineer.png';

const LANE_COLORS: Record<LaneState, string> = {
  fast: 'hsl(200, 100%, 50%)',
  congested: 'hsl(0, 80%, 50%)',
  collapsing: 'hsl(40, 100%, 50%)',
  relay: 'hsl(160, 100%, 55%)',
};

const LANE_GLOW: Record<LaneState, string> = {
  fast: 'rgba(0, 150, 255, 0.3)',
  congested: 'rgba(255, 50, 50, 0.3)',
  collapsing: 'rgba(255, 180, 0, 0.25)',
  relay: 'rgba(0, 255, 180, 0.4)',
};

// Per-world color themes
const WORLD_THEMES = [
  // Stage 1: Congestion Zone — oppressive red/orange
  { edgeColor: 'rgba(255, 60, 30, 0.5)', gridColor: 'rgba(255, 80, 40, ', vpHue: 0, starHue: 'rgba(255, 150, 100, ', bgTop: [0, 20, 6], bgBot: [0, 15, 10] },
  // Stage 2: Fragmented Grid — electric purple/magenta
  { edgeColor: 'rgba(180, 50, 255, 0.5)', gridColor: 'rgba(160, 60, 255, ', vpHue: 280, starHue: 'rgba(200, 150, 255, ', bgTop: [280, 25, 4], bgBot: [280, 20, 9] },
  // Stage 3: Mesh Awakening — glowing cyan/green
  { edgeColor: 'rgba(0, 255, 180, 0.5)', gridColor: 'rgba(0, 200, 150, ', vpHue: 160, starHue: 'rgba(100, 255, 200, ', bgTop: [160, 25, 4], bgBot: [160, 20, 8] },
  // Stage 4: FlexNode Dominion — stable blue/teal
  { edgeColor: 'rgba(0, 150, 255, 0.5)', gridColor: 'rgba(0, 130, 220, ', vpHue: 200, starHue: 'rgba(100, 180, 255, ', bgTop: [200, 30, 5], bgBot: [200, 25, 9] },
  // Stage 5: Optimum Layer — clean white/ice blue
  { edgeColor: 'rgba(150, 220, 255, 0.6)', gridColor: 'rgba(120, 200, 255, ', vpHue: 190, starHue: 'rgba(200, 230, 255, ', bgTop: [190, 15, 6], bgBot: [195, 12, 11] },
];

const charImages: Record<string, HTMLImageElement> = {};
function getCharImage(abilityType: string): HTMLImageElement | null {
  if (charImages[abilityType]?.complete) return charImages[abilityType];
  if (!charImages[abilityType]) {
    const img = new Image();
    const src = abilityType === 'speed_warp' ? warpRunnerImg
      : abilityType === 'relay_chain' ? relayMasterImg
      : nodeEngineerImg;
    img.src = src;
    charImages[abilityType] = img;
  }
  return null;
}

interface Particle {
  x: number; y: number; z: number; speed: number; lane: number; hue: number; size: number;
}
let dataParticles: Particle[] = [];
let particlesInited = false;

function initParticles(w: number, h: number) {
  dataParticles = [];
  for (let i = 0; i < 60; i++) {
    dataParticles.push({
      x: Math.random() * w, y: Math.random() * h, z: Math.random() * 800,
      speed: 2 + Math.random() * 4, lane: Math.floor(Math.random() * 3),
      hue: 180 + Math.random() * 40, size: 1 + Math.random() * 2,
    });
  }
  particlesInited = true;
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  const { worldConfig } = state;
  const worldIdx = state.world;
  const theme = WORLD_THEMES[worldIdx] || WORLD_THEMES[0];
  const chaos = worldConfig.visualChaosLevel;
  const laneSpacing = worldConfig.laneSpacing;
  
  if (!particlesInited) initParticles(w, h);

  // Background — stage-specific
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, `hsl(${theme.bgTop[0]}, ${theme.bgTop[1]}%, ${theme.bgTop[2]}%)`);
  bgGrad.addColorStop(1, `hsl(${theme.bgBot[0]}, ${theme.bgBot[1]}%, ${theme.bgBot[2]}%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const vanishY = h * 0.28;
  const vanishX = w / 2;
  const bottomY = h * 0.92;
  const tunnelWidthBottom = w * 0.9 * laneSpacing;
  const tunnelWidthTop = w * 0.08 * laneSpacing;

  // ===== STAGE-SPECIFIC BACKGROUND EFFECTS =====

  // Stage 1: Heavy signal noise / static
  if (worldIdx === 0) {
    for (let i = 0; i < Math.floor(15 * chaos); i++) {
      const ny = Math.random() * h;
      const nw = 20 + Math.random() * 80;
      ctx.fillStyle = `rgba(255, 30, 20, ${0.02 + Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * w, ny, nw, 1);
    }
    // Red ambient fog
    const fogGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, h * 0.5);
    fogGrad.addColorStop(0, 'rgba(255, 40, 20, 0.06)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Stage 2: Glitch storms — fragmented geometry flashes
  if (worldIdx === 1) {
    // Random glitch rectangles
    if (Math.random() < chaos * 0.3) {
      for (let i = 0; i < 3; i++) {
        const gx = Math.random() * w;
        const gy = vanishY + Math.random() * (bottomY - vanishY);
        const gw = 10 + Math.random() * 40;
        const gh = 2 + Math.random() * 8;
        ctx.fillStyle = `rgba(180, 50, 255, ${0.05 + Math.random() * 0.08})`;
        ctx.fillRect(gx, gy, gw, gh);
      }
    }
    // Scan line distortion
    for (let i = 0; i < 6; i++) {
      const sy = Math.random() * h;
      const offset = (Math.sin(state.frameCount * 0.2 + i * 13) * 3) * chaos;
      ctx.fillStyle = `rgba(160, 60, 255, 0.03)`;
      ctx.fillRect(offset, sy, w, 1);
    }
  }

  // Stage 3: Flowing mesh links forming dynamically
  if (worldIdx === 2) {
    for (let i = 0; i < 8; i++) {
      const phase = (state.frameCount * 0.02 + i * 1.7) % (Math.PI * 2);
      const cx = vanishX + Math.cos(phase * 2) * w * 0.3;
      const cy = vanishY + Math.sin(phase) * (bottomY - vanishY) * 0.6 + (bottomY - vanishY) * 0.2;
      const nx = vanishX + Math.cos(phase * 2 + 1.2) * w * 0.25;
      const ny2 = vanishY + Math.sin(phase + 1.2) * (bottomY - vanishY) * 0.5 + (bottomY - vanishY) * 0.3;
      ctx.strokeStyle = `rgba(0, 255, 180, ${0.08 + Math.sin(phase) * 0.04})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny2);
      ctx.stroke();
      // Node dots
      ctx.fillStyle = `rgba(0, 255, 180, ${0.15 + Math.sin(phase) * 0.1})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Stage 4: Structured network grid
  if (worldIdx === 3) {
    const gridSpacing = 40;
    const gridAlpha = 0.04;
    for (let gx = 0; gx < w; gx += gridSpacing) {
      ctx.strokeStyle = `rgba(0, 150, 255, ${gridAlpha})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, vanishY);
      ctx.lineTo(gx, bottomY);
      ctx.stroke();
    }
    for (let gy = vanishY; gy < bottomY; gy += gridSpacing) {
      ctx.strokeStyle = `rgba(0, 150, 255, ${gridAlpha})`;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    // Stable routing channel highlights
    for (let lane = 0; lane < 3; lane++) {
      if (state.lanes[lane].state === 'fast') {
        const t = 0.5;
        const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
        const laneW = wAtT / 3;
        const lx = vanishX - wAtT / 2 + laneW * lane + laneW / 2;
        const ly = vanishY + (bottomY - vanishY) * t;
        ctx.fillStyle = 'rgba(0, 150, 255, 0.03)';
        ctx.beginPath();
        ctx.ellipse(lx, ly, laneW * 0.4, (bottomY - vanishY) * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Stage 5: Clean luminous atmosphere with flowing particles
  if (worldIdx === 4) {
    // Soft radial light
    const lightGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, h * 0.7);
    lightGrad.addColorStop(0, 'rgba(150, 220, 255, 0.08)');
    lightGrad.addColorStop(0.5, 'rgba(100, 180, 255, 0.03)');
    lightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, w, h);
    // Extra smooth speed lines
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const phase = (state.distance * 0.15 + i * 30) % 250;
      const len = 30 + phase * 0.6;
      const dist = 40 + phase;
      const sx = vanishX + Math.cos(angle) * dist * 0.5;
      const sy = vanishY + Math.sin(angle) * dist * 0.25;
      const ex = vanishX + Math.cos(angle) * (dist + len);
      const ey = vanishY + Math.sin(angle) * (dist + len) * 0.5;
      ctx.strokeStyle = `rgba(150, 220, 255, ${0.12 - phase * 0.0004})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // Stars — colored per world
  const seed = state.frameCount;
  for (let i = 0; i < 40; i++) {
    const px = (Math.sin(i * 127.1 + seed * 0.01) * 0.5 + 0.5) * w;
    const py = (Math.cos(i * 311.7 + seed * 0.008) * 0.5 + 0.5) * h * 0.5;
    const brightness = Math.sin(seed * 0.05 + i) * 0.5 + 0.5;
    ctx.fillStyle = `${theme.starHue}${brightness * 0.6})`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // Speed lines — themed
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const phase = (state.distance * 0.1 + i * 50) % 200;
    const len = 20 + phase * 0.5;
    const dist = 50 + phase;
    const sx = vanishX + Math.cos(angle) * dist;
    const sy = vanishY + Math.sin(angle) * dist * 0.5;
    const ex = vanishX + Math.cos(angle) * (dist + len);
    const ey = vanishY + Math.sin(angle) * (dist + len) * 0.5;
    ctx.strokeStyle = `${theme.gridColor}${0.15 - phase * 0.0005})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // ===== FLOWING DATA PACKET PARTICLES =====
  for (const p of dataParticles) {
    p.z -= state.speed * 60 * (1 / 60) * p.speed * 0.3;
    if (p.z < 0) { p.z = 700 + Math.random() * 100; p.lane = Math.floor(Math.random() * 3); }
    const t = 1 - p.z / 800;
    if (t < 0 || t > 1) continue;
    const y = vanishY + (bottomY - vanishY) * t;
    const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
    const laneW = wAtT / 3;
    const x = vanishX - wAtT / 2 + laneW * p.lane + laneW * (0.2 + Math.sin(p.z * 0.01) * 0.6);
    const alpha = t * 0.6;
    const laneState = state.lanes[p.lane]?.state || 'fast';
    // Particle hue follows world theme
    let hue = laneState === 'congested' ? 0 : laneState === 'relay' ? 160 : theme.vpHue;
    // Stage 5: bright white-blue particles
    if (worldIdx === 4) hue = 195;
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
    ctx.fillRect(x, y, p.size * t * 2, p.size * t);
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha * 0.3})`;
    ctx.fillRect(x, y + p.size * t, p.size * t, p.size * t * 3);
  }

  // ===== SIGNAL PULSES on lanes =====
  for (let lane = 0; lane < 3; lane++) {
    const laneState = state.lanes[lane].state;
    if (laneState === 'fast' || laneState === 'relay') {
      const pulsePhase = (state.distance * 3 + lane * 200) % 600;
      const pt = 1 - pulsePhase / 600;
      if (pt > 0 && pt < 1) {
        const py = vanishY + (bottomY - vanishY) * pt;
        const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * pt;
        const laneW = wAtT / 3;
        const px = vanishX - wAtT / 2 + laneW * lane + laneW / 2;
        const pulseAlpha = (1 - pt) * 0.5;
        const color = laneState === 'relay' ? `rgba(0, 255, 180, ${pulseAlpha})` : `${theme.gridColor}${pulseAlpha})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(px, py, laneW * 0.4 * pt, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw lanes with perspective
  for (let row = 0; row < 20; row++) {
    const t = row / 20;
    const nextT = (row + 1) / 20;
    const y1 = vanishY + (bottomY - vanishY) * t;
    const y2 = vanishY + (bottomY - vanishY) * nextT;
    const w1 = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
    const w2 = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * nextT;

    for (let lane = 0; lane < 3; lane++) {
      const laneState = state.lanes[lane].state;
      const x1Left = vanishX - w1 / 2 + (w1 / 3) * lane;
      const x1Right = x1Left + w1 / 3;
      const x2Left = vanishX - w2 / 2 + (w2 / 3) * lane;
      const x2Right = x2Left + w2 / 3;

      const zPhase = (state.distance * 2 + row * 40) % 80;
      const gridAlpha = zPhase < 40 ? 0.15 : 0.08;

      let glitchOffset = 0;
      if (laneState === 'congested') {
        glitchOffset = Math.sin(state.frameCount * 0.3 + row * 0.5) * 2;
      }
      // Stage 2: extra glitch on all lanes randomly
      if (worldIdx === 1 && Math.random() < 0.02 * chaos) {
        glitchOffset += (Math.random() - 0.5) * 6;
      }

      ctx.fillStyle = LANE_GLOW[laneState].replace('0.3', String(gridAlpha * (1 - t * 0.7)));
      ctx.beginPath();
      ctx.moveTo(x1Left + 1 + glitchOffset, y1);
      ctx.lineTo(x1Right - 1 + glitchOffset, y1);
      ctx.lineTo(x2Right - 1, y2);
      ctx.lineTo(x2Left + 1, y2);
      ctx.closePath();
      ctx.fill();

      // Congestion static noise
      if (laneState === 'congested' && row % 2 === 0) {
        const noiseAlpha = 0.15 + Math.random() * 0.1;
        ctx.fillStyle = `rgba(255, 30, 30, ${noiseAlpha * (1 - t)})`;
        const nx = x2Left + Math.random() * (x2Right - x2Left);
        ctx.fillRect(nx, y2, 3 + Math.random() * 5, 1);
      }

      // Grid lines — color matches world theme
      if (row % 3 === 0) {
        const lc = LANE_COLORS[laneState];
        ctx.strokeStyle = lc.replace(')', `, ${0.4 * (1 - t)})`).replace('hsl', 'hsla');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1Left, y1);
        ctx.lineTo(x2Left, y2);
        ctx.stroke();
      }
    }

    // Horizontal scan lines
    if (row % 2 === 0) {
      ctx.strokeStyle = `${theme.gridColor}${0.1 * (1 - t)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(vanishX - w1 / 2, y1);
      ctx.lineTo(vanishX + w1 / 2, y1);
      ctx.stroke();
    }
  }

  // Tunnel edges glow — themed
  ctx.strokeStyle = theme.edgeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(vanishX - tunnelWidthTop / 2, vanishY);
  ctx.lineTo(vanishX - tunnelWidthBottom / 2, bottomY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vanishX + tunnelWidthTop / 2, vanishY);
  ctx.lineTo(vanishX + tunnelWidthBottom / 2, bottomY);
  ctx.stroke();

  // ===== BOSS LEVEL WARNING OVERLAY =====
  if (state.isBossLevel) {
    const pulse = Math.sin(state.frameCount * 0.08) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 0, 50, ${0.03 + pulse * 0.04})`;
    ctx.fillRect(0, 0, w, h);
    // Warning edges
    ctx.strokeStyle = `rgba(255, 50, 30, ${0.2 + pulse * 0.15})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  }

  // ===== RELAY NODES =====
  for (const p of state.pickups) {
    if (p.collected) continue;
    const t = 1 - p.z / 800;
    if (t < 0 || t > 1) continue;
    const y = vanishY + (bottomY - vanishY) * t;
    const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
    const laneW = wAtT / 3;
    const x = vanishX - wAtT / 2 + laneW * p.lane + laneW / 2;
    const size = 6 + t * 20;
    const bobY = Math.sin(state.frameCount * 0.1 + p.z) * 3;

    ctx.save();

    if (p.type === 'relay') {
      const ringSize = size * 1.3;
      const ringRotation = state.frameCount * 0.05;
      ctx.strokeStyle = `rgba(0, 255, 180, ${0.3 + Math.sin(state.frameCount * 0.08) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - size * 0.5 + bobY, ringSize, ringSize * 0.35, ringRotation, 0, Math.PI * 2);
      ctx.stroke();

      const orbGrad = ctx.createRadialGradient(x, y - size * 0.5 + bobY, 0, x, y - size * 0.5 + bobY, size * 0.6);
      orbGrad.addColorStop(0, 'rgba(0, 255, 200, 0.9)');
      orbGrad.addColorStop(0.6, 'rgba(0, 200, 150, 0.4)');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.5 + bobY, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.5 + bobY, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'health') {
      ctx.shadowColor = '#ff55aa';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff55aa';
      const cs = size * 0.3;
      ctx.fillRect(x - cs * 0.3, y - size * 0.5 + bobY - cs, cs * 0.6, cs * 2);
      ctx.fillRect(x - cs, y - size * 0.5 + bobY - cs * 0.3, cs * 2, cs * 0.6);
    } else {
      ctx.shadowColor = '#55aaff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#55aaff';
      ctx.beginPath();
      ctx.moveTo(x, y - size + bobY);
      ctx.lineTo(x + size * 0.5, y - size * 0.5 + bobY);
      ctx.lineTo(x, y + bobY);
      ctx.lineTo(x - size * 0.5, y - size * 0.5 + bobY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.35}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('+', x, y - size * 0.4 + bobY);
    }
    ctx.restore();
  }

  // Render obstacles
  for (const obs of state.obstacles) {
    if (obs.hit) continue;
    const t = 1 - obs.z / 800;
    if (t < 0 || t > 1) continue;
    const y = vanishY + (bottomY - vanishY) * t;
    const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
    const laneW = wAtT / 3;
    const x = vanishX - wAtT / 2 + laneW * obs.lane + laneW / 2;
    const size = 8 + t * 30;

    ctx.save();

    if (obs.type === 'storm') {
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      for (let i = 0; i < 4; i++) {
        const ang = (state.frameCount * 0.2 + i * Math.PI / 2);
        const bx = x + Math.cos(ang) * size * 0.4;
        const by = y - size * 0.5 + Math.sin(ang) * size * 0.3;
        ctx.strokeStyle = `rgba(255, 150, 0, ${0.5 + Math.random() * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.5);
        ctx.lineTo(bx + (Math.random() - 0.5) * 4, by + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.5, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.4}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('⚡', x, y - size * 0.35);
    } else if (obs.type === 'spam') {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ff0055';
      const glitch = Math.sin(state.frameCount * 0.5) * 2;
      ctx.fillRect(x - size / 2 + glitch, y - size, size, size);
      ctx.fillStyle = `rgba(255, 0, 85, 0.3)`;
      ctx.fillRect(x - size / 2 - 2, y - size - 1, size + 4, size + 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `bold ${size * 0.45}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('⚠', x + glitch, y - size * 0.35);
    } else {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(x - size / 2, y - size, size, size);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - size * 0.25, y - size * 0.75);
      ctx.lineTo(x + size * 0.25, y - size * 0.25);
      ctx.moveTo(x + size * 0.25, y - size * 0.75);
      ctx.lineTo(x - size * 0.25, y - size * 0.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===== ABILITY WORLD EFFECTS =====
  if (state.abilityActive) {
    if (state.character.ability === 'speed_warp') {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const dist = 30 + ((state.frameCount * 5 + i * 40) % 300);
        const sx = vanishX + Math.cos(angle) * dist * 0.5;
        const sy = vanishY + Math.sin(angle) * dist * 0.25;
        const ex = vanishX + Math.cos(angle) * (dist + 60);
        const ey = vanishY + Math.sin(angle) * (dist + 60) * 0.5;
        ctx.strokeStyle = `rgba(0, 255, 200, ${0.3 - dist * 0.001})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
      const warpGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, h * 0.6);
      warpGrad.addColorStop(0, 'rgba(0, 255, 200, 0.08)');
      warpGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = warpGrad;
      ctx.fillRect(0, 0, w, h);
    } else if (state.character.ability === 'relay_chain') {
      const shimmerAlpha = 0.2 + Math.sin(state.frameCount * 0.2) * 0.1;
      ctx.fillStyle = `rgba(0, 255, 180, ${shimmerAlpha})`;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const hx = vanishX + (Math.random() - 0.5) * w * 0.6;
        const hy = vanishY + Math.random() * (bottomY - vanishY);
        ctx.strokeStyle = `rgba(0, 255, 180, ${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * Math.PI * 2;
          const r = 10 + Math.random() * 8;
          const method = j === 0 ? 'moveTo' : 'lineTo';
          ctx[method](hx + Math.cos(a) * r, hy + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
      }
    } else if (state.character.ability === 'node_deploy') {
      for (let lane = 0; lane < 3; lane++) {
        const t = 0.7;
        const wAtT = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * t;
        const laneW = wAtT / 3;
        const lx = vanishX - wAtT / 2 + laneW * lane + laneW / 2;
        const ly = vanishY + (bottomY - vanishY) * t;
        ctx.fillStyle = `rgba(0, 150, 255, ${0.15 + Math.sin(state.frameCount * 0.1 + lane) * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(lx, ly, laneW * 0.45, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Render player as character sprite
  const playerT = 0.82;
  const playerBaseY = vanishY + (bottomY - vanishY) * playerT;
  const wAtPlayer = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * playerT;
  const playerLaneW = wAtPlayer / 3;
  
  let effectiveLane = state.currentLane;
  if (state.currentLane !== state.targetLane) {
    effectiveLane = state.currentLane + (state.targetLane - state.currentLane) * state.laneChangeProgress;
  }
  
  const playerX = vanishX - wAtPlayer / 2 + playerLaneW * effectiveLane + playerLaneW / 2;
  const jumpOffset = state.playerY * 15;
  const bobAmount = state.isJumping ? 0 : Math.sin(state.frameCount * 0.25) * 3;
  const tiltAmount = state.isJumping ? -0.1 : Math.sin(state.frameCount * 0.25 + 0.5) * 0.06;
  const scaleBreath = 1 + Math.sin(state.frameCount * 0.12) * 0.02;
  const py = playerBaseY - jumpOffset + bobAmount;
  const charSize = 48;

  ctx.save();

  // Glow under player
  const glowColor = state.abilityActive ? 'rgba(0, 255, 200, 0.5)' : `${theme.gridColor}0.35)`;
  ctx.shadowColor = state.abilityActive ? '#00ffcc' : theme.edgeColor.replace(/[\d.]+\)$/, '1)');
  ctx.shadowBlur = 30;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.ellipse(playerX, py + charSize * 0.3, charSize * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine trail
  const trailGrad = ctx.createLinearGradient(playerX, py + charSize * 0.3, playerX, py + charSize * 1.2);
  trailGrad.addColorStop(0, state.abilityActive ? 'rgba(0, 255, 200, 0.5)' : `${theme.gridColor}0.4)`);
  trailGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = trailGrad;
  ctx.fillRect(playerX - 8, py + charSize * 0.2, 16, charSize * 0.9);

  // Draw character image
  const charImg = getCharImage(state.character.ability);
  if (charImg) {
    ctx.translate(playerX, py - charSize * 0.2);
    ctx.rotate(tiltAmount);
    ctx.scale(scaleBreath, scaleBreath);
    ctx.drawImage(charImg, -charSize / 2, -charSize * 0.5, charSize, charSize);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
  } else {
    ctx.fillStyle = state.abilityActive ? '#00ffcc' : '#00aaff';
    ctx.beginPath();
    ctx.arc(playerX, py - charSize * 0.2, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ability aura
  if (state.abilityActive) {
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, py - charSize * 0.2, charSize * 0.55 + Math.sin(state.frameCount * 0.15) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // ===== LOW LATENCY WARNING =====
  const latencyPercent = state.latencyBudget / state.maxLatency;
  if (latencyPercent < 0.3) {
    const intensity = (0.3 - latencyPercent) / 0.3;
    for (let i = 0; i < 5 * intensity; i++) {
      const sy = Math.random() * h;
      ctx.fillStyle = `rgba(255, 0, 50, ${0.03 + intensity * 0.05})`;
      ctx.fillRect(0, sy, w, 1 + Math.random() * 2);
    }
    if (latencyPercent < 0.15) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.04 * intensity})`;
      ctx.fillRect(2, 0, w, h);
      ctx.fillStyle = `rgba(0, 0, 255, ${0.04 * intensity})`;
      ctx.fillRect(-2, 0, w, h);
    }
    // Vignette
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.7);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, `rgba(255, 0, 30, ${intensity * 0.15})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // Vanishing point glow — themed
  const vpGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, 80);
  vpGrad.addColorStop(0, `hsla(${theme.vpHue}, 100%, 60%, 0.3)`);
  vpGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vpGrad;
  ctx.fillRect(vanishX - 80, vanishY - 40, 160, 80);
}
