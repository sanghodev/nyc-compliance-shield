"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, Building2, Map as MapIcon, Users, FileText,
  Settings, Bell, Search, Plus, ExternalLink, ChevronRight,
  MoreHorizontal, Wrench, CheckCircle, AlertTriangle, Filter, CreditCard,
  ArrowUpRight, Download, Activity, Calendar, X, Upload, MessageSquare, Send, Eye,
  Grid, List as ListIcon, Shield, Zap, BarChart3, ChevronDown, ChevronUp,
  Home, ClipboardList, PenTool, Phone, UserCircle, Clock, Smartphone, Lock, ShieldCheck, Trash2,
  Sparkles, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Dynamic imports for Map
import dynamic from 'next/dynamic'
const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false })
import { supabase } from "@/lib/supabaseClient"
import { AuthModal } from "@/components/AuthModal"

// --- Types ---
type UserRole = "manager" | "tenant" | "admin" | "contractor" | null

interface Property {
  id: number
  address: string
  name?: string // Building Name / Nickname
  borough: string
  units: number
  status: "Critical" | "Warning" | "Good" | string
  violations: number
  lat: number
  lng: number
  image: string
  compliance_score?: string
  open_tickets?: number
  access_code?: string
  bin?: string
  bbl?: string
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  bin?: string
  bbl?: string
}

interface Contractor {
  id: number
  name: string
  type: string
  category: string
  company?: string
  location?: string
  image?: string
  phone?: string
  email?: string
  status: string
  rating?: number
  jobs?: number
  reviews?: number
  verified?: boolean
}

interface Document {
  id: number
  name: string
  type: "PDF" | "DOC" | "IMG"
  category: "Lease" | "Legal" | "Maintenance" | "Financial"
  date: string
  size: string
  thumbnail: string
}

interface TenantRequest {
  id: number
  tenantName: string
  tenant_name?: string
  unit: string
  issue: string
  description?: string
  desc?: string
  type: string
  status: string
  date?: string
  created_at?: string
  priority: string
  contact_preference?: string
  assigned_pro_id?: number
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: string
  status: "Pending" | "Active" | "Suspended"
  created_at: string
}

// --- Mock Data ---
const initialProperties: Property[] = [
  { id: 1, address: "123 Broadway, NY", borough: "Manhattan", units: 12, status: "Critical", violations: 5, lat: 40.7128, lng: -74.0060, image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=400" },
  { id: 2, address: "450 5th Ave, NY", borough: "Manhattan", units: 45, status: "Warning", violations: 2, lat: 40.7527, lng: -73.9822, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400" },
  { id: 3, address: "789 Bedford Ave, BK", borough: "Brooklyn", units: 8, status: "Good", violations: 0, lat: 40.6960, lng: -73.9575, image: "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?auto=format&fit=crop&w=400" },
]

const initialContractors: Contractor[] = [
  { id: 1, name: "Mario Bros Plumbing", type: "Plumbing", category: "Plumbing", rating: 4.9, status: "Available", jobs: 12, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mario" },
  { id: 2, name: "Sparky Electric", type: "Electrical", category: "Electrical", rating: 4.7, status: "Busy", jobs: 8, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sparky" },
  { id: 3, name: "NYC Fix-It All", type: "General", category: "General", rating: 4.5, status: "Available", jobs: 24, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fix" },
  { id: 4, name: "Legal Eagles LLP", type: "Legal", category: "Legal", rating: 5.0, status: "Connected", jobs: 5, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Legal" },
]

const initialDocuments: Document[] = [
  { id: 1, name: "2024_HPD_Registration_123B.pdf", type: "PDF", category: "Legal", date: "2024-01-15", size: "2.4 MB", thumbnail: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=500" },
  { id: 2, name: "Commercial_Lease_Unit_4B.pdf", type: "PDF", category: "Lease", date: "2024-02-10", size: "1.8 MB", thumbnail: "https://images.unsplash.com/photo-1633519159020-00df2864380c?auto=format&fit=crop&w=500" },
  { id: 3, name: "Boiler_Inspection_Report.pdf", type: "PDF", category: "Maintenance", date: "2024-03-01", size: "4.2 MB", thumbnail: "https://images.unsplash.com/photo-1581092921461-eab62e97a782?auto=format&fit=crop&w=500" },
  { id: 4, name: "Q1_Financial_Statement.xlsx", type: "DOC", category: "Financial", date: "2024-04-05", size: "850 KB", thumbnail: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500" },
]

const initialRequests: TenantRequest[] = [
  { id: 1, tenantName: "Sarah Jenkins", unit: "4B (123 Broadway)", issue: "Leaking faucet in bathroom", type: "Repair", status: "Pending", date: "Today, 10:30 AM", priority: "Medium" },
  { id: 2, tenantName: "Mike Ross", unit: "2A (450 5th Ave)", issue: "Heater making loud noise", type: "Repair", status: "Assigned", date: "Yesterday", priority: "High" },
]

// --- LANDING PAGE COMPONENT ---
interface LandingPageProps {
  onEnter: (role: UserRole, tier?: string) => void
  publicSearchQuery: string
  handlePublicSearch: (q: string) => void
  handleSearchSubmit: (e?: React.FormEvent) => void
  isPublicSearching: boolean
  publicSearchResults: SearchResult[]
  selectPublicAddress: (result: SearchResult) => void
}

function LandingPage({ onEnter, publicSearchQuery, handlePublicSearch, handleSearchSubmit, isPublicSearching, publicSearchResults, selectPublicAddress }: LandingPageProps) {
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 200])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 1.2])

  const [isScrolled, setIsScrolled] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  useEffect(() => { return scrollY.onChange((latest) => setIsScrolled(latest > 50)) }, [scrollY])

  return (
    <div className="bg-black text-white overflow-x-hidden font-sans relative">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Building2 className={`w-6 h-6 ${isScrolled ? 'text-blue-500' : 'text-white'}`} />
            <span>Asset<span className="text-gray-400">Guard</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 transition-colors" onClick={() => onEnter("tenant")}>Tenant Portal</Button>
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6 transition-colors" onClick={() => onEnter("manager")}>Manager Login</Button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="h-screen relative flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: y1, scale }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black z-10"></div>
          <img src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000" className="w-full h-full object-cover opacity-60" alt="NYC Skyline" />
        </motion.div>
        <motion.div style={{ opacity }} className="relative z-20 text-center space-y-8 px-4 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <Badge className="mb-4 bg-white/10 text-white hover:bg-white/20 border-white/20 px-4 py-1 text-sm transition-colors">🚀 Now servicing 500+ NYC Buildings</Badge>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[1.1]">
              Property Management.<br />Re-imagined by AI.
            </h1>
          </motion.div>

          {/* Public Search Input */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-xl mx-auto relative pt-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <form
                onSubmit={handleSearchSubmit}
                className="relative bg-zinc-900 ring-1 ring-gray-800 rounded-xl flex items-center p-2 shadow-2xl"
              >
                <Search className="text-gray-400 w-5 h-5 ml-3" />
                <Input
                  placeholder="Search NYC address (e.g. 123 Broadway)"
                  className="bg-transparent border-none text-white h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-600 flex-1"
                  value={publicSearchQuery}
                  onChange={(e) => handlePublicSearch(e.target.value)}
                />
                {isPublicSearching ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin mr-3"></div>
                ) : (
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-bold transition-all">
                    Search
                  </Button>
                )}
              </form>
            </div>

            {/* Public Search Results Dropdown */}
            {publicSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 border border-zinc-700/50 rounded-lg shadow-2xl overflow-hidden z-[100] max-h-[300px] overflow-y-auto text-left backdrop-blur-md">
                {publicSearchResults.map((result, i) => (
                  <div
                    key={i}
                    onClick={() => selectPublicAddress(result)}
                    className="p-4 text-gray-300 hover:bg-blue-600/20 hover:text-white cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <MapIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="truncate">{result.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex justify-center gap-4 pt-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full h-12 text-lg" onClick={() => onEnter("manager")}>Get Started</Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 rounded-full h-12 text-lg" onClick={() => setShowDemo(true)}>Watch Demo</Button>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. STATS BAR */}
      <div className="border-y border-white/10 bg-black/50 backdrop-blur-sm py-8 relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: "$2M+", label: "Fines Prevented" },
            { val: "24/7", label: "AI Monitoring" },
            { val: "15min", label: "Avg. Response Time" },
            { val: "500+", label: "Buildings Secured" }
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-3xl font-bold text-white">{stat.val}</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PROBLEM / SOLUTION */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Why AssetGuard?</h2>
            <p className="text-xl text-gray-400">Old ways vs. The New Way</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-red-500 font-bold text-xl"><X className="w-6 h-6" /> Traditional Way</div>
              <ul className="space-y-4 text-left text-gray-400">
                <li className="flex gap-3"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> Missed violation hearings & fines</li>
                <li className="flex gap-3"><FileText className="w-5 h-5 text-red-500 shrink-0" /> Endless manual paperwork</li>
                <li className="flex gap-3"><Phone className="w-5 h-5 text-red-500 shrink-0" /> Angry late-night tenant calls</li>
                <li className="flex gap-3"><Clock className="w-5 h-5 text-red-500 shrink-0" /> Days wasted finding contractors</li>
              </ul>
            </div>

            <div className="border border-green-500/20 bg-green-500/5 rounded-2xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-40 h-40 text-green-500" /></div>
              <div className="flex items-center gap-3 text-green-500 font-bold text-xl"><CheckCircle className="w-6 h-6" /> AssetGuard Way</div>
              <ul className="space-y-4 text-left text-gray-300">
                <li className="flex gap-3"><Zap className="w-5 h-5 text-green-500 shrink-0" /> Proactive AI alerts before fines hit</li>
                <li className="flex gap-3"><PenTool className="w-5 h-5 text-green-500 shrink-0" /> 1-Click Affidavit Generation</li>
                <li className="flex gap-3"><Smartphone className="w-5 h-5 text-green-500 shrink-0" /> Self-service Tenant Mobile App</li>
                <li className="flex gap-3"><Users className="w-5 h-5 text-green-500 shrink-0" /> Instant access to vetted Pros</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE DEEP DIVE 1: MAP */}
      <section className="py-24 px-6 flex justify-center bg-black border-t border-zinc-900">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
            <Badge className="bg-blue-600/20 text-blue-400 mb-2 hover:bg-blue-600/30">God-Mode Visibility</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">See every issue.<br /><span className="text-gray-500">In Real-Time.</span></h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Our 3D Satellite Map integrates directly with <span className="text-white font-bold">5+ NYC Government APIs</span>. Monitor <span className="text-blue-400">Violations</span>, <span className="text-red-400">Litigation</span>, <span className="text-orange-400">311 Complaints</span>, <span className="text-green-400">Registrations</span>, and <span className="text-yellow-400">Charges</span> in real-time.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-gray-300 bg-zinc-900 p-3 rounded-lg border border-zinc-800"><MapIcon className="text-blue-500" /> Live NYC DOB/HPD Data Sync</div>
              <div className="flex items-center gap-3 text-gray-300 bg-zinc-900 p-3 rounded-lg border border-zinc-800"><Activity className="text-green-500" /> Portfolio Health Score</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800" className="relative rounded-xl border border-white/10 shadow-2xl z-10" alt="Map Interface" />
            {/* UI Overlay Mockup */}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur p-4 rounded-lg border border-white/10 z-20 shadow-xl hidden md:block">
              <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> <span className="text-xs font-bold">New Violation Detected</span></div>
              <div className="text-xs text-gray-400">123 Broadway: Elevators</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. FEATURE DEEP DIVE 2: AI & PROS */}
      <section className="py-24 px-6 flex justify-center bg-zinc-950">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="order-2 md:order-1 relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800" className="relative rounded-xl border border-white/10 shadow-2xl z-10" alt="AI Dashboard" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 p-6 rounded-2xl border border-white/20 z-20 shadow-2xl text-center w-64">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><Zap className="text-white" /></div>
              <div className="font-bold text-white mb-1">Affidavit Generated</div>
              <div className="text-xs text-gray-400">Sent to Law Dept (14s ago)</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} className="order-1 md:order-2 space-y-6">
            <Badge className="bg-purple-600/20 text-purple-400 mb-2 hover:bg-purple-600/30">AI Automation</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Your 24/7 Legal &<br /><span className="text-gray-500">Maintenance Team.</span></h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Detected a violation? Our AI writes the legal defense instantly. Leaking pipe? We find the highest-rated plumber in zip code 10001 and dispatch them instantly.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <FileText className="text-purple-500 mb-2" />
                <h4 className="font-bold text-sm">Auto-Docs</h4>
                <p className="text-xs text-gray-500">Leases & Affidavits</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <Users className="text-orange-500 mb-2" />
                <h4 className="font-bold text-sm">Pro Network</h4>
                <p className="text-xs text-gray-500">Vetted Contractors</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. GRID OF BENEFITS */}
      <section className="py-24 px-6 bg-black border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">Why Top Managers Switch</h2>
            <p className="text-gray-400">Everything you need to scale your portfolio.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: "Mobile Command", desc: "Run your entire empire from your pocket. Full functionality on iOS & Android." },
              { icon: Clock, title: "Zero Latency", desc: "Data streams in real-time. No more waiting for monthly reports to see problems." },
              { icon: Lock, title: "Bank-Grade Security", desc: "AES-256 encryption ensures your tenant data and financial records are impenetrable." },
              { icon: BarChart3, title: "Financial Forecasts", desc: "AI predicts future maintenance costs based on building age and open violations." },
              { icon: MessageSquare, title: "Tenant Chat", desc: "Centralized messaging platform. Keep all communications professional and recorded." },
              { icon: Shield, title: "Compliance Shield", desc: "Guaranteed compliance with Local Law 97, 152, and 87. Never miss a deadline." },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 text-white">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING & MEMBERSHIP */}
      <section className="py-24 px-6 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Membership Plans</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Transparent pricing for portfolios of all sizes.
              <br /><span className="text-blue-500">Contractors?</span> You join free & pay commission only on completed jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* TIER 1: STARTER */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-black border border-zinc-800 flex flex-col relative overflow-hidden group">
              <div className="text-gray-400 font-bold tracking-widest text-sm mb-4">STARTER</div>
              <div className="text-5xl font-bold text-white mb-2">$29<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <p className="text-gray-400 mb-8">Perfect for self-managing owners.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Up to 3 Units</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Basic AI Violation Alerts</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Access to Pro Marketplace</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Tenant Mobile App</li>
              </ul>
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-6 rounded-xl" onClick={() => onEnter("manager", "Starter")}>Start Free Trial</Button>
            </motion.div>

            {/* TIER 2: GROWTH (POPULAR) */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-zinc-900 border border-blue-500 relative flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">MOST POPULAR</div>
              <div className="text-blue-400 font-bold tracking-widest text-sm mb-4 uppercase">Growth</div>
              <div className="text-5xl font-bold text-white mb-2">$99<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <p className="text-gray-400 mb-8">For growing portfolios needing automation.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-blue-500" /> Up to 20 Units</li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-blue-500" /> <b>Instant AI Affidavits</b></li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-blue-500" /> Priority Pro Dispatch</li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-blue-500" /> Financial Forecasting</li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-900/40" onClick={() => onEnter("manager", "Growth")}>Get Started</Button>
            </motion.div>

            {/* TIER 3: ENTERPRISE / ASKING */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 to-black border border-purple-500/30 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 z-0"></div>
              <div className="relative z-10">
                <div className="text-purple-400 font-bold tracking-widest text-sm mb-4 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4" /> AssetGuard Premium</div>
                <div className="text-4xl font-bold text-white mb-2">Custom<span className="text-lg text-gray-500 font-normal"></span></div>
                <p className="text-gray-400 mb-8">We manage everything for you.</p>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> <b>Unlimited Units</b></li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> Dedicated Asset Manager</li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> 24/7 White-Glove Support</li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> Full Legal Representation</li>
                </ul>
                <Button className="w-full bg-white hover:bg-gray-200 text-black font-bold py-6 rounded-xl" onClick={() => window.open('mailto:sales@assetguard.com')}>Contact Sales</Button>
              </div>
            </motion.div>
          </div>

          {/* CONTRACTOR COMMISSION NOTE */}
          <div className="mt-16 bg-zinc-900/50 rounded-2xl p-8 border border-dashed border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2"><Wrench className="w-5 h-5 text-orange-500" /> Are you a top-rated Contractor?</h3>
              <p className="text-gray-400 text-sm max-w-xl">Join our exclusive network. No monthly fees. You only pay a small commission when you get paid for a job.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-950 px-6 py-4 rounded-xl" onClick={() => window.open('tel:+12125550199')}>Call Us</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-xl" onClick={() => window.open('mailto:partners@assetguard.com')}>Email Us</Button>
            </div>
          </div>

        </div>
      </section>

      {/* 8. CTA / ROLE SELECTION */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=2000')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

        <div className="relative z-10 space-y-12 w-full max-w-4xl">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg tracking-tight">Ready to upgrade?</h2>
            <p className="text-xl text-gray-300">Choose your portal to get started.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6">
            <Button onClick={() => onEnter("manager")} className="group h-auto py-8 px-8 rounded-3xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700 hover:bg-zinc-800 hover:border-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all flex flex-col w-full md:w-80">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><Building2 className="w-8 h-8" /></div>
              <div><h3 className="text-2xl font-bold mb-1 text-white">Property Manager</h3><p className="text-sm text-gray-300 font-normal">Full control over portfolio.</p></div>
              <div className="mt-6 flex items-center text-blue-400 text-sm font-bold group-hover:gap-2 transition-all">Values Access <ArrowUpRight className="w-4 h-4 ml-1" /></div>
            </Button>
            <Button onClick={() => onEnter("tenant")} className="group h-auto py-8 px-8 rounded-3xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700 hover:bg-zinc-800 hover:border-green-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all flex flex-col w-full md:w-80">
              <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><Home className="w-8 h-8" /></div>
              <div><h3 className="text-2xl font-bold mb-1 text-white">Tenant Portal</h3><p className="text-sm text-gray-300 font-normal">Pay rent & request repairs.</p></div>
              <div className="mt-6 flex items-center text-green-400 text-sm font-bold group-hover:gap-2 transition-all">Resident Access <ArrowUpRight className="w-4 h-4 ml-1" /></div>
            </Button>
          </div>

          <div className="pt-12 animate-fade-in delay-500">
            <button onClick={() => onEnter("admin")} className="text-gray-600 hover:text-gray-300 text-sm font-medium flex items-center gap-2 mx-auto transition-all group border border-transparent hover:border-zinc-800 rounded-full px-4 py-2">
              <ShieldCheck className="w-4 h-4 group-hover:text-purple-500 transition-colors" /> Super Admin Access
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-center bg-black relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4 text-xl font-bold"><Building2 className="w-6 h-6 text-blue-600" /> AssetGuard</div>
        <div className="flex justify-center gap-6 text-sm text-gray-500 mb-8">
          <Link href="/about" className="hover:text-white cursor-pointer transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-white cursor-pointer transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white cursor-pointer transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white cursor-pointer transition-colors">Contact Support</Link>
        </div>
        <p className="text-gray-600 text-xs">© 2026 NYC Compliance Shield. Designed for Excellence within the United States.</p>
      </footer>
    </div>
  )
}

// --- TENANT DASHBOARD ---
function TenantDashboard({ onLogout, onRequestSubmit }: { onLogout: () => void, onRequestSubmit: (req: any) => void }) {
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [newReq, setNewReq] = useState({ issue: "", type: "Repair", desc: "", contact: "email" })
  const [myRequests, setMyRequests] = useState<any[]>([])

  useEffect(() => {
    const fetchMyRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('requests').select('*').eq('tenant_id', user.id).order('created_at', { ascending: false })
      if (data) setMyRequests(data)
    }
    fetchMyRequests()

    // Realtime subscription for updates
    const channel = supabase.channel('tenant_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        fetchMyRequests() // Refresh on change
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const handleSubmit = () => {
    if (!newReq.issue) return
    const req = {
      id: Date.now(),
      tenantName: "You",
      unit: "4B (123 Broadway)",
      issue: newReq.issue,
      type: newReq.type,
      desc: newReq.desc,
      status: "Pending",
      date: "Just now",
      priority: "Medium",
      contact_preference: newReq.contact
    }
    onRequestSubmit(req)
    // Optimistic update
    setMyRequests([req, ...myRequests])
    setShowNewRequest(false)
    setNewReq({ issue: "", type: "Repair", desc: "", contact: "email" })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white"><Home className="w-5 h-5" /></div>
          MyHome
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>Log Out</Button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-1">Welcome Home</h2>
            <p className="text-slate-400 text-sm">123 Broadway, Unit 4B</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button className="h-24 flex flex-col bg-white text-slate-800 border-slate-200 hover:border-green-500 shadow-sm hover:shadow-md transition-all" onClick={() => setShowNewRequest(true)}>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2"><Wrench className="w-5 h-5 text-green-600" /></div>
            Request Repair
          </Button>
          <Button className="h-24 flex flex-col bg-white text-slate-800 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2"><Phone className="w-5 h-5 text-blue-600" /></div>
            Contact Mgr
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-slate-800">My Requests</h3>
          {myRequests.length === 0 ? (
            <div className="text-center text-slate-400 py-8 bg-white rounded-xl border border-dashed border-slate-200">No requests yet.</div>
          ) : (
            myRequests.map((req, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-start hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800">{req.issue}</div>
                  <div className="text-sm text-slate-600 line-clamp-2 pr-4">{req.description || req.desc}</div>
                  <div className="text-xs text-slate-400 pt-1 flex items-center gap-2">
                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Just now'} • {req.type}
                    {req.assigned_pro_id && <Badge variant="outline" className="text-[10px] h-5 bg-purple-50 text-purple-600 border-purple-200">Pro Assigned</Badge>}
                  </div>
                </div>
                <Badge className={`${req.status === 'Pending' ? 'bg-orange-100 text-orange-700' : req.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} border-0 shrink-0`}>
                  {req.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </main>

      <AnimatePresence>{showNewRequest && (
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
          <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
            <h3 className="font-bold text-lg">New Request</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowNewRequest(false)}><X className="w-6 h-6" /></Button>
          </div>

          <div className="p-6 flex-1 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="font-bold text-sm text-slate-700">What's the problem?</label>
              <Input className="bg-white border-slate-200 h-12" placeholder="e.g. No hot water" value={newReq.issue} onChange={e => setNewReq({ ...newReq, issue: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm text-slate-700">Type</label>
              <select className="w-full h-12 bg-white border border-slate-200 rounded-md px-3 outline-none" value={newReq.type} onChange={e => setNewReq({ ...newReq, type: e.target.value })}>
                <option value="Repair">Repair</option>
                <option value="Billing">Billing</option>
                <option value="Complaint">Complaint</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm text-slate-700">Description</label>
              <textarea className="w-full p-4 border border-slate-200 rounded-xl bg-white h-32 resize-none focus:ring-2 focus:ring-green-500 outline-none" placeholder="Please provide more details..." value={newReq.desc} onChange={e => setNewReq({ ...newReq, desc: e.target.value })}></textarea>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm text-slate-700">Contact Preference</label>
              <div className="grid grid-cols-2 gap-3">
                <button className={`p-3 rounded-lg border text-sm font-medium transition-all ${newReq.contact === 'phone' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={() => setNewReq({ ...newReq, contact: 'phone' })}>
                  Phone Call
                </button>
                <button className={`p-3 rounded-lg border text-sm font-medium transition-all ${newReq.contact === 'email' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={() => setNewReq({ ...newReq, contact: 'email' })}>
                  Email Me
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-green-200" onClick={handleSubmit}>Submit Request</Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* DEMO VIDEO MODAL */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDemo(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <video
                src="/demo.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- VIOLATION ITEM COMPONENT (AI INSIGHT) ---
function ViolationItem({ v }: { v: any }) {
  const [expanded, setExpanded] = useState(false)

  // Simple AI Insight Logic (Mock)
  const getAIInsight = (desc: string) => {
    if (!desc) return { msg: "No description available.", action: "Check status online.", pro: "Property Manager" }
    const d = desc.toUpperCase()
    if (d.includes("REGISTRATION")) return {
      msg: "Failure to register property with HPD. Legal requirement. Can block evictions and result in fines.",
      action: "File Property Registration Form immediately.",
      pro: "Legal Services / Property Manager"
    }
    if (d.includes("LEAD") || d.includes("PAINT")) return {
      msg: "Lead paint hazard. Extremely serious health risk, especially for children. Requires certified abatement.",
      action: "Hire EPA-certified lead abatement contractor.",
      pro: "Lead Abatement Specialist"
    }
    if (d.includes("MOLD")) return {
      msg: "Mold infestation indicative of water leak or moisture issue. Health hazard.",
      action: "Identify moisture source and remediate mold.",
      pro: "Mold Remediation / Plumber"
    }
    if (d.includes("HEAT") || d.includes("HOT WATER")) return {
      msg: "Failure to provide heat/hot water. Emergency violation.",
      action: "Repair boiler/heating system immediately.",
      pro: "HVAC / Plumber"
    }
    if (d.includes("DOOR") || d.includes("LOCK")) return {
      msg: "Security issue. Broken door/lock compromises tenant safety.",
      action: "Repair or replace entry mechanisms.",
      pro: "Locksmith / Carpenter"
    }
    return {
      msg: "General maintenance violation detected.",
      action: "Inspect and repair as per housing code regulations.",
      pro: "General Contractor"
    }
  }

  const insight = getAIInsight(v.novdescription)

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg hover:bg-zinc-900 transition-colors">
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 pr-2">
          <div className="font-medium text-red-400 text-sm mb-1 line-clamp-2">{v.novdescription}</div>
          <div className="text-xs text-zinc-500">Issued: {v.novissueddate && new Date(v.novissueddate).toLocaleDateString()}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px] shrink-0">{v.class}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-zinc-800 overflow-hidden">
          <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-md mb-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
              <Sparkles className="w-3 h-3" /> AI Insight
            </div>
            <p className="text-zinc-300 text-xs mb-2">{insight.msg}</p>
            <div className="text-xs font-semibold text-white">Recommended Action:</div>
            <p className="text-zinc-400 text-xs mb-3">{insight.action}</p>

            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs gap-2" onClick={(e) => { e.stopPropagation(); alert(`Connecting you with ${insight.pro}... (Feature coming soon)`) }}>
              Connect with {insight.pro} <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// --- PROPERTY DETAILS MODAL (Public/Private) ---
function PropertyDetailsModal({ property, cityData, onClose }: { property: Property, cityData: any, onClose: () => void }) {
  if (!property) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        {/* Content */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl z-10">
          {/* Header */}
          <div className="relative h-64 shrink-0">
            <img src={property.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800"} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{property.address}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-600/80 hover:bg-blue-600 border-0">{property.borough || "Manhattan"}</Badge>
                <Badge variant="outline" className="border-white/20 text-white bg-black/30 backdrop-blur">{property.units || 0} Units</Badge>
                {cityData?.registrations?.[0]?.registrationid && <Badge variant="outline" className="border-green-500/20 text-green-400 bg-green-500/10">Reg #{cityData.registrations[0].registrationid}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          <div className="p-6 space-y-8">
            {/* 1. Building Info Card */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4 font-bold text-lg text-white border-b border-zinc-800 pb-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Building Information
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div><div className="text-zinc-500 mb-1">Registration #</div><div className="text-zinc-200 font-mono font-bold">{cityData?.registrations?.[0]?.registrationid || "N/A"}</div></div>
                <div><div className="text-zinc-500 mb-1">BIN</div><div className="text-zinc-200 font-mono font-bold">{cityData?.bin || cityData?.violations?.[0]?.bin || "N/A"}</div></div>
                <div><div className="text-zinc-500 mb-1">Block / Lot</div><div className="text-zinc-200 font-mono font-bold">{cityData?.violations?.[0]?.block || "?"} / {cityData?.violations?.[0]?.lot || "?"}</div></div>
                <div><div className="text-zinc-500 mb-1">Class</div><div className="text-zinc-200 font-mono font-bold">{cityData?.registrations?.[0]?.class || "Class A"}</div></div>
              </div>
            </div>

            {/* 2. Summary Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold text-red-500 mb-1">{cityData?.violations?.length || 0}</div>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Violations</div>
              </CardContent></Card>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold text-orange-500 mb-1">{cityData?.complaints?.length || 0}</div>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Complaints</div>
              </CardContent></Card>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold text-blue-500 mb-1">{cityData?.litigations?.length || 0}</div>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Litigation</div>
              </CardContent></Card>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                <div className="text-3xl font-bold text-green-500 mb-1">{cityData?.charges?.length || 0}</div>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Charges</div>
              </CardContent></Card>
            </div>

            {/* 3. Detailed Lists */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* HPD Violations */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Open Violations</h3>
                {cityData?.violations?.length > 0 ? (
                  <div className="space-y-3">
                    {cityData.violations.slice(0, 5).map((v: any, i: number) => (
                      <ViolationItem key={i} v={v} />
                    ))}
                  </div>
                ) : <div className="text-zinc-600 text-sm italic">No open violations found.</div>}
              </div>

              {/* 311 Complaints */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-orange-500" /> Recent 311 Complaints</h3>
                {cityData?.complaints?.length > 0 ? (
                  <div className="space-y-3">
                    {cityData.complaints.slice(0, 5).map((c: any, i: number) => (
                      <div key={i} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex justify-between items-start hover:bg-zinc-900 transition-colors">
                        <div>
                          <div className="font-medium text-orange-400 text-sm mb-1">{c.complaint_type}: {c.descriptor}</div>
                          <div className="text-xs text-zinc-500">Created: {c.created_date && new Date(c.created_date).toLocaleDateString()}</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ml-2 shrink-0 ${c.status === 'Open' ? 'text-green-500 border-green-500/30' : 'text-zinc-500 border-zinc-700'}`}>{c.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-zinc-600 text-sm italic">No recent complaints found.</div>}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-zinc-800">
              <Button variant="outline" onClick={onClose} className="mr-2 border-zinc-700 text-gray-300 hover:text-white">Close</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">Claim This Building</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// --- MAIN APP ---
export default function APP_ROOT() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isLoaded, setIsLoaded] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [editProfile, setEditProfile] = useState<any>({}) // Local buffer for edits

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState<UserRole>(null)
  const [selectedTier, setSelectedTier] = useState<string>("")

  // Admin Data
  const [users, setUsers] = useState<UserProfile[]>([])

  useEffect(() => {
    setIsLoaded(true)
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const role = session.user.user_metadata.role
        // Allow admin role
        if (['manager', 'tenant', 'admin'].includes(role)) setUserRole(role)
        setUserProfile(session.user.user_metadata)
        setEditProfile(session.user.user_metadata)
      }
    }
    checkSession()
  }, [])

  // Data
  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [requests, setRequests] = useState<TenantRequest[]>([])

  // Fetch Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: props } = await supabase.from('properties').select('*')
      if (props) setProperties(props)

      const { data: conts } = await supabase.from('contractors').select('*')
      if (conts) setContractors(conts)

      const { data: reqs } = await supabase.from('requests').select('*')
      if (reqs) {
        const formatted = reqs.map((r: any) => ({
          ...r,
          tenantName: r.tenantName || r.tenant_name || 'Tenant', // Map snake_case to camelCase
          desc: r.description || r.desc || ''
        }))
        setRequests(formatted)
      }
    }
    fetchData()
  }, [])

  // Fetch Users for Admin
  useEffect(() => {
    if (userRole === 'admin') {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('profiles').select('*')
        if (data) setUsers(data as UserProfile[])
      }
      fetchUsers()
    }
  }, [userRole, activeTab])

  // UI States
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [newPropAddr, setNewPropAddr] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const [chatUser, setChatUser] = useState<Contractor | null>(null)
  const [chatMsg, setChatMsg] = useState("")
  const [manageProp, setManageProp] = useState<Property | null>(null)
  const [propCityData, setPropCityData] = useState<any>(null) // City Data State

  // Fetch NYC Open Data
  const fetchCityData = async (address: string, bin?: string, bbl?: string) => {
    setPropCityData(null) // Reset
    try {
      let vioUrl = ""
      let compUrl = ""
      let litUrl = ""
      let chargeUrl = ""
      let regUrl = ""

      // Use verified Dataset IDs (2024)
      // HPD Violations: wvxf-dwi5
      // 311 Complaints: erm2-nwe9
      // Litigation: 59kj-x8nc
      // Registration: tesw-yqqr
      // HPD Fee Charges: cp6j-7bjj

      if (bin || bbl) {
        // Precise Lookup
        const binFilter = bin ? `&bin=${bin}` : ''
        const bblFilter = bbl ? `&bbl=${bbl}` : ''

        // Violations (BIN preferred)
        vioUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=5&$order=novid DESC${binFilter}`

        // Complaints (BBL preferred)
        compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5&$order=created_date DESC${bblFilter}`

        // Litigation (BIN)
        litUrl = `https://data.cityofnewyork.us/resource/59kj-x8nc.json?$limit=5&$order=caseopendate DESC${binFilter}`

        // Registration (BIN)
        regUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$limit=1&$order=lastregistrationdate DESC${binFilter}`

        // Charges (BBL preferred)
        chargeUrl = `https://data.cityofnewyork.us/resource/cp6j-7bjj.json?$limit=5&$order=activitydate DESC${bblFilter}`

      } else {
        // Fallback to Address (Fuzzy)
        if (!address) return
        const parts = address.split(' ')
        if (parts.length < 2) return
        const houseNum = parts[0]
        const streetName = parts.slice(1).join(' ').replace(/,/g, '').toUpperCase().trim()
        const encodedStreet = encodeURIComponent(streetName)

        vioUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=5&$order=novid DESC&housenumber=${houseNum}&streetname=${encodedStreet}`
        compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=5&$order=created_date DESC&incident_address=${encodeURIComponent(houseNum + ' ' + streetName)}`
        litUrl = `https://data.cityofnewyork.us/resource/59kj-x8nc.json?$limit=5&$order=caseopendate DESC&housenumber=${houseNum}&streetname=${encodedStreet}`
        regUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$limit=1&$order=lastregistrationdate DESC&housenumber=${houseNum}&streetname=${encodedStreet}`
        chargeUrl = `https://data.cityofnewyork.us/resource/cp6j-7bjj.json?$limit=5&$order=activitydate DESC&housenumber=${houseNum}&streetname=${encodedStreet}`
      }

      const [vioRes, compRes, litRes, regRes, chargeRes] = await Promise.all([
        fetch(vioUrl).catch(e => ({ json: () => [] })),
        fetch(compUrl).catch(e => ({ json: () => [] })),
        fetch(litUrl).catch(e => ({ json: () => [] })),
        fetch(regUrl).catch(e => ({ json: () => [] })),
        fetch(chargeUrl).catch(e => ({ json: () => [] }))
      ])

      const [vios, comps, lits, regs, charges] = await Promise.all([
        vioRes.json ? vioRes.json() : [],
        compRes.json ? compRes.json() : [],
        litRes.json ? litRes.json() : [],
        regRes.json ? regRes.json() : [],
        chargeRes.json ? chargeRes.json() : []
      ])

      setPropCityData({
        bin: bin || vios[0]?.bin || "N/A", // Ensure BIN is captured
        violations: vios || [],
        complaints: comps || [],
        litigations: lits || [],
        registrations: regs || [{ registrationid: "N/A", class: "N/A" }],
        charges: charges || []
      })

    } catch (e) {
      console.error("City Data Fetch Error", e)
    }
  }

  useEffect(() => {
    if (manageProp) {
      // Pass BIN/BBL if available in specific property record
      fetchCityData(manageProp.address, manageProp.bin, manageProp.bbl)
    } else {
      setPropCityData(null)
    }
  }, [manageProp])

  const [selectedRequest, setSelectedRequest] = useState<TenantRequest | null>(null) // State for managing request details

  // Contractor Management State
  const [showAddContractor, setShowAddContractor] = useState(false)
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null)

  // Public Search State
  const [publicSearchQuery, setPublicSearchQuery] = useState("")
  const [publicSearchResults, setPublicSearchResults] = useState<SearchResult[]>([])
  const [isPublicSearching, setIsPublicSearching] = useState(false)
  const [showPublicResultModal, setShowPublicResultModal] = useState(false)
  const [publicSelectedAddress, setPublicSelectedAddress] = useState<string>("")

  const handlePublicSearch = async (q: string) => {
    setPublicSearchQuery(q)
    if (q.length > 2) {
      setIsPublicSearching(true)
      try {
        // Use NYC Planning Labs GeoSearch SDK/API (v2)
        const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(q)}`)
        const data = await res.json()

        console.log("GeoSearch Raw Response:", data) // DEBUG LOG

        if (data.features) {
          const results = data.features.map((f: any) => {
            // Debug properties
            // console.log("Feature Props:", f.properties)
            return {
              display_name: f.properties.label || 'Unknown Address',
              lat: f.geometry?.coordinates?.[1] || 0,
              lon: f.geometry?.coordinates?.[0] || 0,
              // Try standard fields for BIN (GeoSearch v2 structure: properties.addendum.pad.bin)
              bin: f.properties?.addendum?.pad?.bin || f.properties?.pad_bin || f.properties?.bin || "",
              bbl: f.properties?.addendum?.pad?.bbl || f.properties?.pad_bbl || f.properties?.bbl || ""
            }
          })
          setPublicSearchResults(results)
        }
      } catch (e) {
        console.error("GeoSearch Error:", e)
      } finally {
        setIsPublicSearching(false)
      }
    } else {
      setPublicSearchResults([])
    }
  }

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!publicSearchQuery) return

    setIsPublicSearching(true)
    try {
      // Execute an immediate search to get the best match
      const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(publicSearchQuery)}`)
      const data = await res.json()

      if (data.features && data.features.length > 0) {
        const bestMatch = data.features[0]
        const result: SearchResult = {
          display_name: bestMatch.properties.label,
          lat: bestMatch.geometry.coordinates[1],
          lon: bestMatch.geometry.coordinates[0],
          bin: bestMatch.properties.pad_bin,
          bbl: bestMatch.properties.pad_bbl
        }
        // Auto-select the first result
        selectPublicAddress(result)
      }
    } catch (e) {
      console.error("Submit Error", e)
    } finally {
      setIsPublicSearching(false)
    }
  }

  const selectPublicAddress = async (result: SearchResult) => {
    setPublicSelectedAddress(result.display_name.split(',')[0])
    setPublicSearchResults([])
    setPublicSearchQuery("")

    // We create the property object FIRST, with the BIN.
    // The useEffect will then trigger fetchCityData using that BIN.
    // So we DON'T need to await fetchCityData here manually anymore, 
    // or if we do, we risk race conditions or double fetching.
    // Let's rely on the useEffect for consistency.

    const tempProp: Property = {
      id: 0,
      address: result.display_name.split(',')[0],
      borough: 'Unknown',
      units: 0,
      status: 'Unknown',
      violations: 0,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      image: '',
      bin: result.bin // Pass BIN to Property object
    }
    setManageProp(tempProp)
    // fetchCityData is triggered by useEffect on manageProp change, 
    // BUT we want to ensure it uses the BIN we just found.
    // Actually, setting manageProp triggers the effect. 
    // We should NOT call fetchCityData here manually if the effect does it.
    // OR we relies on the effect.
    // If we rely on effect, we must ensure tempProp has the bin.
  }
  const [newCon, setNewCon] = useState({ name: '', category: 'General', phone: '', email: '', company: '', location: '', image: '' })

  // Filters
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterLocation, setFilterLocation] = useState("All")

  useEffect(() => {
    if (manageProp) {
      fetchCityData(manageProp.address)
    } else {
      setPropCityData(null)
    }
  }, [manageProp])

  const filteredContractors = contractors.filter(c => {
    const matchCat = filterCategory === "All" || (c.category || c.type) === filterCategory
    const matchLoc = filterLocation === "All" || (c.location || "").includes(filterLocation)
    return matchCat && matchLoc
  })



  // LOGIC: Force Add Manager (Admin Only)
  const [showForceAddManager, setShowForceAddManager] = useState(false)
  const [forceManagerData, setForceManagerData] = useState({ name: '', email: '', company: '' })
  const [forceManagerLoading, setForceManagerLoading] = useState(false)

  const handleForceAddManager = async () => {
    setForceManagerLoading(true)
    try {
      // Use transient client to avoid logging out admin
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      )

      const { data, error } = await tempSupabase.auth.signUp({
        email: forceManagerData.email,
        password: 'ChangeMe123!', // Default password
        options: {
          data: {
            role: 'manager',
            status: 'Active', // Auto-approve
            full_name: forceManagerData.name,
            company_name: forceManagerData.company
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Force Active status via RPC
        await supabase.rpc('approve_user', { target_id: data.user.id })

        // Optimistic update
        setUsers([...users, {
          id: data.user.id,
          email: data.user.email!,
          role: 'manager',
          status: 'Active',
          full_name: forceManagerData.name,
          created_at: new Date().toISOString()
        }])
        setShowForceAddManager(false)
        setForceManagerData({ name: '', email: '', company: '' })
        alert("Manager created successfully! Default password is 'ChangeMe123!'")
      }
    } catch (e: any) {
      console.error(e)
      alert("Failed to add manager: " + e.message)
    } finally {
      setForceManagerLoading(false)
    }
  }

  // LOGIC: Add Contractor
  // LOGIC: Add Contractor
  const handleAddContractor = async () => {
    console.log("handleAddContractor called"); // DEBUG
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast("Please log in.", 'info'); return
      }

      const payload = {
        name: newCon.name,
        category: newCon.category,
        // type: removed for DB compatibility
        phone: newCon.phone,
        email: newCon.email,
        status: 'Active',
        verified: true,
        manager_id: user.id
      }

      // 1. Try DB Insert (omit 'type')
      const { data, error } = await supabase.from('contractors').insert([payload]).select()

      if (error) {
        console.error("DB Error (using local fallback):", error)
        // Fallback: Add locally (Restore 'type' for UI)
        const localNew: any = { ...payload, id: Date.now(), type: newCon.category }
        // @ts-ignore
        setContractors([...contractors, localNew])
        showToast("Added locally (DB Error)", 'info')
      } else {
        // Success
        if (data) {
          // Ensure data has 'type' for UI if DB doesn't return it
          const serverData = data[0]
          if (!serverData.type) serverData.type = serverData.category
          setContractors([...contractors, serverData])
        }
        showToast("Contractor added!")
      }

      setShowAddContractor(false)
      setNewCon({ name: '', category: 'General', phone: '', email: '', company: '', location: '', image: '' })
    } catch (e) {
      console.error("Critical Error Adding Contractor:", e)
      showToast("System Error", 'info')
    }
  }

  // LOGIC: Update Contractor
  const handleUpdateContractor = async () => {
    if (!editingContractor) return

    const payload = {
      name: newCon.name,
      category: newCon.category,
      phone: newCon.phone,
      email: newCon.email,
      company: newCon.company,
      location: newCon.location,
      image: newCon.image
    }

    const { error } = await supabase.from('contractors').update(payload).eq('id', editingContractor.id)

    if (error) {
      console.error("DB Update Error (using fallback):", error)
      // Fallback
      setContractors(contractors.map(c => c.id === editingContractor.id ? { ...c, ...payload, type: payload.category } : c))
      showToast("Updated locally (DB Error)", 'info')
    } else {
      setContractors(contractors.map(c => c.id === editingContractor.id ? { ...c, ...payload, type: payload.category } : c))
      showToast("Contractor updated!")
    }
    setShowAddContractor(false)
    setEditingContractor(null)
    setNewCon({ name: '', category: 'General', phone: '', email: '', company: '', location: '', image: '' })
  }

  // LOGIC: Delete Contractor
  const handleDeleteContractor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contractor?")) return
    const { error } = await supabase.from('contractors').delete().eq('id', id)
    if (error) {
      showToast("Error deleting contractor", 'info')
    } else {
      setContractors(contractors.filter(c => c.id !== id))
      showToast("Contractor deleted!")
    }
  }

  // Toast
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // LOGIC: Update Profile (Manual Save)
  const handleSaveProfile = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: editProfile
    })
    if (error) {
      showToast("Error updating profile", 'info')
    } else {
      setUserProfile(data.user.user_metadata)
      showToast("Profile changes saved!")
    }
  }


  // LOGIC: Search Address
  const handleSearchAddress = async (query: string) => {
    setNewPropAddr(query)
    if (query.length < 3) return

    setIsSearching(true)
    try {
      // Verify with Nominatim (OpenStreetMap)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      const data = await res.json()
      setSearchResults(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  // LOGIC: Select Address
  const selectAddress = (result: SearchResult) => {
    setNewPropAddr(result.display_name.split(',')[0]) // Keep it short for display
    setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
    setSearchResults([]) // Clear results
  }

  // LOGIC: Add Property (Updated for Real DB)
  const handleAddProperty = async () => {
    if (!newPropAddr) return

    // Default location (NYC) if search failed
    const lat = selectedLocation?.lat || 40.7128 + (Math.random() - 0.5) * 0.05
    const lng = selectedLocation?.lng || -74.0060 + (Math.random() - 0.5) * 0.05

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      showToast("Please log in again.", 'info')
      return
    }

    const newP = {
      address: newPropAddr,
      borough: "Manhattan", // Default for now
      units: Math.floor(Math.random() * 20) + 1,
      status: "Good",
      violations: 0,
      lat,
      lng,
      image: `https://source.unsplash.com/random/400x300/?building&sig=${Date.now()}`,
      manager_id: user.id
    }

    // Insert into Supabase
    const { data, error } = await supabase.from('properties').insert(newP).select()

    if (error) {
      showToast("Error adding property", 'info')
      console.error(error)
    } else if (data) {
      setProperties([...properties, data[0] as Property])
      showToast(`Property "${newP.address}" added successfully!`)
      setNewPropAddr("")
      setSearchResults([])
      setSelectedLocation(null)
      setShowAddProperty(false)
    }
  }

  // LOGIC: Connect Contractor
  const toggleContractor = (id: number) => {
    setContractors(contractors.map(c => {
      if (c.id === id) {
        if (c.status === "Available") { showToast(`Request sent to ${c.name}`); return { ...c, status: "Pending" as const } }
        if (c.status === "Pending") { showToast("Connected! You can now chat."); return { ...c, status: "Connected" as const } } // Simulate acceptance
        if (c.status === "Connected") { return c }
      }
      return c
    }))
  }

  if (!isLoaded) return null
  if (!userRole) return (
    <>
      <LandingPage
        onEnter={(role, tier) => {
          setShowAuthModal(role)
          if (tier) setSelectedTier(tier)
        }}
        publicSearchQuery={publicSearchQuery}
        handlePublicSearch={handlePublicSearch}
        handleSearchSubmit={handleSearchSubmit}
        isPublicSearching={isPublicSearching}
        publicSearchResults={publicSearchResults}
        selectPublicAddress={selectPublicAddress}
      />
      {manageProp && <PropertyDetailsModal property={manageProp} cityData={propCityData} onClose={() => setManageProp(null)} />}
      <AuthModal
        isOpen={!!showAuthModal}
        onClose={() => { setShowAuthModal(null); setSelectedTier("") }}
        defaultRole={showAuthModal || "manager"}
        selectedTier={selectedTier}
        onLoginSuccess={(role) => {
          setUserRole(role)
          setShowAuthModal(null)
          setSelectedTier("")
        }}
      />
    </>
  )
  if (userRole === "tenant") return <TenantDashboard
    onLogout={() => setUserRole(null)}
    onRequestSubmit={async (req: any) => {
      // Optimistic UI Update
      setRequests([req, ...requests]);
      showToast("Request sent!");

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const payload = {
          issue: req.issue,
          description: req.desc,
          type: req.type,
          status: 'Pending',
          priority: req.priority,
          contact_preference: req.contact_preference,
          tenant_name: user.user_metadata?.full_name || 'Tenant',
          unit: '4B (123 Broadway)', // Ideally dynamic, but good for now
          tenant_id: user.id,
          property_id: user.user_metadata?.property_id // Link to Property for Manager Visibility
        };
        const { error } = await supabase.from('requests').insert([payload]);
        if (error) {
          console.error("Failed to save request:", error);
          showToast("Error saving to database", 'info');
        }
      }
    }}
  />

  // --- ADMIN DASHBOARD ---
  if (userRole === 'admin') {
    return (
      <div className="flex h-screen bg-black text-white font-sans selection:bg-purple-500/30">
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-zinc-800 font-bold text-xl text-purple-400 cursor-pointer" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}><ShieldCheck className="w-6 h-6 mr-2" /> Admin Panel</div>
          <nav className="p-4 space-y-2 flex-1">
            {[
              { id: 'admin_overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'admin_managers', icon: Building2, label: 'Management Cos' },
              { id: 'admin_tenants', icon: Users, label: 'Tenants' },
              { id: 'admin_subadmins', icon: ShieldCheck, label: 'Sub-Admins' },
              { id: 'admin_pro', icon: Wrench, label: 'Pro Network' },
              { id: 'admin_settings', icon: Settings, label: 'System Settings' }
            ].map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-zinc-800 text-gray-400'}`}>
                <i.icon className="w-5 h-5" /> {i.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-800"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">A</div><div className="text-sm"><div className="font-bold">Super Admin</div><div className="text-xs text-zinc-500">System Operator</div></div></div></div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-black relative">
          <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/20">
            <div className="text-sm text-gray-400">System Status: <span className="text-green-500 font-bold">Operational</span></div>
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}>Log Out</Button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {activeTab === 'dashboard' || activeTab === 'admin_overview' ? (
              <div className="space-y-8">
                {/* STATS */}
                <div className="grid grid-cols-4 gap-6">
                  <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6"><div className="text-sm text-gray-400">Total Users</div><div className="text-3xl font-bold text-white">1,240</div></CardContent></Card>
                  <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6"><div className="text-sm text-gray-400">Active Properties</div><div className="text-3xl font-bold text-white mb-1">{properties.length}</div><div className="text-xs text-green-500">+12% this month</div></CardContent></Card>
                  <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6"><div className="text-sm text-gray-400">Pro Network</div><div className="text-3xl font-bold text-white">{contractors.length}</div></CardContent></Card>
                  <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6"><div className="text-sm text-gray-400">System Load</div><div className="text-3xl font-bold text-purple-400">34%</div></CardContent></Card>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* RECENT REQUESTS */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-white">Recent Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {requests.slice(0, 5).map(req => (
                        <div key={req.id} className="flex justify-between items-center p-3 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${req.priority === 'Urgent' || req.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div><div className="font-medium text-white">{req.issue}</div><div className="text-xs text-gray-400">{req.unit} • {req.tenantName}</div></div>
                          </div>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">{req.status}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* PROPERTIES MAP MOCK */}
                  <Card className="bg-zinc-900 border-zinc-800 h-[400px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-zinc-800/50"></div>
                    <div className="z-10 text-center">
                      <MapIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-500">Live Map View</p>
                    </div>
                  </Card>
                </div>

                {/* PROPERTIES LIST (New) */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 font-bold text-white flex justify-between items-center">
                    <span>Properties Overview</span>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-zinc-700 text-gray-400">View All</Button>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {properties.slice(0, 5).map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500"><Building2 className="w-5 h-5" /></div>
                          <div><div className="font-bold text-white">{p.address}</div><div className="text-xs text-gray-500">{p.borough} • {p.units} Units</div></div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right"><div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Access Code</div><div className="font-mono text-lg text-purple-400 font-bold tracking-widest">{p.access_code || 'N/A'}</div></div>
                          <Badge className={p.status === 'Good' ? 'bg-green-500/10 text-green-500 border-0' : 'bg-red-500/10 text-red-500 border-0'}>{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ADMIN USERS TAB */}
            {/* ADMIN USER MANAGEMENT TABS */}
            {['admin_managers', 'admin_tenants', 'admin_subadmins'].includes(activeTab) && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {activeTab === 'admin_managers' ? 'Management Companies' : activeTab === 'admin_tenants' ? 'Tenants' : 'System Administrators'}
                    </h2>
                    <p className="text-gray-400">
                      {activeTab === 'admin_managers' ? 'Oversee property management firms.' : activeTab === 'admin_tenants' ? 'Manage resident access.' : 'Manage super-admin access permissions.'}
                    </p>
                  </div>
                  {activeTab === 'admin_subadmins' && (
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => alert("To add a new admin, they must sign up using the 'Super Admin Access' link on the login page.")}>
                      <Plus className="w-4 h-4 mr-2" /> Add Admin
                    </Button>
                  )}
                  {activeTab === 'admin_managers' && (
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForceAddManager(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Company
                    </Button>
                  )}
                </div>

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-white uppercase text-xs font-bold">
                      <tr>
                        <th className="p-4">Name / ID</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
                      {users.filter(u => {
                        if (activeTab === 'admin_managers') return u.role === 'manager';
                        if (activeTab === 'admin_tenants') return u.role === 'tenant';
                        if (activeTab === 'admin_subadmins') return u.role === 'admin';
                        return false;
                      }).length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center">No users found in this category.</td></tr>
                      ) : (
                        users.filter(u => {
                          if (activeTab === 'admin_managers') return u.role === 'manager';
                          if (activeTab === 'admin_tenants') return u.role === 'tenant';
                          if (activeTab === 'admin_subadmins') return u.role === 'admin';
                          return false;
                        }).map(u => (
                          <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                            <td className="p-4 font-medium text-white">{u.full_name || u.id.slice(0, 8)}</td>
                            <td className="p-4">{u.email}</td>
                            <td className="p-4"><Badge variant="secondary" className="bg-zinc-800 text-zinc-300">{u.role}</Badge></td>
                            <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="p-4">
                              <Badge className={u.status === 'Active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : u.status === 'Suspended' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}>
                                {u.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              {(u.status === 'Pending' || u.status === 'Suspended') && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                                  const { error } = await supabase.rpc('approve_user', { target_id: u.id });
                                  if (!error) {
                                    setUsers(users.map(user => user.id === u.id ? { ...user, status: 'Active' } : user));
                                  } else {
                                    console.error("Failed to approve user:", error);
                                  }
                                }}>{u.status === 'Suspended' ? 'Reactivate' : 'Approve'}</Button>
                              )}
                              {u.status === 'Active' && (
                                <Button size="sm" variant="outline" className="border-red-900 text-red-500 hover:bg-red-900/20" onClick={async () => {
                                  await supabase.from('profiles').update({ status: 'Suspended' }).eq('id', u.id);
                                  setUsers(users.map(user => user.id === u.id ? { ...user, status: 'Suspended' } : user));
                                }}>Suspend</Button>
                              )}
                              <Button size="icon" variant="ghost" className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 ml-2" onClick={async () => {
                                if (confirm("Are you sure you want to PERMANENTLY delete this user?")) {
                                  const { error } = await supabase.rpc('delete_user', { target_id: u.id });
                                  if (error) console.error(error);
                                  else setUsers(users.filter(user => user.id !== u.id));
                                }
                              }}><Trash2 className="w-4 h-4" /></Button>
                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>
                </div>

                {/* FORCE ADD MANAGER MODAL */}
                <AnimatePresence>
                  {showForceAddManager && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
                      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-sm space-y-4 relative">
                        <h3 className="text-xl font-bold text-white mb-4">Add Management Company</h3>
                        <div className="space-y-3">
                          <Input placeholder="Manager Name" value={forceManagerData.name} onChange={e => setForceManagerData({ ...forceManagerData, name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
                          <Input placeholder="Email Address" type="email" value={forceManagerData.email} onChange={e => setForceManagerData({ ...forceManagerData, email: e.target.value.trim() })} className="bg-zinc-800 border-zinc-700 text-white" />
                          <Input placeholder="Company Name" value={forceManagerData.company} onChange={e => setForceManagerData({ ...forceManagerData, company: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" />
                          <div className="text-xs text-yellow-500">Note: Default password will be <b>ChangeMe123!</b></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="ghost" onClick={() => setShowForceAddManager(false)}>Cancel</Button>
                          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleForceAddManager} disabled={!forceManagerData.email || forceManagerLoading}>
                            {forceManagerLoading ? 'Creating...' : 'Create Account'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}



            {/* ADMIN REQUESTS TAB */}
            {activeTab === 'admin_requests' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-gray-400">Track and resolve tenant issues.</p></div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-zinc-700 text-gray-300">Export CSV</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${req.priority === 'Urgent' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                          {req.type === 'Repair' ? <Wrench className="w-6 h-6" /> : req.type === 'Billing' ? <CreditCard className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{req.issue}</span>
                            {req.priority === 'Urgent' && <Badge className="bg-red-500 text-white border-0">Urgent</Badge>}
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">{req.type}</Badge>
                          </div>
                          <div className="text-sm text-gray-400">{req.unit} • {req.tenantName} • {req.date}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          className="bg-zinc-950 border border-zinc-700 text-gray-300 text-sm rounded-md px-3 py-2 outline-none focus:border-purple-500"
                          value={req.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const updated = requests.map(r => r.id === req.id ? { ...r, status: newStatus } : r);
                            setRequests(updated as any);
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                        <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-white">Details</Button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && <div className="text-center text-gray-500 py-12">No active requests found.</div>}
                </div>
              </div>
            )}
            {/* PRO NETWORK TAB */}
            {activeTab === 'admin_pro' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2><p className="text-gray-400">Manage contractors, categories, and verification status.</p></div>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>
                </div>

                {/* FILTERS */}
                <div className="flex gap-4 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Filters:</span>
                  </div>
                  <select className="bg-zinc-800 border-zinc-700 text-white text-sm rounded-md px-3 py-1" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Construction">Construction</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Exterminator">Exterminator</option>
                    <option value="Handyman">Handyman</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Security">Security</option>
                    <option value="General">General</option>
                  </select>
                  <select className="bg-zinc-800 border-zinc-700 text-white text-sm rounded-md px-3 py-1" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                    <option value="All">All Locations</option>
                    <option value="Manhattan">Manhattan</option>
                    <option value="Brooklyn">Brooklyn</option>
                    <option value="Queens">Queens</option>
                    <option value="Bronx">Bronx</option>
                    <option value="Staten Island">Staten Island</option>
                    <option value="NJ">New Jersey</option>
                  </select>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500 ml-auto" onClick={() => { setFilterCategory("All"); setFilterLocation("All"); }}>Reset</Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredContractors.length === 0 ? <div className="text-center text-gray-500 py-8">No contractors found matching filters.</div> : filteredContractors.map(c => (
                    <div key={c.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                        ) : (
                          <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xl font-bold text-zinc-500">{c.name[0]}</div>
                        )}
                        <div>
                          <div className="font-bold text-white text-lg">{c.name}</div>
                          {c.company && <div className="text-sm text-gray-400 font-medium">{c.company}</div>}
                          <div className="text-purple-400 text-sm flex items-center gap-2">
                            <span>{c.category || c.type}</span>
                            {c.location && <span className="bg-zinc-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{c.location}</span>}
                            <span className="text-green-500 flex items-center gap-1">• Verified <CheckCircle className="w-3 h-3" /></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="border-zinc-700 text-gray-300 hover:text-white" onClick={() => {
                          setEditingContractor(c)
                          setNewCon({ name: c.name, company: c.company || '', location: c.location || '', category: c.category || c.type, phone: c.phone || '', email: c.email || '', image: c.image || '' })
                          setShowAddContractor(true)
                        }}>Edit Profile</Button>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDeleteContractor(c.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'admin_settings' && (
              <div className="max-w-2xl space-y-6">
                <h2 className="text-2xl font-bold text-white">Global System Settings</h2>
                <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between"><div className="text-white font-medium">Maintenance Mode</div><div className="w-12 h-6 bg-zinc-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-zinc-400 rounded-full"></div></div></div>
                  <div className="flex items-center justify-between"><div className="text-white font-medium">Allow New User Signup</div><div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div></div>
                  <div className="flex items-center justify-between"><div className="text-white font-medium">Require Admin Approval for Tenants</div><div className="w-12 h-6 bg-green-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div></div>
                </CardContent></Card>
              </div>
            )}
          </div>
        </main>

        {/* ADMIN MODALS */}
        <AnimatePresence>{showAddContractor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-md space-y-4">
              <h3 className="text-xl font-bold text-white">{editingContractor ? 'Edit Contractor' : 'Add New Contractor'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <Input placeholder="Contractor Name" value={newCon.name} onChange={e => setNewCon({ ...newCon, name: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Company Name</label>
                  <Input placeholder="Company Name (Optional)" value={newCon.company} onChange={e => setNewCon({ ...newCon, company: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Category</label>
                  <select
                    className="w-full bg-zinc-800 border-zinc-600 text-white rounded-md p-2 text-sm"
                    value={newCon.category}
                    onChange={e => setNewCon({ ...newCon, category: e.target.value })}
                  >
                    <option value="Cleaning">Cleaning</option>
                    <option value="Construction">Construction</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Exterminator">Exterminator</option>
                    <option value="Handyman">Handyman</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Security">Security</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Phone</label>
                  <Input placeholder="Phone Number" value={newCon.phone} onChange={e => setNewCon({ ...newCon, phone: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Email</label>
                  <Input placeholder="Email Address" value={newCon.email} onChange={e => setNewCon({ ...newCon, email: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Profile Image URL</label>
                  <div className="flex gap-2">
                    <Input placeholder="https://..." value={newCon.image} onChange={e => setNewCon({ ...newCon, image: e.target.value })} className="bg-zinc-800 border-zinc-600 text-white flex-1" />
                    <Button variant="outline" type="button" onClick={() => setNewCon({ ...newCon, image: `https://source.unsplash.com/random/100x100/?portrait,${Math.floor(Math.random() * 1000)}` })} className="border-zinc-600 text-gray-300">Random</Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => { setShowAddContractor(false); setEditingContractor(null); setNewCon({ name: '', category: 'General', phone: '', email: '', company: '', location: '', image: '' }) }}>Cancel</Button>
                <Button className="bg-purple-600 text-white" onClick={editingContractor ? handleUpdateContractor : handleAddContractor} disabled={!newCon.name}>
                  {editingContractor ? 'Update Contractor' : 'Add Contractor'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[100] bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>{toast.msg}
        </motion.div>
      )}</AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col z-20 shadow-2xl">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-xl cursor-pointer hover:text-blue-500 transition-colors" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}><Building2 className="w-6 h-6 mr-2 text-blue-500" />AssetGuard</div>

        {/* MEMBERSHIP BADGE */}
        {userProfile?.membership_tier && (
          <div className="mx-4 mt-4 px-4 py-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 flex items-center justify-between group cursor-pointer hover:border-blue-500/50 transition-all">
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Plan</div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {userProfile.membership_tier} <Sparkles className="w-3 h-3 text-yellow-500" />
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 group-hover:text-white"><Settings className="w-3 h-3" /></Button>
          </div>
        )}

        <nav className="p-4 space-y-2 flex-1">
          {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Overview' }, { id: 'requests', icon: ClipboardList, label: 'Requests', badge: requests.filter(r => r.status === 'Pending').length }, { id: 'map', icon: MapIcon, label: 'Map' }, { id: 'properties', icon: Building2, label: 'Properties' }, { id: 'contractors', icon: Users, label: 'Pro Network' }, { id: 'settings', icon: Settings, label: 'Settings' }].map(i => (
            <button key={i.id} onClick={() => setActiveTab(i.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-primary/10 text-primary shadow-sm shadow-blue-500/10' : 'hover:bg-secondary text-gray-400 hover:text-white'}`}>
              <i.icon className="w-5 h-5" /> {i.label} {i.badge ? <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/40">{i.badge}</span> : null}
            </button>
          ))}
        </nav>

        {/* API Status Widget */}
        <div className="p-4 mt-auto border-t border-border bg-black/20">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3 text-green-500" /> Live Data Feeds
          </h4>
          <div className="space-y-2 text-[10px] text-gray-400 font-mono">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> HPD Violations (wvxf-dvoa)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> 311 Service Requests (erm2)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Housing Litigation (59hk)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> HPD Charges (7k4b)</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-border bg-background/50 flex items-center justify-between px-8">
          <span className="text-sm text-muted-foreground">Organization: <strong>{userProfile?.company_name || 'My Organization'}</strong></span>
          <div className="flex gap-4">
            <Button variant="outline" size="icon"><Bell className="w-4 h-4" /></Button>
            <Button onClick={() => setShowAddProperty(true)} className="bg-primary text-white gap-2"><Plus className="w-4 h-4" /> Add Property</Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950/20">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <Card className="bg-card/50"><CardContent className="p-6">Properties<h3 className="text-2xl font-bold">{properties.length}</h3></CardContent></Card>
                <Card className="bg-card/50"><CardContent className="p-6">Requests<h3 className="text-2xl font-bold text-orange-400">{requests.filter(r => r.status === 'Pending').length}</h3></CardContent></Card>
              </div>
              <div className="h-[400px] rounded-xl overflow-hidden border border-border"><MapViewer properties={properties} onSelectProperty={setManageProp} /></div>
            </div>
          )}

          {/* REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Tenant Requests</h2>
              {requests.map(r => (
                <Card key={r.id} className="bg-card/50 hover:bg-card/80 cursor-pointer transition-all group" onClick={() => setSelectedRequest(r)}>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex justify-center items-center text-blue-500 group-hover:scale-110 transition-transform"><Wrench className="w-5 h-5" /></div>
                      <div>
                        <h4 className="font-bold flex items-center gap-2">
                          {r.issue}
                          {r.assigned_pro_id && <Badge variant="outline" className="text-[10px] h-5 bg-purple-500/10 text-purple-400 border-purple-500/20">Assigned</Badge>}
                        </h4>
                        <p className="text-sm text-muted-foreground">{r.tenantName || r.tenant_name} • {r.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${r.status === 'Pending' ? 'bg-orange-500' : r.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'} hover:bg-opacity-80 transition-colors`}>{r.status}</Badge>
                      <Button size="sm" variant="outline" className="invisible group-hover:visible" onClick={(e) => { e.stopPropagation(); setSelectedRequest(r); }}>
                        Manage
                      </Button>
                    </div>
                  </CardContent></Card>
              ))}
            </div>
          )}

          {/* PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="grid grid-cols-3 gap-6">
              {properties.map(p => (
                <Card key={p.id} className="bg-card/50 overflow-hidden group">
                  <div className="h-48 relative"><img src={p.image} className="w-full h-full object-cover" /><Badge className="absolute top-2 right-2">{p.status}</Badge></div>
                  <CardContent className="p-4">
                    <h3 className="font-bold">{p.address}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{p.units} Units</p>
                    <div className="flex items-center gap-2 mb-4 text-xs text-zinc-500 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                      <Lock className="w-3 h-3" />
                      Access Code: <span className="text-zinc-300 font-mono font-bold tracking-widest">{p.access_code || 'N/A'}</span>
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => setManageProp(p)}>Manage Details</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CONTRACTORS */}
          {activeTab === 'contractors' && (
            <div className="grid grid-cols-3 gap-6">
              {contractors.map(c => (
                <Card key={c.id} className="bg-card/50"><CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4"><Avatar><AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} /><AvatarFallback>PRO</AvatarFallback></Avatar><div><div className="font-bold">{c.name}</div><div className="text-sm">{c.type}</div></div></div>
                  {c.status === 'Connected' ? (
                    <Button className="w-full bg-secondary text-foreground" onClick={() => setChatUser(c)}><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
                  ) : (
                    <Button className="w-full bg-primary/20 text-primary hover:bg-primary/30" onClick={() => toggleContractor(c.id)}>{c.status === 'Pending' ? 'Pending...' : 'Connect'}</Button>
                  )}
                </CardContent></Card>
              ))}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div><h2 className="text-3xl font-bold tracking-tight text-white">Organization Profile</h2><p className="text-muted-foreground">Manage your company details and contact info.</p></div>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Company Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Company Name</label><Input value={editProfile?.company_name || ""} onChange={e => setEditProfile({ ...editProfile, company_name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. NYC Holdings LLC" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Primary Contact Person</label><Input value={editProfile?.full_name || ""} onChange={e => setEditProfile({ ...editProfile, full_name: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. John Doe" /></div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-white">Public Contact Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Support Phone</label><Input value={editProfile?.phone || ""} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. 212-555-0199" /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Support Email</label><Input value={editProfile?.contact_email || ""} onChange={e => setEditProfile({ ...editProfile, contact_email: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. support@nycholdings.com" /></div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </div>
          )}

          {/* MAP */}
          {activeTab === 'map' && <div className="h-full rounded-xl overflow-hidden border border-border"><MapViewer properties={properties} onSelectProperty={setManageProp} /></div>}
        </div>
      </main>

      {/* MODALS */}
      <AnimatePresence>{showAddProperty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-white">Add New Property</h3>
            <div className="relative">
              <Input
                placeholder="Search address (e.g. 123 Broadway, NYC)"
                value={newPropAddr}
                onChange={e => handleSearchAddress(e.target.value)}
                className="bg-zinc-800 border-zinc-600 text-white pr-10"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                {isSearching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Search className="w-4 h-4" />}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-[200px] overflow-y-auto">
                  {searchResults.map((result, i) => (
                    <div
                      key={i}
                      onClick={() => selectAddress(result)}
                      className="p-3 text-sm text-gray-300 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0"
                    >
                      {result.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedLocation && <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Location Identified</div>}

            <div className="flex gap-2 justify-end"><Button variant="ghost" onClick={() => setShowAddProperty(false)}>Cancel</Button><Button className="bg-blue-600 text-white" onClick={handleAddProperty} disabled={!newPropAddr}>Add Property</Button></div>
          </div>
        </motion.div>
      )}</AnimatePresence>

    </div>
  )
}
