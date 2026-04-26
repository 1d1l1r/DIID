function isValidCoords(lat: number, lon: number): boolean {
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

/**
 * Parse coordinates from any reasonable free-form input.
 *
 * Handles:
 *   - Standard dots:          "43.254418, 76.902194"  |  "43.254418 76.902194"
 *   - European comma-decimal: "50,754516, 78,538667"  |  "50,754516 78,538667"
 *   - Mixed:                  "50,754516 78.538667"
 *   - Negative:               "-50,75, -78,53"        |  "-50.75 -78.53"
 *   - Bare integers:          "50 78"
 */
export function parseCoords(input: string): { lat: number; lon: number } | null {
  const s = input.trim()
  if (!s) return null

  // ── Pass A: dot-decimal numbers ───────────────────────────────────────────
  // Match optional-sign + digits + optional(.digits)
  const dotNums = s.match(/-?\d+(?:\.\d+)?/g) ?? []

  if (dotNums.length >= 2) {
    const a = dotNums[0]!
    const b = dotNums[1]!
    // 2 tokens: trust unconditionally; >2 tokens: only if at least one looks like a decimal
    if (dotNums.length === 2 || a.includes('.') || b.includes('.')) {
      const lat = parseFloat(a)
      const lon = parseFloat(b)
      if (isValidCoords(lat, lon)) return { lat, lon }
    }
  }

  // ── Pass B: European comma-as-decimal ────────────────────────────────────
  // Extract all integer tokens (each carries its sign separately from the fraction)
  const ints = s.match(/-?\d+/g) ?? []

  if (ints.length === 4) {
    // "a,b [sep] c,d"  →  lat = a.b, lon = c.d
    // Strip any stray minus from the fractional part (e.g. "-50,-75" → -50.75)
    const lat = parseFloat(`${ints[0]}.${ints[1]!.replace('-', '')}`)
    const lon = parseFloat(`${ints[2]}.${ints[3]!.replace('-', '')}`)
    if (isValidCoords(lat, lon)) return { lat, lon }
  }

  if (ints.length === 2) {
    const lat = parseFloat(ints[0]!)
    const lon = parseFloat(ints[1]!)
    if (isValidCoords(lat, lon)) return { lat, lon }
  }

  if (ints.length === 3) {
    // "a,b [sep] c"
    const lat1 = parseFloat(`${ints[0]}.${ints[1]!.replace('-', '')}`)
    const lon1 = parseFloat(ints[2]!)
    if (isValidCoords(lat1, lon1)) return { lat: lat1, lon: lon1 }
    // "a [sep] b,c"
    const lat2 = parseFloat(ints[0]!)
    const lon2 = parseFloat(`${ints[1]}.${ints[2]!.replace('-', '')}`)
    if (isValidCoords(lat2, lon2)) return { lat: lat2, lon: lon2 }
  }

  return null
}

/** Format lat/lon to 6 decimal places */
export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
}
