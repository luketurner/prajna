/**
 * Blue fabric background gradient configuration.
 * 2-3 semi-transparent gradient layers at different angles simulate
 * warp-and-weft threads catching light as the device tilts.
 * Colors stay within ~3-5% lightness of #246583.
 */

/** Layer definitions for the fabric effect */
export const FABRIC_LAYERS = [
  {
    // Horizontal "warp" threads
    colors: ["#22607E", "#276A88", "#246583", "#276A88", "#22607E"] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
    start: { x: 0, y: 0.48 },
    end: { x: 1, y: 0.52 },
    opacity: 0.4,
    tiltMultiplierX: 1.0,
    tiltMultiplierY: 0.2,
  },
  {
    // Vertical "weft" threads
    colors: ["#215E7B", "#286B89", "#246583", "#286B89", "#215E7B"] as const,
    locations: [0, 0.25, 0.5, 0.75, 1] as const,
    start: { x: 0.48, y: 0 },
    end: { x: 0.52, y: 1 },
    opacity: 0.35,
    tiltMultiplierX: 0.2,
    tiltMultiplierY: 1.0,
  },
  {
    // Diagonal sheen
    colors: ["#236281", "#296C8A", "#246583", "#296C8A", "#236281"] as const,
    locations: [0, 0.3, 0.5, 0.7, 1] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
    opacity: 0.3,
    tiltMultiplierX: 0.7,
    tiltMultiplierY: 0.7,
  },
] as const;

/** Oversize factors — smaller than GoldShimmer since movement is subtle */
export const FABRIC_OVERSIZE_X = 1.2;
export const FABRIC_OVERSIZE_Y = 1.15;
