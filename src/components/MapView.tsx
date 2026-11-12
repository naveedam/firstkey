import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface Pin { id: string; lat: number; lng: number; label: string }

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export default function MapView({ pins, activeId, onPick }: { pins: Pin[]; activeId: string | null; onPick: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const pinKey = pins.map(p => p.id).join(',')

  useEffect(() => {
    const m = new maplibregl.Map({ container: el.current!, style: STYLE, center: [77.6, 12.97], zoom: 10.5 })
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.current = m
    return () => { m.remove(); map.current = null }
  }, [])

  useEffect(() => {
    const m = map.current
    if (!m) return
    markers.current.forEach(x => x.remove())
    markers.current = pins.map(p => {
      const node = document.createElement('button')
      node.type = 'button'
      node.className = p.id === activeId ? 'pin active' : 'pin'
      node.textContent = p.label
      node.onclick = () => onPick(p.id)
      return new maplibregl.Marker({ element: node }).setLngLat([p.lng, p.lat]).addTo(m)
    })
  }, [pins, activeId, onPick])

  useEffect(() => {
    const m = map.current
    if (!m || pins.length === 0) return
    const b = new maplibregl.LngLatBounds()
    pins.forEach(p => b.extend([p.lng, p.lat]))
    m.fitBounds(b, { padding: 60, maxZoom: 14, duration: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinKey])

  return <div ref={el} className="map" />
}
