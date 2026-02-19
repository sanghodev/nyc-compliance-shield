"use client"

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet Icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Property {
    id: number
    address: string
    borough: string
    units: number
    status: "Critical" | "Warning" | "Good" | string
    violations: number
    lat: number
    lng: number
    image: string
    compliance_score?: string
    open_tickets?: number
}

export default function MapViewer({ properties, onSelectProperty }: { properties: Property[], onSelectProperty?: (p: Property) => void }) {
    return (
        <MapContainer center={[40.7128, -74.0060]} zoom={12} style={{ height: '100%', width: '100%' }} attributionControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {properties.map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]}>
                    <Popup className="bg-slate-900 text-white min-w-[200px]">
                        <div className="p-2 text-center text-slate-900">
                            <strong className="block mb-2 text-base">{p.address}</strong>
                            <div className="flex justify-center mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {p.status} ({p.violations} Violations)
                                </span>
                            </div>
                            <button
                                onClick={() => onSelectProperty?.(p)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
