// Approximate centroids for Nigeria's 36 states + FCT
// Used as fallback coordinates for LGA map markers

export const STATE_COORDS: Record<string, [number, number]> = {
  "Abia":         [5.4527,  7.5248],
  "Adamawa":      [9.3265, 12.3984],
  "Akwa Ibom":    [5.0077,  7.8493],
  "Anambra":      [6.2209,  7.0692],
  "Bauchi":       [10.3158, 9.8442],
  "Bayelsa":      [4.7719,  6.0699],
  "Benue":        [7.3369,  8.7408],
  "Borno":        [11.8846,13.1520],
  "Cross River":  [5.9630,  8.3396],
  "Delta":        [5.7039,  5.9366],
  "Ebonyi":       [6.2649,  8.0137],
  "Edo":          [6.3350,  5.6037],
  "Ekiti":        [7.6440,  5.2210],
  "Enugu":        [6.4584,  7.5464],
  "FCT":          [8.8940,  7.1860],
  "Gombe":        [10.2791,11.1673],
  "Imo":          [5.5720,  7.0588],
  "Jigawa":       [12.2280, 9.5616],
  "Kaduna":       [10.5264, 7.4398],
  "Kano":         [11.9964, 8.5131],
  "Katsina":      [12.9886, 7.6006],
  "Kebbi":        [12.4539, 4.1975],
  "Kogi":         [7.7337,  6.6906],
  "Kwara":        [8.9669,  4.3874],
  "Lagos":        [6.5244,  3.3792],
  "Nasarawa":     [8.4962,  8.1998],
  "Niger":        [9.9309,  5.5983],
  "Ogun":         [7.1475,  3.3495],
  "Ondo":         [7.2508,  5.2103],
  "Osun":         [7.5629,  4.5624],
  "Oyo":          [7.8499,  3.9301],
  "Plateau":      [9.2182,  9.5180],
  "Rivers":       [4.8156,  7.0498],
  "Sokoto":       [13.0059, 5.2476],
  "Taraba":       [7.8728, 11.3619],
  "Yobe":         [12.2939,11.7465],
  "Zamfara":      [12.1702, 6.6573],
};

export const NIGERIA_CENTER: [number, number] = [9.082, 8.675];
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [4.2, 2.7],   // SW
  [13.9, 14.7], // NE
];

// Returns coords for a state, or Nigeria center as fallback
export function getStateCoords(state: string): [number, number] {
  return STATE_COORDS[state] ?? NIGERIA_CENTER;
}

// Deterministic jitter for spreading LGAs within a state
// Uses LGA index to produce consistent offset
export function lgaCoords(state: string, index: number, total: number): [number, number] {
  const base = getStateCoords(state);
  if (total <= 1) return base;
  const angle = (index / total) * 2 * Math.PI;
  const radius = 0.35 + (index % 3) * 0.15;
  return [
    base[0] + radius * Math.sin(angle),
    base[1] + radius * Math.cos(angle),
  ];
}

// Project category colours for map markers
export const PROJECT_CATEGORY_COLORS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "#f97316", // orange
  HEALTH:               "#ef4444", // red
  EDUCATION:            "#3b82f6", // blue
  WATER:                "#0d9488", // teal
  AGRICULTURE:          "#22c55e", // green
  OTHER:                "#94a3b8", // slate
};

export const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "Roads & Infrastructure",
  HEALTH:               "Health",
  EDUCATION:            "Education",
  WATER:                "Water",
  AGRICULTURE:          "Agriculture",
  OTHER:                "Other",
};
