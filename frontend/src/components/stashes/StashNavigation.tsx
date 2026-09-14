import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, RefreshCw, X } from 'lucide-react'
import { useT } from '../../lib/i18n'
import { distanceBetween, requestRoute, type Point, type TravelMode, type WalkingRoute, type RouteStep } from '../../lib/navigation'

const buttonCls = 'px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 disabled:opacity-40'

export default function StashNavigation({ latitude, longitude, onClose }: {
  latitude: number; longitude: number; onClose: () => void
}) {
  const t = useT().navigation
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const locationLayer = useRef<L.LayerGroup | null>(null)
  const routeLayer = useRef<L.LayerGroup | null>(null)
  const [mode, setMode] = useState<TravelMode>('foot')
  const [refresh, setRefresh] = useState(0)
  const [position, setPosition] = useState<{ point: Point; accuracy: number } | null>(null)
  const [route, setRoute] = useState<WalkingRoute | null>(null)
  const geoAvailable = window.isSecureContext && Boolean(navigator.geolocation)
  const [error, setError] = useState(geoAvailable ? '' : t.geo_unavailable)
  const [tileError, setTileError] = useState(false)
  const [loading, setLoading] = useState(geoAvailable)

  useEffect(() => {
    const map = L.map(container.current!).setView([latitude, longitude], 15)
    mapRef.current = map
    L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(map)
    L.circleMarker([latitude, longitude], { radius: 9, color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }).addTo(map)
    locationLayer.current = L.layerGroup().addTo(map)
    routeLayer.current = L.layerGroup().addTo(map)
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container.current!)
    return () => { observer.disconnect(); map.remove(); mapRef.current = null }
  }, [latitude, longitude])

  useEffect(() => {
    let active = true
    let request: AbortController | null = null
    let lastAttempt = 0
    let lastStart: Point | null = null
    let busy = false
    let positionVersion = 0
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const getRoute = async (point: Point) => {
      if (busy) return
      busy = true
      lastAttempt = Date.now()
      request = new AbortController()
      const controller = request
      const version = positionVersion
      const timeout = setTimeout(() => controller.abort(), 20000)
      timers.add(timeout)
      setLoading(true)
      try {
        const next = await requestRoute(point, [latitude, longitude], mode, controller.signal)
        if (!active || version !== positionVersion) return
        lastStart = point
        setRoute(next)
        setError('')
      } catch (err) {
        if (active && version === positionVersion) { setRoute(null); setError(err instanceof Error && err.message === 'no_route' ? t.no_route : t.route_failed) }
      } finally {
        clearTimeout(timeout)
        timers.delete(timeout)
        busy = false
        if (active) setLoading(false)
      }
    }
    if (!geoAvailable) return
    const watch = navigator.geolocation.watchPosition(({ coords }) => {
      if (!active) return
      const point: Point = [coords.latitude, coords.longitude]
      setPosition({ point, accuracy: coords.accuracy })
      // Recalculate only after meaningful movement, at most once per 45 seconds.
      if (lastAttempt === 0 || (Date.now() - lastAttempt > 45000 && (!lastStart || distanceBetween(lastStart, point) > 40))) void getRoute(point)
    }, err => {
      if (!active) return
      positionVersion++
      request?.abort()
      lastAttempt = 0
      lastStart = null
      setRoute(null)
      setError(err.code === 1 ? t.geo_denied : err.code === 3 ? t.geo_timeout : t.geo_unavailable)
      setPosition(null)
      setLoading(false)
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 })
    return () => {
      active = false
      navigator.geolocation.clearWatch(watch)
      request?.abort()
      timers.forEach(clearTimeout)
    }
  }, [latitude, longitude, mode, refresh, t, geoAvailable])

  useEffect(() => {
    locationLayer.current?.clearLayers()
    if (position && locationLayer.current) {
      L.circle(position.point, { radius: position.accuracy, color: '#60a5fa', weight: 1, fillOpacity: .1 }).addTo(locationLayer.current)
      L.circleMarker(position.point, { radius: 7, color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }).addTo(locationLayer.current)
    }
  }, [position])

  useEffect(() => {
    routeLayer.current?.clearLayers()
    if (!route || !routeLayer.current || !mapRef.current) return
    const line = L.polyline(route.points, { color: '#6366f1', weight: 5 }).addTo(routeLayer.current)
    // Keep the exact stash visible even when the router snaps to a nearby path.
    L.polyline([route.points[route.points.length - 1], [latitude, longitude]], { color: '#10b981', dashArray: '5 7', weight: 2 }).addTo(routeLayer.current)
    mapRef.current.fitBounds(line.getBounds().extend([latitude, longitude]), { padding: [30, 30], maxZoom: 17 })
  }, [route, latitude, longitude])

  function restart(nextMode = mode) {
    setMode(nextMode)
    setRefresh(v => v + 1)
    setRoute(null)
    setPosition(null)
    setError(geoAvailable ? '' : t.geo_unavailable)
    setLoading(geoAvailable)
  }

  function instruction(step: RouteStep) {
    const modifier = step.maneuver.modifier
    let label = modifier?.includes('left') ? t.left : modifier?.includes('right') ? t.right : modifier === 'uturn' ? t.uturn : t.straight
    if (step.maneuver.type === 'depart') label = t.depart
    if (step.maneuver.type === 'arrive') label = t.arrive
    if (step.maneuver.type.includes('roundabout') || step.maneuver.type === 'rotary') label = t.roundabout + (step.maneuver.exit ? ` ${step.maneuver.exit}` : '')
    return `${label}${step.name ? ` · ${step.name}` : ''}`
  }
  function distance(metres: number) { return metres < 1000 ? `${Math.round(metres)} ${t.m}` : `${(metres / 1000).toFixed(1)} ${t.km}` }
  const direct = position ? distanceBetween(position.point, [latitude, longitude]) : null

  return <section className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden mb-4" aria-label={t.title}>
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-zinc-200">{t.title}</h2>
        <button className={buttonCls} onClick={onClose} aria-label={t.close}><X size={16} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select aria-label={t.mode} value={mode} onChange={e => restart(e.target.value as TravelMode)} className={buttonCls}>
          <option value="foot">{t.foot}</option><option value="car">{t.car}</option>
        </select>
        <button className={buttonCls + ' flex items-center gap-2'} disabled={loading} onClick={() => restart()}><RefreshCw size={14} />{t.recalculate}</button>
        <button className={buttonCls} disabled={!position} aria-label={t.my_location} onClick={() => position && mapRef.current?.setView(position.point, 17)}><LocateFixed size={16} /></button>
      </div>
      <div aria-live="polite" className="text-sm text-zinc-400">
        {loading && <p>{position ? t.routing : t.locating}</p>}
        {error && <p role="alert" className="text-amber-400">{error}</p>}
        {tileError && <p className="text-amber-400">{t.tiles_failed}</p>}
        {route && <p>{t.route_length}: {distance(route.distance)} · ~{Math.max(1, Math.round(route.duration / 60))} {t.min}</p>}
        {direct !== null && <p>{t.direct}: {distance(direct)} · {t.accuracy}: ±{distance(position!.accuracy)}</p>}
        {direct !== null && direct < 20 && position!.accuracy < 30 && <p className="text-emerald-400">{t.nearby}</p>}
      </div>
    </div>
    <div ref={container} className="h-80 w-full isolate" aria-label={t.map} />
    <div className="p-3 text-xs text-zinc-500 space-y-2">
      <p>{t.legend}</p><p>{t.foreground}</p>
      {route && distanceBetween(route.points[route.points.length - 1], [latitude, longitude]) > 20 && <p className="text-amber-400">{t.last_leg}</p>}
      {route && <details><summary className="cursor-pointer text-zinc-300">{t.steps}</summary>
        <ol className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {route.steps.map((step, index) => <li key={index} className="flex gap-2"><span>{index + 1}.</span><span>{instruction(step)} — {distance(step.distance)}</span></li>)}
        </ol>
      </details>}
      <p><a className="underline" href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noreferrer">{t.routing_credit}</a> · <a className="underline" href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">{t.fix_map}</a></p>
    </div>
  </section>
}
