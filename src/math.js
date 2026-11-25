export function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function normalize(x, y) {
  const len = Math.hypot(x, y);
  if (len < 1e-8) return { x: 0, y: 0, len: 0 };
  return { x: x / len, y: y / len, len };
}

export function angleBetween(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/**
 * Shortest distance from point (px, py) to line segment (ax, ay)-(bx, by).
 */
export function pointToSegmentDistSq(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq < 1e-8) return distSq(px, py, ax, ay);
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / abLenSq, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return distSq(px, py, cx, cy);
}

export function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
  return pointToSegmentDistSq(cx, cy, ax, ay, bx, by) <= r * r;
}

/**
 * Orders an array of 2D points counter-clockwise around their centroid
 * so that 3+ tethered targets always form a clean, non-self-intersecting polygon.
 */
export function orderPolygonPoints(points) {
  if (points.length <= 2) return points.slice();
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    cx += points[i].x;
    cy += points[i].y;
  }
  cx /= points.length;
  cy /= points.length;

  return points
    .slice()
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
}

export function polygonCentroid(poly) {
  if (!poly.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (let i = 0; i < poly.length; i++) {
    x += poly[i].x;
    y += poly[i].y;
  }
  return { x: x / poly.length, y: y / poly.length };
}

export function polygonArea(poly) {
  if (poly.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    area += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return Math.abs(area) * 0.5;
}

/**
 * Ray-casting point-in-polygon check with an optional generous padding radius
 * so enemies straddling the glowing golden edge still count as sealed.
 */
export function pointInPolygon(px, py, poly, edgePadding = 0) {
  if (poly.length < 3) return false;

  if (edgePadding > 0) {
    const padSq = edgePadding * edgePadding;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if (pointToSegmentDistSq(px, py, a.x, a.y, b.x, b.y) <= padSq) {
        return true;
      }
    }
  }

  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Deterministic mulberry32 PRNG for reproducible tests or seeded runs.
 */
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
