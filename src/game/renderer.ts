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

// Cache loaded images
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

// Persistent particle state
interface Particle {
  x: number; y: number; z: number; speed: number; lane: number; hue: number; size: number;
}
let dataParticles: Particle[] = [];
let particlesInited = false;

function initParticles(w: number, h: number) {
  dataParticles = [];
  for (let i = 0; i < 60; i++) {
    dataParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 800,
      speed: 2 + Math.random() * 4,
      lane: Math.floor(Math.random() * 3),
      hue: 180 + Math.random() * 40,
      size: 1 + Math.random() * 2,
    });
  }
  particlesInited = true;
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  const { worldConfig } = state;
  
  if (!particlesInited) initParticles(w, h);

  // Clear with dark space bg
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, `hsl(${worldConfig.bgHue}, 30%, 4%)`);
  bgGrad.addColorStop(1, `hsl(${worldConfig.bgHue}, 25%, 8%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const vanishY = h * 0.28;
  const vanishX = w / 2;
  const bottomY = h * 0.92;
  const tunnelWidthBottom = w * 0.9;
  const tunnelWidthTop = w * 0.08;

  // Stars
  const seed = state.frameCount;
  for (let i = 0; i < 40; i++) {
    const px = (Math.sin(i * 127.1 + seed * 0.01) * 0.5 + 0.5) * w;
    const py = (Math.cos(i * 311.7 + seed * 0.008) * 0.5 + 0.5) * h * 0.5;
    const brightness = Math.sin(seed * 0.05 + i) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(150, 200, 255, ${brightness * 0.6})`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // Speed lines
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const phase = (state.distance * 0.1 + i * 50) % 200;
    const len = 20 + phase * 0.5;
    const dist = 50 + phase;
    const sx = vanishX + Math.cos(angle) * dist;
    const sy = vanishY + Math.sin(angle) * dist * 0.5;
    const ex = vanishX + Math.cos(angle) * (dist + len);
    const ey = vanishY + Math.sin(angle) * (dist + len) * 0.5;
    ctx.strokeStyle = `rgba(100, 180, 255, ${0.15 - phase * 0.0005})`;
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
    const hue = laneState === 'congested' ? 0 : laneState === 'relay' ? 160 : p.hue;
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
    ctx.fillRect(x, y, p.size * t * 2, p.size * t);
    // Trailing glow
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
        const color = laneState === 'relay' ? `rgba(0, 255, 180, ${pulseAlpha})` : `rgba(0, 150, 255, ${pulseAlpha})`;
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

      // Congestion glitch wave
      let glitchOffset = 0;
      if (laneState === 'congested') {
        glitchOffset = Math.sin(state.frameCount * 0.3 + row * 0.5) * 2;
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

      // Grid lines with data-stream styling
      if (row % 3 === 0) {
        ctx.strokeStyle = LANE_COLORS[laneState].replace(')', `, ${0.4 * (1 - t)})`).replace('hsl', 'hsla');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1Left, y1);
        ctx.lineTo(x2Left, y2);
        ctx.stroke();
      }
    }

    // Horizontal scan lines
    if (row % 2 === 0) {
      ctx.strokeStyle = `rgba(0, 150, 255, ${0.1 * (1 - t)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(vanishX - w1 / 2, y1);
      ctx.lineTo(vanishX + w1 / 2, y1);
      ctx.stroke();
    }
  }

  // Tunnel edges glow
  ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(vanishX - tunnelWidthTop / 2, vanishY);
  ctx.lineTo(vanishX - tunnelWidthBottom / 2, bottomY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vanishX + tunnelWidthTop / 2, vanishY);
  ctx.lineTo(vanishX + tunnelWidthBottom / 2, bottomY);
  ctx.stroke();

  // ===== RELAY NODES (floating orbs/gates) =====
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
      // Relay orb with ring gate
      const ringSize = size * 1.3;
      const ringRotation = state.frameCount * 0.05;
      ctx.strokeStyle = `rgba(0, 255, 180, ${0.3 + Math.sin(state.frameCount * 0.08) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - size * 0.5 + bobY, ringSize, ringSize * 0.35, ringRotation, 0, Math.PI * 2);
      ctx.stroke();

      // Inner orb
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
      // Health pickup — pulsing cross
      ctx.shadowColor = '#ff55aa';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff55aa';
      const cs = size * 0.3;
      ctx.fillRect(x - cs * 0.3, y - size * 0.5 + bobY - cs, cs * 0.6, cs * 2);
      ctx.fillRect(x - cs, y - size * 0.5 + bobY - cs * 0.3, cs * 2, cs * 0.6);
    } else {
      // Score pickup — data diamond
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
      // Congestion storm — electric crackling
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
      // Spam block — glitchy rectangle
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
      // Routing failure — X mark
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
      // Tunnel stretch / warp lines
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
      // Cyan tunnel overlay
      const warpGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, h * 0.6);
      warpGrad.addColorStop(0, 'rgba(0, 255, 200, 0.08)');
      warpGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = warpGrad;
      ctx.fillRect(0, 0, w, h);
    } else if (state.character.ability === 'relay_chain') {
      // Teleport shimmer
      const shimmerAlpha = 0.2 + Math.sin(state.frameCount * 0.2) * 0.1;
      ctx.fillStyle = `rgba(0, 255, 180, ${shimmerAlpha})`;
      ctx.fillRect(0, 0, w, h);
      // Hex grid flash
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
      // Safe platform glow — all lanes glow bright blue
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
  const glowColor = state.abilityActive ? 'rgba(0, 255, 200, 0.5)' : 'rgba(0, 150, 255, 0.35)';
  ctx.shadowColor = state.abilityActive ? '#00ffcc' : '#0088ff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.ellipse(playerX, py + charSize * 0.3, charSize * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine trail
  const trailGrad = ctx.createLinearGradient(playerX, py + charSize * 0.3, playerX, py + charSize * 1.2);
  trailGrad.addColorStop(0, state.abilityActive ? 'rgba(0, 255, 200, 0.5)' : 'rgba(0, 150, 255, 0.4)');
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

  // ===== LOW LATENCY: tunnel speed distortion =====
  const latencyPercent = state.latencyBudget / state.maxLatency;
  if (latencyPercent < 0.3) {
    // Scan line noise
    const intensity = (0.3 - latencyPercent) / 0.3;
    for (let i = 0; i < 5 * intensity; i++) {
      const sy = Math.random() * h;
      ctx.fillStyle = `rgba(255, 0, 50, ${0.03 + intensity * 0.05})`;
      ctx.fillRect(0, sy, w, 1 + Math.random() * 2);
    }
    // Chromatic aberration on edges
    if (latencyPercent < 0.15) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.04 * intensity})`;
      ctx.fillRect(2, 0, w, h);
      ctx.fillStyle = `rgba(0, 0, 255, ${0.04 * intensity})`;
      ctx.fillRect(-2, 0, w, h);
    }
  }

  // Vanishing point glow
  const vpGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, 80);
  vpGrad.addColorStop(0, `hsla(${worldConfig.bgHue}, 100%, 60%, 0.3)`);
  vpGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vpGrad;
  ctx.fillRect(vanishX - 80, vanishY - 40, 160, 80);
}
