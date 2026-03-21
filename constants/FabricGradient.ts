/**
 * Blue fabric background gradient configuration.
 * 2-3 semi-transparent gradient layers at different angles simulate
 * warp-and-weft threads catching light as the device tilts.
 */

/** Layer definitions for the fabric effect */
export const FABRIC_LAYERS = [
  {
    // Horizontal "warp" threads
    colors: ["#1E5874", "#2A7293", "#246583", "#2A7293", "#1E5874"] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
    start: { x: 0, y: 0.46 },
    end: { x: 1, y: 0.54 },
    opacity: 0.55,
    tiltMultiplierX: 1.0,
    tiltMultiplierY: 0.2,
  },
  {
    // Vertical "weft" threads
    colors: ["#1E5772", "#2C769D", "#246583", "#2C769D", "#1E5772"] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
    start: { x: 0.46, y: 0 },
    end: { x: 0.54, y: 1 },
    opacity: 0.48,
    tiltMultiplierX: 0.2,
    tiltMultiplierY: 1.0,
  },
  {
    // Diagonal sheen
    colors: ["#1F5B76", "#30789A", "#246583", "#30789A", "#1F5B76"] as const,
    locations: [0, 0.3, 0.5, 0.7, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    opacity: 0.4,
    tiltMultiplierX: 0.7,
    tiltMultiplierY: 0.7,
  },
] as const;

/** Oversize factors — movement range when tilting */
export const FABRIC_OVERSIZE_X = 1.25;
export const FABRIC_OVERSIZE_Y = 1.18;
