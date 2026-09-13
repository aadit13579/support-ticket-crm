/** Deterministic avatar color from a name string.
 *  Same name → same color across every render. */
const PALETTE = [
  "#e05c5c", // red
  "#e07c3c", // orange
  "#d4a017", // amber
  "#4caf7d", // green
  "#33B8CC", // teal (accent)
  "#5c8de0", // blue
  "#9b6ee0", // violet
  "#c05ca0", // pink
];

export function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
