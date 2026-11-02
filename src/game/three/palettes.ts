// Scene colours for each world, indexed like WORLDS in types.ts

export interface WorldPalette {
  sky: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  ground: number;
  deck: number;
  structure: number;
  structureDark: number;
  edge: number;
  lamp: number;
  skyLight: number;
  groundLight: number;
}

export const LANE_COLORS = {
  fast: 0x5b6270,
  relay: 0x2fb6a8,
  congested: 0xb8443a,
  collapsing: 0x7a1f1a,
};

export const WORLD_PALETTES: WorldPalette[] = [
  // Congestion Zone: dusk haze over a jammed causeway
  { sky: 0x3a3330, fog: 0x4a3f38, fogNear: 18, fogFar: 70, ground: 0x2a2522, deck: 0x8d8478, structure: 0xb4a999, structureDark: 0x5a524a, edge: 0x2b2622, lamp: 0xf2a33a, skyLight: 0xffd9b0, groundLight: 0x3a2e28 },
  // Fragmented Grid: cold night, broken panels
  { sky: 0x151b26, fog: 0x1c2533, fogNear: 20, fogFar: 78, ground: 0x10151d, deck: 0x55627a, structure: 0x7d8aa3, structureDark: 0x343e50, edge: 0x0d1118, lamp: 0x8fb4ff, skyLight: 0xb8ccff, groundLight: 0x161c26 },
  // Mesh Awakening: first light, relays everywhere
  { sky: 0x9fc7c0, fog: 0xb3d3cc, fogNear: 24, fogFar: 86, ground: 0x5d7c76, deck: 0xc9d6d2, structure: 0xe7eeec, structureDark: 0x7f9a95, edge: 0x3d5550, lamp: 0x2fb6a8, skyLight: 0xffffff, groundLight: 0x5d7c76 },
  // Anchor Yards: sodium-lit freight yard
  { sky: 0x2b2420, fog: 0x3b3029, fogNear: 22, fogFar: 82, ground: 0x221c18, deck: 0x9a8d7c, structure: 0x9c8a6e, structureDark: 0x4a3f33, edge: 0x1d1612, lamp: 0xffb347, skyLight: 0xffd7a0, groundLight: 0x2e241c },
  // Clear Channel: clean, bright, nothing in the way
  { sky: 0xdfe8ef, fog: 0xe8eef3, fogNear: 30, fogFar: 96, ground: 0xc4ced8, deck: 0xf2f4f6, structure: 0xffffff, structureDark: 0x9aa7b5, edge: 0x5b6878, lamp: 0x3a8dde, skyLight: 0xffffff, groundLight: 0xaab6c4 },
];
