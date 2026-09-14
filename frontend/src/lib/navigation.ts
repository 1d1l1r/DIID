export type TravelMode = 'foot' | 'car'
export type Point = [number, number] // latitude, longitude (Leaflet order)
export interface RouteStep {
  name: string
  distance: number
  maneuver: { type: string; modifier?: string; exit?: number; location: [number, number] }
}
export interface WalkingRoute {
  points: Point[]
  distance: number
  duration: number
  steps: RouteStep[]
}

export function distanceBetween(a: Point, b: Point) {
  const rad = Math.PI / 180
  const h = Math.sin((b[0] - a[0]) * rad / 2) ** 2
    + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin((b[1] - a[1]) * rad / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)))
}

let nextRequestAt = 0

async function routingSlot(signal: AbortSignal) {
  signal.throwIfAborted()
  const wait = Math.max(0, nextRequestAt - Date.now())
  nextRequestAt = Date.now() + wait + 1100
  if (!wait) return
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, wait)
    signal.addEventListener('abort', abort, { once: true })
  })
  signal.throwIfAborted()
}

export async function requestRoute(from: Point, to: Point, mode: TravelMode, signal: AbortSignal): Promise<WalkingRoute> {
  // Also rate-limit rapid mode changes / retries (FOSSGIS: max one request/sec).
  await routingSlot(signal)
  const base = mode === 'foot'
    ? import.meta.env.VITE_ROUTING_FOOT_URL || 'https://routing.openstreetmap.de/routed-foot'
    : import.meta.env.VITE_ROUTING_CAR_URL || 'https://routing.openstreetmap.de/routed-car'
  const coords = [from, to].map(([lat, lon]) => `${lon},${lat}`).join(';')
  // OSRM's actual travel profile is built into each server, not the URL profile label.
  const response = await fetch(`${base.replace(/\/$/, '')}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`, {
    signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin',
  })
  if (!response.ok) throw new Error('route_failed')
  const body = await response.json()
  if (body.code === 'NoRoute' || body.code === 'NoSegment') throw new Error('no_route')
  const route = body.routes?.[0]
  if (body.code !== 'Ok' || !route || !Array.isArray(route.geometry?.coordinates)
    || route.geometry.coordinates.length < 2 || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new Error('route_failed')
  }
  const points = route.geometry.coordinates.map((point: number[]) => {
    if (point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || Math.abs(point[0]) > 180 || Math.abs(point[1]) > 90) throw new Error('route_failed')
    return [point[1], point[0]] as Point
  })
  return { points, distance: route.distance, duration: route.duration, steps: route.legs?.flatMap((leg: { steps?: RouteStep[] }) => leg.steps ?? []) ?? [] }
}
