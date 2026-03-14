"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Building2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'

// Fix default icon just in case, though we will override it per marker
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
    status: string
    violations: number
    lat: number
    lng: number
    image: string
    compliance_score?: string
    open_tickets?: number
}

// Function to generate a dynamic DivIcon based on status/violations
const createCustomIcon = (status: string, violations: number) => {
    let colorClass = "bg-emerald-500 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)]"
    let icon = <ShieldCheck className="w-4 h-4 text-white" />

    if (status === 'Pending Verification') {
        colorClass = "bg-sky-400 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.7)]"
        icon = <Building2 className="w-4 h-4 text-white" />
    } else if (violations > 0 || status === 'Critical' || status === 'Warning') {
        colorClass = (violations > 5 || status === 'Critical')
            ? "bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse"
            : "bg-amber-500 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.7)]"

        icon = violations > 0 ? <span className="text-white font-bold text-[10px]">{violations}</span> : <AlertTriangle className="w-4 h-4 text-white" />
    }

    const htmlString = renderToStaticMarkup(
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
    )

    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: htmlString,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    })
}

export default function MapViewer({ properties, onSelectProperty }: { properties: Property[], onSelectProperty?: (p: Property) => void }) {
    // Prevent SSR hydration mismatch for map
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => { setIsMounted(true) }, [])

    if (!isMounted) return <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500">Loading Map...</div>

    return (
        <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100%', width: '100%' }} attributionControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {properties.map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={createCustomIcon(p.status, p.violations)}>
                    <Popup className="bg-slate-900 text-white min-w-[200px]">
                        <div className="text-center">
                            <strong className="block mb-2 text-base text-white">{p.address}</strong>
                            <div className="flex justify-center mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
                                    p.status === 'Pending Verification' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                                    p.violations > 0 || p.status === 'Critical' || p.status === 'Warning' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                    {p.status === 'Pending Verification' ? 'Pending Verification' : p.violations > 0 ? `${p.violations} Open Violations` : 'Compliant'}
                                </span>
                            </div>
                            <button
                                onClick={() => onSelectProperty?.(p)}
                                className="w-full bg-indigo-500 hover:bg-sky-400 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors shadow-lg"
                            >
                                View Live Details
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
