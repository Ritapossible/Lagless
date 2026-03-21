import { GameState, LaneState } from './types';

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

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number) {
  const { worldConfig } = state;
  
  // Clear with dark space bg
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, `hsl(${worldConfig.bgHue}, 30%, 4%)`);
  bgGrad.addColorStop(1, `hsl(${worldConfig.bgHue}, 25%, 8%)`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Perspective tunnel
  const vanishY = h * 0.28;
  const vanishX = w / 2;
  const bottomY = h * 0.92;
  const tunnelWidthBottom = w * 0.9;
  const tunnelWidthTop = w * 0.08;

  // Stars / particles
  const seed = state.frameCount;
  for (let i = 0; i < 40; i++) {
    const px = ((Math.sin(i * 127.1 + seed * 0.01) * 0.5 + 0.5) * w);
    const py = ((Math.cos(i * 311.7 + seed * 0.008) * 0.5 + 0.5) * h * 0.5);
    const brightness = Math.sin(seed * 0.05 + i) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(150, 200, 255, ${brightness * 0.6})`;
    ctx.fillRect(px, py, 1.5, 1.5);
  }

  // Speed lines
  const lineCount = 12;
  for (let i = 0; i < lineCount; i++) {
    const angle = (i / lineCount) * Math.PI * 2;
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

  // Draw lanes with perspective
  const laneWidth = tunnelWidthBottom / 3;

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

      // Lane floor
      const zPhase = (state.distance * 2 + row * 40) % 80;
      const gridAlpha = zPhase < 40 ? 0.15 : 0.08;

      ctx.fillStyle = LANE_GLOW[laneState].replace('0.3', String(gridAlpha * (1 - t * 0.7)));
      ctx.beginPath();
      ctx.moveTo(x1Left + 1, y1);
      ctx.lineTo(x1Right - 1, y1);
      ctx.lineTo(x2Right - 1, y2);
      ctx.lineTo(x2Left + 1, y2);
      ctx.closePath();
      ctx.fill();

      // Lane borders
      if (row % 3 === 0) {
        ctx.strokeStyle = LANE_COLORS[laneState].replace(')', `, ${0.4 * (1 - t)})`).replace('hsl', 'hsla');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1Left, y1);
        ctx.lineTo(x2Left, y2);
        ctx.stroke();
      }
    }

    // Horizontal grid lines
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
    ctx.shadowColor = obs.type === 'spam' ? '#ff0055' : obs.type === 'storm' ? '#ff6600' : '#ff0033';
    ctx.shadowBlur = 15;
    ctx.fillStyle = obs.type === 'spam' ? '#ff0055' : obs.type === 'storm' ? '#ff6600' : '#ff2222';
    ctx.fillRect(x - size / 2, y - size, size, size);
    
    // Icon on obstacle
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `bold ${size * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(obs.type === 'spam' ? '⚠' : obs.type === 'storm' ? '⚡' : '✕', x, y - size * 0.35);
    ctx.restore();
  }

  // Render pickups
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
    const color = p.type === 'relay' ? '#00ffaa' : p.type === 'health' ? '#ff55aa' : '#55aaff';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    
    // Diamond shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size + bobY);
    ctx.lineTo(x + size * 0.5, y - size * 0.5 + bobY);
    ctx.lineTo(x, y + bobY);
    ctx.lineTo(x - size * 0.5, y - size * 0.5 + bobY);
    ctx.closePath();
    ctx.fill();

    // Score text
    if (p.type === 'score') {
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${size * 0.4}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('+50', x, y - size * 0.4 + bobY);
    }
    ctx.restore();
  }

  // Render player
  const playerT = 0.82;
  const playerBaseY = vanishY + (bottomY - vanishY) * playerT;
  const wAtPlayer = tunnelWidthTop + (tunnelWidthBottom - tunnelWidthTop) * playerT;
  const playerLaneW = wAtPlayer / 3;
  
  // Interpolated lane position
  let effectiveLane = state.currentLane;
  if (state.currentLane !== state.targetLane) {
    effectiveLane = state.currentLane + (state.targetLane - state.currentLane) * state.laneChangeProgress;
  }
  
  const playerX = vanishX - wAtPlayer / 2 + playerLaneW * effectiveLane + playerLaneW / 2;
  const jumpOffset = state.playerY * 15;
  const playerSize = 22;

  // Player glow
  ctx.save();
  const glowColor = state.abilityActive ? 'rgba(0, 255, 200, 0.6)' : 'rgba(0, 150, 255, 0.4)';
  ctx.shadowColor = state.abilityActive ? '#00ffcc' : '#0088ff';
  ctx.shadowBlur = 25;

  // Player ship/character shape (chevron)
  ctx.fillStyle = state.abilityActive ? '#00ffcc' : '#00aaff';
  ctx.strokeStyle = state.abilityActive ? '#00ffee' : '#44ccff';
  ctx.lineWidth = 2;
  
  const py = playerBaseY - jumpOffset;
  ctx.beginPath();
  ctx.moveTo(playerX, py - playerSize);
  ctx.lineTo(playerX + playerSize * 0.7, py + playerSize * 0.3);
  ctx.lineTo(playerX + playerSize * 0.3, py);
  ctx.lineTo(playerX, py + playerSize * 0.5);
  ctx.lineTo(playerX - playerSize * 0.3, py);
  ctx.lineTo(playerX - playerSize * 0.7, py + playerSize * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Engine trail
  const trailGrad = ctx.createLinearGradient(playerX, py + playerSize * 0.5, playerX, py + playerSize * 2);
  trailGrad.addColorStop(0, state.abilityActive ? 'rgba(0, 255, 200, 0.6)' : 'rgba(0, 150, 255, 0.5)');
  trailGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = trailGrad;
  ctx.fillRect(playerX - 5, py + playerSize * 0.3, 10, playerSize * 1.5);

  ctx.restore();

  // Vanishing point glow
  const vpGrad = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, 80);
  vpGrad.addColorStop(0, `hsla(${worldConfig.bgHue}, 100%, 60%, 0.3)`);
  vpGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = vpGrad;
  ctx.fillRect(vanishX - 80, vanishY - 40, 160, 80);
}
