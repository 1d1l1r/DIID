/** Extract two decimal numbers from any free-form string and validate as lat/lon */
export function parseCoords(input: string): { lat: number; lon: number } | null {
  const nums = input.match(/-?\d+\.?\d*/g)
  if (!nums || nums.length < 2) return null
  const lat = parseFloat(nums[0])
  const lon = parseFloat(nums[1])
  if (isNaN(lat) || isNaN(lon)) return null
  if (lat < -90 || lat > 90) return null
  if (lon < -180 || lon > 180) return null
  return { lat, lon }
}

/** Format lat/lon to 6 decimal places */
export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
}
