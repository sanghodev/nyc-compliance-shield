"use client"

import { useState, useEffect, Component, ReactNode } from "react"
import { createClient } from "@supabase/supabase-js"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, Building2, Map as MapIcon, Users, FileText,
  Settings, Bell, Search, Plus,
  Wrench, CheckCircle, AlertTriangle, Filter, CreditCard,
  ArrowUpRight, Activity, X, MessageSquare, Send,
  Shield, ShieldCheck, Zap, BarChart3, ChevronDown, ChevronUp,
  Sparkles, ArrowRight, Scale, Flame, HardHat, Calendar, ArrowUpCircle, Download, Leaf, Clock, ClipboardList, PenTool, Smartphone, Phone, Lock, Trash2, Home, Copy, Check, ShieldAlert
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
import { useGeneratePDF } from "@/hooks/useGeneratePDF"
import AffidavitTemplate from "@/components/AffidavitTemplate"

// Error Boundary for debugging silent crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React tree crash:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: 'red', background: '#1a1a1a', minHeight: '100vh' }}>
          <h2>🔴 Dashboard Crash Detected</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 16 }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

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
  manager_id?: string
  verification_document_url?: string
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
  company_code?: string
  membership_tier?: string
}

// Helper: Get max properties based on membership tier
const getMaxPropertiesByTier = (tier?: string) => {
  switch (tier) {
    case 'Starter': return 5;
    case 'Growth': return Infinity;
    case 'Free':
    default: return 1;
  }
}

// (Mock data removed — all data now loaded from Supabase)

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
            <Building2 className={`w-6 h-6 ${isScrolled ? 'text-sky-400' : 'text-white'}`} />
            <span>Asset<span className="text-slate-400">Guard</span></span>
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
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 leading-[1.1] pb-4">
              Property Management.<br />Re-imagined by AI.
            </h1>
          </motion.div>

          {/* Public Search Input */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-xl mx-auto relative pt-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <form
                onSubmit={handleSearchSubmit}
                className="relative bg-slate-900/40 backdrop-blur-md ring-1 ring-gray-800 rounded-xl flex items-center p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              >
                <Search className="text-slate-400 w-5 h-5 ml-3" />
                <Input
                  placeholder="Search NYC address (e.g. 123 Broadway)"
                  className="bg-transparent border-none text-white h-12 text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-600 flex-1"
                  value={publicSearchQuery}
                  onChange={(e) => handlePublicSearch(e.target.value)}
                />
                {isPublicSearching ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin mr-3"></div>
                ) : (
                  <Button type="submit" size="sm" className="bg-indigo-500 hover:bg-sky-400 text-white rounded-lg px-4 py-2 font-bold transition-all">
                    Search
                  </Button>
                )}
              </form>
            </div>

            {/* Public Search Results Dropdown */}
            {publicSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/40 backdrop-blur-md/95 border border-slate-700/50/50 rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] max-h-[300px] overflow-y-auto text-left backdrop-blur-md">
                {publicSearchResults.map((result, i) => (
                  <div
                    key={i}
                    onClick={() => selectPublicAddress(result)}
                    className="p-4 text-gray-300 hover:bg-indigo-500/20 hover:text-white cursor-pointer border-b border-slate-800/50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <MapIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{result.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex justify-center gap-4 pt-4">
            <Button size="lg" className="bg-indigo-500 hover:bg-blue-700 text-white px-8 rounded-full h-12 text-lg" onClick={() => onEnter("manager")}>Get Started</Button>
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
              <div className="text-sm text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PROBLEM / SOLUTION */}
      <section className="py-32 px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Why AssetGuard?</h2>
            <p className="text-xl text-slate-400">Old ways vs. The New Way</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-red-500 font-bold text-xl"><X className="w-6 h-6" /> Traditional Way</div>
              <ul className="space-y-4 text-left text-slate-400">
                <li className="flex gap-3"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> Missed violation hearings & fines</li>
                <li className="flex gap-3"><FileText className="w-5 h-5 text-red-500 shrink-0" /> Endless manual paperwork</li>
                <li className="flex gap-3"><Phone className="w-5 h-5 text-red-500 shrink-0" /> Angry late-night tenant calls</li>
                <li className="flex gap-3"><Clock className="w-5 h-5 text-red-500 shrink-0" /> Days wasted finding contractors</li>
              </ul>
            </div>

            <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-40 h-40 text-emerald-500" /></div>
              <div className="flex items-center gap-3 text-emerald-500 font-bold text-xl"><CheckCircle className="w-6 h-6" /> AssetGuard Way</div>
              <ul className="space-y-4 text-left text-gray-300">
                <li className="flex gap-3"><Zap className="w-5 h-5 text-emerald-500 shrink-0" /> Proactive AI alerts before fines hit</li>
                <li className="flex gap-3"><PenTool className="w-5 h-5 text-emerald-500 shrink-0" /> 1-Click Affidavit Generation</li>
                <li className="flex gap-3"><Smartphone className="w-5 h-5 text-emerald-500 shrink-0" /> Self-service Tenant Mobile App</li>
                <li className="flex gap-3"><Users className="w-5 h-5 text-emerald-500 shrink-0" /> Instant access to vetted Pros</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3.1 NYC SOLUTIONS */}
      <section className="py-24 px-6 bg-black border-t border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">NYC Solutions</h2>
            <p className="text-xl text-slate-400">Specific solutions for complex NYC local law challenges.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-sky-400 transition-colors group">
              <div className="w-12 h-12 bg-sky-400/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-sky-400 transition-colors">
                <ShieldCheck className="w-6 h-6 text-sky-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">NYC Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Protect your business from fines & local law escalation. Stay ahead of changing regulations.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-emerald-500 transition-colors group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <ClipboardList className="w-6 h-6 text-emerald-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Local Law 55</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Track required inspections & follow-ups in one place. Ensure pest and mold compliance seamlessly.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-amber-500 transition-colors group">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                <Scale className="w-6 h-6 text-amber-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">OATH Fines & Hearings</h3>
              <p className="text-slate-400 text-sm leading-relaxed">The best way to prevent & respond to OATH-related violations. Automated hearing scheduling & evidence prep.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-purple-500 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                <Search className="w-6 h-6 text-purple-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lead Paint Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">From inspections to Local Law 31 XRF & more. Manage XRF testing deadlines and abatement records.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-red-500 transition-colors group">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-500 transition-colors">
                <Flame className="w-6 h-6 text-red-500 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">FDNY Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">The best data & tools for FDNY compliance. Track fire safety notices and inspection cycles.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:border-amber-400 transition-colors group">
              <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-400 transition-colors">
                <HardHat className="w-6 h-6 text-amber-400 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">DOB Regulations</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Manage complaints, violations, & required filings. Stay on top of elevator & boiler cycles.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE DEEP DIVE 1: MAP */}
      <section className="py-24 px-6 flex justify-center bg-black border-t border-zinc-900">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
            <Badge className="bg-indigo-500/20 text-sky-300 mb-2 hover:bg-indigo-500/30">God-Mode Visibility</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">See every issue.<br /><span className="text-slate-500">In Real-Time.</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Our 3D Satellite Map integrates directly with <span className="text-white font-bold">5+ NYC Government APIs</span>. Monitor <span className="text-sky-300">Violations</span>, <span className="text-red-400">Litigation</span>, <span className="text-orange-400">311 Complaints</span>, <span className="text-emerald-400">Registrations</span>, and <span className="text-yellow-400">Charges</span> in real-time.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-3 text-gray-300 bg-slate-900/40 backdrop-blur-md p-3 rounded-lg border border-slate-700/50"><MapIcon className="text-sky-400" /> Live NYC DOB/HPD Data Sync</div>
              <div className="flex items-center gap-3 text-gray-300 bg-slate-900/40 backdrop-blur-md p-3 rounded-lg border border-slate-700/50"><Activity className="text-emerald-500" /> Portfolio Health Score</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800" className="relative rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10" alt="Map Interface" />
            {/* UI Overlay Mockup */}
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur p-4 rounded-lg border border-white/10 z-20 shadow-xl hidden md:block">
              <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> <span className="text-xs font-bold">New Violation Detected</span></div>
              <div className="text-xs text-slate-400">123 Broadway: Elevators</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. FEATURE DEEP DIVE 2: AI & PROS */}
      <section className="py-24 px-6 flex justify-center bg-slate-950">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="order-2 md:order-1 relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400 to-pink-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src="https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=800" className="relative rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10" alt="AI Dashboard" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 p-6 rounded-2xl border border-white/20 z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center w-64">
              <div className="w-12 h-12 bg-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><Zap className="text-white" /></div>
              <div className="font-bold text-white mb-1">Affidavit Generated</div>
              <div className="text-xs text-slate-400">Sent to Law Dept (14s ago)</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} className="order-1 md:order-2 space-y-6">
            <Badge className="bg-indigo-400/20 text-purple-400 mb-2 hover:bg-indigo-400/30">AI Automation</Badge>
            <h2 className="text-4xl md:text-5xl font-bold">Your 24/7 Legal &<br /><span className="text-slate-500">Maintenance Team.</span></h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Detected a violation? Our AI writes the legal defense instantly. Leaking pipe? We find the highest-rated plumber in zip code 10001 and dispatch them instantly.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-900/40 backdrop-blur-md/50 p-4 rounded-xl border border-slate-700/50">
                <FileText className="text-purple-500 mb-2" />
                <h4 className="font-bold text-sm">Auto-Docs</h4>
                <p className="text-xs text-slate-500">Leases & Affidavits</p>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-md/50 p-4 rounded-xl border border-slate-700/50">
                <Users className="text-amber-500 mb-2" />
                <h4 className="font-bold text-sm">Pro Network</h4>
                <p className="text-xs text-slate-500">Vetted Contractors</p>
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
            <p className="text-slate-400">Everything you need to scale your portfolio.</p>
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
              <motion.div key={i} whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                <div className="w-12 h-12 bg-slate-800/40 rounded-lg flex items-center justify-center mb-4 text-white">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRICING & MEMBERSHIP */}
      <section className="py-24 px-6 bg-slate-950 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">Membership Plans</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Transparent pricing for portfolios of all sizes.
              <br /><span className="text-sky-400">Contractors?</span> You join free & pay commission only on completed jobs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* TIER 1: STARTER */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-black border border-slate-700/50 flex flex-col relative overflow-hidden group">
              <div className="text-slate-400 font-bold tracking-widest text-sm mb-4">STARTER</div>
              <div className="text-5xl font-bold text-white mb-2">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <p className="text-slate-400 mb-8">Perfect for self-managing owners.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Up to 3 Units</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Basic AI Violation Alerts</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Access to Pro Marketplace</li>
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Tenant Mobile App</li>
              </ul>
              <Button className="w-full bg-slate-800/40 hover:bg-zinc-700 text-white font-bold py-6 rounded-xl" onClick={() => onEnter("manager", "Starter")}>Start Free Trial</Button>
            </motion.div>

            {/* TIER 2: GROWTH (POPULAR) */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-slate-900/40 backdrop-blur-md border border-sky-400 relative flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">MOST POPULAR</div>
              <div className="text-sky-300 font-bold tracking-widest text-sm mb-4 uppercase">Growth</div>
              <div className="text-5xl font-bold text-white mb-2">$99<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <p className="text-slate-400 mb-8">For growing portfolios needing automation.</p>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> Up to 20 Units</li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> <b>Instant AI Affidavits</b></li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> Priority Pro Dispatch</li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> Financial Forecasting</li>
              </ul>
              <Button className="w-full bg-indigo-500 hover:bg-sky-400 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-900/40" onClick={() => onEnter("manager", "Growth")}>Get Started</Button>
            </motion.div>

            {/* TIER 3: ENTERPRISE / ASKING */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 to-black border border-purple-500/30 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 z-0"></div>
              <div className="relative z-10">
                <div className="text-purple-400 font-bold tracking-widest text-sm mb-4 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4" /> AssetGuard Premium</div>
                <div className="text-4xl font-bold text-white mb-2">Custom<span className="text-lg text-slate-500 font-normal"></span></div>
                <p className="text-slate-400 mb-8">We manage everything for you.</p>

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
          <div className="mt-16 bg-slate-900/40 backdrop-blur-md/50 rounded-2xl p-8 border border-dashed border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center justify-center md:justify-start gap-2"><Wrench className="w-5 h-5 text-amber-500" /> Are you a top-rated Contractor?</h3>
              <p className="text-slate-400 text-sm max-w-xl">Join our exclusive network. No monthly fees. You only pay a small commission when you get paid for a job.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-amber-500/30 text-orange-400 hover:bg-orange-950 px-6 py-4 rounded-xl" onClick={() => window.open('tel:+12125550199')}>Call Us</Button>
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
            <Button onClick={() => onEnter("manager")} className="group h-auto py-8 px-8 rounded-3xl bg-slate-950/80 backdrop-blur-md border border-slate-700/50 hover:bg-slate-800/40 hover:border-sky-400 hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-all flex flex-col w-full md:w-80">
              <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><Building2 className="w-8 h-8" /></div>
              <div><h3 className="text-2xl font-bold mb-1 text-white">Property Manager</h3><p className="text-sm text-gray-300 font-normal">Full control over portfolio.</p></div>
              <div className="mt-6 flex items-center text-sky-300 text-sm font-bold group-hover:gap-2 transition-all">Values Access <ArrowUpRight className="w-4 h-4 ml-1" /></div>
            </Button>
            <Button onClick={() => onEnter("tenant")} className="group h-auto py-8 px-8 rounded-3xl bg-slate-950/80 backdrop-blur-md border border-slate-700/50 hover:bg-slate-800/40 hover:border-emerald-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] transition-all flex flex-col w-full md:w-80">
              <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform"><Home className="w-8 h-8" /></div>
              <div><h3 className="text-2xl font-bold mb-1 text-white">Tenant Portal</h3><p className="text-sm text-gray-300 font-normal">Pay rent & request repairs.</p></div>
              <div className="mt-6 flex items-center text-emerald-400 text-sm font-bold group-hover:gap-2 transition-all">Resident Access <ArrowUpRight className="w-4 h-4 ml-1" /></div>
            </Button>
          </div>

          <div className="pt-12 animate-fade-in delay-500">
            <button onClick={() => onEnter("admin")} className="text-gray-600 hover:text-gray-300 text-sm font-medium flex items-center gap-2 mx-auto transition-all group border border-transparent hover:border-slate-700/50 rounded-full px-4 py-2">
              <ShieldCheck className="w-4 h-4 group-hover:text-purple-500 transition-colors" /> Super Admin Access
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-center bg-black relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4 text-xl font-bold"><Building2 className="w-6 h-6 text-indigo-500" /> AssetGuard</div>
        <div className="flex justify-center gap-6 text-sm text-slate-500 mb-8">
          <Link href="/about" className="hover:text-white cursor-pointer transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-white cursor-pointer transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white cursor-pointer transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white cursor-pointer transition-colors">Contact Support</Link>
        </div>
        <p className="text-gray-600 text-xs">© 2026 NYC Compliance Shield. Designed for Excellence within the United States.</p>
      </footer>

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
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
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

// --- TENANT DASHBOARD ---
function TenantDashboard({ onLogout, onRequestSubmit, userProfile }: { onLogout: () => void, onRequestSubmit: (req: any) => void, userProfile?: any }) {
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [newReq, setNewReq] = useState({ issue: "", type: "Repair", desc: "", contact: "email" })
  const [myRequests, setMyRequests] = useState<any[]>([])

  const [tenantProfile, setTenantProfile] = useState<any>(userProfile || null)
  const [tenantProperty, setTenantProperty] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('requests').select('*').eq('tenant_id', user.id).order('created_at', { ascending: false })
      if (data) setMyRequests(data)

      // Fetch Profile and Property
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setTenantProfile(profile)
        if (profile.property_id) {
          const { data: property } = await supabase.from('properties').select('*').eq('id', profile.property_id).single()
          if (property) setTenantProperty(property)
        }
      }
    }
    fetchDashboardData()

    // Realtime subscription for updates
    const channel = supabase.channel('tenant_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        // Just refresh the requests manually
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('requests').select('*').eq('tenant_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
              if (data) setMyRequests(data);
            })
          }
        })
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
      tenantName: tenantProfile?.full_name || "You",
      unit: tenantProfile?.unit || "Unknown Unit",
      issue: newReq.issue,
      type: newReq.type,
      desc: newReq.desc,
      status: "Pending",
      date: "Just now",
      priority: "Medium",
      contact_preference: newReq.contact,
      property_id: tenantProfile?.property_id
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
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white"><Home className="w-5 h-5" /></div>
          MyHome
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>Log Out</Button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl border-0">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-1">Welcome Home</h2>
            <p className="text-slate-400 text-sm">
              {tenantProperty ? `${tenantProperty.address || 'Unknown Address'}, Unit ${tenantProfile?.unit || ''}` : 'Loading property details...'}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button className="h-24 flex flex-col bg-white text-slate-800 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all" onClick={() => setShowNewRequest(true)}>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2"><Wrench className="w-5 h-5 text-emerald-600" /></div>
            Request Repair
          </Button>
          <Button className="h-24 flex flex-col bg-white text-slate-800 border-slate-200 hover:border-sky-400 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2"><Phone className="w-5 h-5 text-indigo-500" /></div>
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
                    {req.assigned_pro_id && <Badge variant="outline" className="text-[10px] h-5 bg-purple-50 text-indigo-400 border-purple-200">Pro Assigned</Badge>}
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
              <textarea className="w-full p-4 border border-slate-200 rounded-xl bg-white h-32 resize-none focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Please provide more details..." value={newReq.desc} onChange={e => setNewReq({ ...newReq, desc: e.target.value })}></textarea>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-sm text-slate-700">Contact Preference</label>
              <div className="grid grid-cols-2 gap-3">
                <button className={`p-3 rounded-lg border text-sm font-medium transition-all ${newReq.contact === 'phone' ? 'bg-green-50 border-emerald-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={() => setNewReq({ ...newReq, contact: 'phone' })}>
                  Phone Call
                </button>
                <button className={`p-3 rounded-lg border text-sm font-medium transition-all ${newReq.contact === 'email' ? 'bg-green-50 border-emerald-500 text-green-700' : 'bg-white border-slate-200 text-slate-600'}`} onClick={() => setNewReq({ ...newReq, contact: 'email' })}>
                  Email Me
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <Button className="w-full bg-emerald-600 hover:bg-green-700 text-white h-12 rounded-xl text-lg font-bold shadow-lg shadow-green-200" onClick={handleSubmit}>Submit Request</Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>


    </div>
  )
}

// --- VIOLATION ITEM COMPONENT (AI INSIGHT) ---
function ViolationItem({ v, onGenerateAffidavit, isGenerating }: { v: any, onGenerateAffidavit?: (v: any) => void, isGenerating?: boolean }) {
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

  // Calculate deadline countdown based on violation class
  const getDeadlineInfo = () => {
    if (!v.novissueddate) return null
    const issued = new Date(v.novissueddate)
    const now = new Date()
    // NYC HPD cure periods: Class A = 90 days, Class B = 30 days, Class C (immediately hazardous) = 24 hours
    const cureDays = v.class?.includes('A') ? 90 : v.class?.includes('B') ? 30 : 1
    const deadline = new Date(issued.getTime() + cureDays * 24 * 60 * 60 * 1000)
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { daysLeft, cureDays, deadline }
  }
  const deadlineInfo = getDeadlineInfo()

  return (
    <div className="bg-slate-950 border border-slate-700/50 p-3 rounded-lg hover:bg-slate-900/40 backdrop-blur-md transition-colors">
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 pr-2">
          <div className="font-medium text-red-400 text-sm mb-1 line-clamp-2">{v.novdescription}</div>
          <div className="text-xs text-slate-500">Issued: {v.novissueddate && new Date(v.novissueddate).toLocaleDateString()}</div>
          {/* Fine Deadline Countdown */}
          {deadlineInfo && (
            <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${deadlineInfo.daysLeft <= 0 ? 'bg-red-500/20 text-red-400 animate-pulse' :
              deadlineInfo.daysLeft <= 7 ? 'bg-amber-500/20 text-orange-400' :
                deadlineInfo.daysLeft <= 30 ? 'bg-amber-400/20 text-yellow-400' :
                  'bg-emerald-500/20 text-emerald-400'
              }`}>
              <Clock className="w-3 h-3" />
              {deadlineInfo.daysLeft <= 0 ? `OVERDUE by ${Math.abs(deadlineInfo.daysLeft)}d` : `D-${deadlineInfo.daysLeft} (${deadlineInfo.cureDays}d cure)`}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px] shrink-0">{v.class}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-slate-700/50 overflow-hidden">
          <div className="bg-blue-900/20 border border-sky-400/30 p-3 rounded-md mb-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs mb-1">
              <Sparkles className="w-3 h-3" /> AI Insight
            </div>
            <p className="text-zinc-300 text-xs mb-2">{insight.msg}</p>
            <div className="text-xs font-semibold text-white">Recommended Action:</div>
            <p className="text-slate-400 text-xs mb-3">{insight.action}</p>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-indigo-500 hover:bg-blue-700 text-white h-7 text-xs gap-2" onClick={(e) => { e.stopPropagation(); alert(`Connecting you with ${insight.pro}... (Feature coming soon)`) }}>
                Connect {insight.pro} <ArrowRight className="w-3 h-3" />
              </Button>
              {onGenerateAffidavit && (
                <Button size="sm" disabled={isGenerating} variant="outline" className="flex-1 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 h-7 text-xs gap-2" onClick={(e) => { e.stopPropagation(); onGenerateAffidavit(v); }}>
                  {isGenerating ? "Drafting..." : "Auto-Doc Affidavit"} <FileText className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// --- PROPERTY DETAILS MODAL (Public/Private) ---
function PropertyDetailsModal({ property, cityData, onClose }: { property: Property, cityData: any, onClose: () => void }) {
  const { generatePDF } = useGeneratePDF();
  const [affidavitHtml, setAffidavitHtml] = useState<string | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState<number | string | null>(null);
  const [activeViolationForPdf, setActiveViolationForPdf] = useState<any>(null);
  const [ll97Props, setLl97Props] = useState({
    address: "",
    squareFootage: "",
    buildingType: "Multifamily Residential",
    heatingFuel: "Natural Gas",
    yearBuilt: ""
  })
  const [ll97Loading, setLl97Loading] = useState(false)
  const [ll97Result, setLl97Result] = useState<any>(null)

  const handleSimulateLL97 = async () => {
    if (!ll97Props.address || !ll97Props.squareFootage) {
      alert("Address and Square Footage are required.");
      return;
    }
    setLl97Loading(true)
    try {
      const res = await fetch('/api/ll97_simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ll97Props)
      })
      const data = await res.json()
      if (data.data) {
        setLl97Result(data.data)
      } else {
        alert("Failed to simulate. Please try again.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLl97Loading(false)
    }
  }
  const handleGenerateAffidavit = async (violation: any) => {
    setIsGeneratingId(violation.id || violation.violationid);
    setActiveViolationForPdf(violation);
    try {
      const res = await fetch('/api/generate_affidavit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, violation })
      });
      const data = await res.json();
      if (data.affidavitHtml) {
        setAffidavitHtml(data.affidavitHtml);
        // Wait a tick for the React DOM to render the hidden template
        setTimeout(() => {
          generatePDF({ elementId: 'affidavit-report-container', filename: `Affidavit_${property.bin || 'Prop'}_${violation.id || 'Violation'}.pdf` });
          setIsGeneratingId(null);
        }, 500);
      } else {
        alert("Failed to generate affidavit.");
        setIsGeneratingId(null);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating affidavit.");
      setIsGeneratingId(null);
    }
  };

  if (!property) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        {/* Content */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10">
          {/* Header */}
          <div className="relative h-64 shrink-0">
            <img src={property.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800"} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{property.address}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-indigo-500/80 hover:bg-indigo-500 border-0">{property.borough || "Manhattan"}</Badge>
                <Badge variant="outline" className="border-white/20 text-white bg-black/30 backdrop-blur">{property.units || 0} Units</Badge>
                {cityData?.registrations?.[0]?.registrationid && <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">Reg #{cityData.registrations[0].registrationid}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          <div className="p-6 space-y-8">
            {property.status === 'Pending Verification' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-900/40 rounded-xl border border-slate-700/50">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Verification Pending</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  This property is currently under review by an administrator. You will gain full access to compliance tracking, tenant management, and live data feeds once verified.
                </p>
                <Button variant="outline" onClick={onClose} className="border-slate-700/50 text-gray-300 hover:text-white">Close</Button>
              </div>
            ) : (
              <>
                {/* 1. Building Info Card */}
                <div className="bg-slate-950/50 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4 font-bold text-lg text-white border-b border-slate-700/50 pb-2">
                    <Building2 className="w-5 h-5 text-sky-400" /> Building Information
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div><div className="text-slate-500 mb-1">Registration #</div><div className="text-zinc-200 font-mono font-bold">{cityData?.registrations?.[0]?.registrationid || "N/A"}</div></div>
                    <div><div className="text-slate-500 mb-1">BIN</div><div className="text-zinc-200 font-mono font-bold">{cityData?.bin || cityData?.violations?.[0]?.bin || "N/A"}</div></div>
                    <div><div className="text-slate-500 mb-1">Block / Lot</div><div className="text-zinc-200 font-mono font-bold">{cityData?.violations?.[0]?.block || "?"} / {cityData?.violations?.[0]?.lot || "?"}</div></div>
                    <div><div className="text-slate-500 mb-1">Class</div><div className="text-zinc-200 font-mono font-bold">{cityData?.registrations?.[0]?.class || "Class A"}</div></div>
                  </div>
                </div>

                {/* 2. Summary Stats & Codes Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 hover:border-slate-700/50 transition-colors"><CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-bold text-sky-400 mb-1 tracking-widest bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">{property.access_code || "N/A"}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Tenant Access Code</div>
                  </CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 hover:border-slate-700/50 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-500 mb-1">{cityData?.violations?.length || 0}</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Violations</div>
                  </CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 hover:border-slate-700/50 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-bold text-amber-500 mb-1">{cityData?.complaints?.length || 0}</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Complaints</div>
                  </CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 hover:border-slate-700/50 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-bold text-sky-400 mb-1">{cityData?.litigations?.length || 0}</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Litigation</div>
                  </CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 hover:border-slate-700/50 transition-colors"><CardContent className="p-4 flex flex-col items-center">
                    <div className="text-3xl font-bold text-emerald-500 mb-1">{cityData?.charges?.length || 0}</div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Charges</div>
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
                          <ViolationItem key={i} v={v} onGenerateAffidavit={handleGenerateAffidavit} isGenerating={isGeneratingId === (v.id || v.violationid)} />
                        ))}
                      </div>
                    ) : <div className="text-zinc-600 text-sm italic">No open violations found.</div>}
                  </div>

                  {/* 311 Complaints */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-amber-500" /> Recent 311 Complaints</h3>
                    {cityData?.complaints?.length > 0 ? (
                      <div className="space-y-3">
                        {cityData.complaints.slice(0, 5).map((c: any, i: number) => (
                          <div key={i} className="bg-slate-950 border border-slate-700/50 p-3 rounded-lg flex justify-between items-start hover:bg-slate-900/40 backdrop-blur-md transition-colors">
                            <div>
                              <div className="font-medium text-orange-400 text-sm mb-1">{c.complaint_type}: {c.descriptor}</div>
                              <div className="text-xs text-slate-500">Created: {c.created_date && new Date(c.created_date).toLocaleDateString()}</div>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ml-2 shrink-0 ${c.status === 'Open' ? 'text-emerald-500 border-emerald-500/30' : 'text-slate-500 border-slate-700/50'}`}>{c.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <div className="text-zinc-600 text-sm italic">No recent complaints found.</div>}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700/50">
                  <Button variant="outline" onClick={onClose} className="mr-2 border-slate-700/50 text-gray-300 hover:text-white">Close</Button>
                  <Button className="bg-indigo-500 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20">Claim This Building</Button>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Hidden PDF Template Container */}
        {affidavitHtml && activeViolationForPdf && (
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <AffidavitTemplate property={property} violation={activeViolationForPdf} htmlContent={affidavitHtml} />
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  )
}

// --- MAIN APP ---
export default function APP_ROOT() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [activeTab, setActiveTab] = useState('portfolio') // 'portfolio', 'map', 'reports', 'settings', 'll97', 'contractors'
  const [isLoaded, setIsLoaded] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [editProfile, setEditProfile] = useState<any>({}) // Local buffer for edits

  // PDF Report Hook
  const { generatePDF, isGenerating: isGeneratingPDF } = useGeneratePDF()

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState<UserRole>(null)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Admin Data
  const [users, setUsers] = useState<UserProfile[]>([])

  // LL97 Simulator State
  const [ll97Props, setLl97Props] = useState({ address: '', squareFootage: '', heatingFuel: 'Natural Gas', buildingType: 'Multifamily Residential', yearBuilt: '' })
  const [ll97Result, setLl97Result] = useState<any>(null)
  const [ll97Loading, setLl97Loading] = useState(false)
  const runLL97Simulation = async (property?: any) => {
    setLl97Loading(true)
    setLl97Result(null)
    try {
      const payload = {
        address: property?.address || 'Selected Property',
        units: property?.units || 0,
        borough: property?.borough || 'Manhattan',
        buildingType: ll97Props.buildingType,
        squareFootage: ll97Props.squareFootage || undefined,
        heatingFuel: ll97Props.heatingFuel,
        yearBuilt: ll97Props.yearBuilt || undefined,
      }
      const res = await fetch('/api/ll97_simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.data) setLl97Result(json.data)
      else alert('Simulation failed: ' + (json.error || 'Unknown error'))
    } catch (e: any) {
      alert('Simulation error: ' + e.message)
    } finally {
      setLl97Loading(false)
    }
  }

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
    if (!userRole) return; // Wait until authenticated

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = user.user_metadata?.role || userRole;

      // 1. Fetch Properties (Isolated for Managers)
      let propsQuery = supabase.from('properties').select('*')
      if (role === 'manager') {
        propsQuery = propsQuery.eq('manager_id', user.id)
      }
      // Tenants might only need their specific property, but for now we isolate managers.
      const { data: props } = await propsQuery
      if (props) setProperties(props)

      // 2. Fetch Contractors (Global Pro Network)
      const { data: conts } = await supabase.from('contractors').select('*')
      if (conts) setContractors(conts)

      // 3. Fetch Requests (Isolated for Managers)
      let reqsQuery = supabase.from('requests').select('*')

      if (role === 'manager') {
        if (props && props.length > 0) {
          const propIds = props.map(p => p.id)
          reqsQuery = reqsQuery.in('property_id', propIds)
        } else {
          // Manager with no properties = no requests to see
          setRequests([])
          return
        }
      } else if (role === 'tenant') {
        reqsQuery = reqsQuery.eq('tenant_id', user.id)
      }

      const { data: reqs } = await reqsQuery
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
  }, [userRole])

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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, bin?: string, bbl?: string } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [editingCompanyData, setEditingCompanyData] = useState<{ id: string, name: string, email: string, tier: string } | null>(null)
  const [isEditingCompany, setIsEditingCompany] = useState(false)

  const [chatUser, setChatUser] = useState<Contractor | null>(null)
  const [chatMsg, setChatMsg] = useState("")
  const [manageProp, setManageProp] = useState<Property | null>(null)
  const [propCityData, setPropCityData] = useState<any>(null) // City Data State
  const [oathHearings, setOathHearings] = useState<any[]>([])
  const [oathLoading, setOathLoading] = useState(false)
  const [ll84Data, setLl84Data] = useState<any>(null)
  const [ll84Loading, setLl84Loading] = useState(false)
  const [propTab, setPropTab] = useState<'details' | 'violations' | 'oath'>('details')

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

      // Fetch OATH Hearings
      const fetchOath = async () => {
        if (!manageProp.bbl) {
          setOathHearings([])
          return
        }
        setOathLoading(true)
        try {
          const oathRes = await fetch(`/api/oath_hearings?bbl=${manageProp.bbl}`)
          const oathData = await oathRes.json()
          if (oathData.data) {
            setOathHearings(oathData.data)
          }
        } catch (e) {
          console.error("Error fetching OATH:", e)
        } finally {
          setOathLoading(false)
        }
      }
      fetchOath()

      // Fetch LL84 Benchmarking
      const fetchLl84 = async () => {
        if (!manageProp.bbl) {
          setLl84Data(null)
          return
        }
        setLl84Loading(true)
        try {
          const res = await fetch(`/api/ll84_benchmarking?bbl=${manageProp.bbl}`)
          const json = await res.json()
          if (json.data) {
            setLl84Data(json.data)
          } else {
            setLl84Data(null)
          }
        } catch (e) {
          console.error("Error fetching LL84:", e)
        } finally {
          setLl84Loading(false)
        }
      }
      fetchLl84()

    } else {
      setPropCityData(null)
      setOathHearings([])
      setLl84Data(null)
      setPropTab('details')
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

  // (Duplicate useEffect removed — fetchCityData is handled by the earlier effect at line ~1090)

  const filteredContractors = contractors.filter(c => {
    const matchCat = filterCategory === "All" || (c.category || c.type) === filterCategory
    const matchLoc = filterLocation === "All" || (c.location || "").includes(filterLocation)
    return matchCat && matchLoc
  })



  // LOGIC: Force Add Manager (Admin Only)
  const [showForceAddManager, setShowForceAddManager] = useState(false)
  const [forceManagerData, setForceManagerData] = useState({ name: '', email: '', company: '' })
  const [forceManagerLoading, setForceManagerLoading] = useState(false)
  const [newCompanyPassword, setNewCompanyPassword] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const handleForceAddManager = async () => {
    setForceManagerLoading(true)
    try {
      // Use transient client to avoid logging out admin
      const tempSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      )

      // Generate a secure random password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
      const randomValues = crypto.getRandomValues(new Uint16Array(12))
      const tempPassword = Array.from(randomValues, v => chars[v % chars.length]).join('')

      const { data, error } = await tempSupabase.auth.signUp({
        email: forceManagerData.email,
        password: tempPassword,
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

        // Generate and assign Company Code using generic 'MC' prefix
        const { data: generatedCode, error: codeErr } = await supabase.rpc('assign_company_code', {
          target_id: data.user.id,
          prefix: 'MC'
        });
        if (codeErr) console.error("Error generating company code:", codeErr);

        // Optimistic update
        setUsers([...users, {
          id: data.user.id,
          email: data.user.email!,
          role: 'manager',
          status: 'Active',
          full_name: forceManagerData.name,
          company_code: generatedCode || null,
          created_at: new Date().toISOString()
        }])
        setShowForceAddManager(false)
        setForceManagerData({ name: '', email: '', company: '' })
        setNewCompanyPassword(tempPassword)
      }
    } catch (e: any) {
      console.error(e)
      showToast("Failed to add manager: " + e.message, "error")
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
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
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
      // Use NYC Planning Labs GeoSearch API
      const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.features) {
        const results = data.features.map((f: any) => ({
          display_name: f.properties.label || 'Unknown Address',
          lat: f.geometry?.coordinates?.[1] || 0,
          lon: f.geometry?.coordinates?.[0] || 0,
          bin: f.properties?.addendum?.pad?.bin || f.properties?.pad_bin || f.properties?.bin || "",
          bbl: f.properties?.addendum?.pad?.bbl || f.properties?.pad_bbl || f.properties?.bbl || ""
        }))
        setSearchResults(results)
      }
    } catch (e) {
      console.error("GeoSearch Error:", e)
    } finally {
      setIsSearching(false)
    }
  }

  // LOGIC: Select Address
  const selectAddress = (result: SearchResult) => {
    setNewPropAddr(result.display_name.split(',')[0]) // Keep it short for display
    setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), bin: result.bin, bbl: result.bbl })

    // Attempt to auto-detect borough from the full display name
    const lowerName = result.display_name.toLowerCase();
    if (lowerName.includes("queens")) setNewPropBorough("Queens");
    else if (lowerName.includes("brooklyn") || lowerName.includes("kings")) setNewPropBorough("Brooklyn");
    else if (lowerName.includes("bronx")) setNewPropBorough("Bronx");
    else if (lowerName.includes("staten island") || lowerName.includes("richmond")) setNewPropBorough("Staten Island");
    else setNewPropBorough("Manhattan"); // Fallback or explicit manhattan/new york
  }

  const [proofDocument, setProofDocument] = useState<File | null>(null)
  const [newPropBorough, setNewPropBorough] = useState("Manhattan")
  const [newPropUnits, setNewPropUnits] = useState(1)

  // LOGIC: Add Property (Updated with GeoSearch & Verification Safety)
  const handleAddProperty = async () => {
    if (!newPropAddr) {
      showToast("Please enter an address.", "info")
      return
    }

    // Duplicate Check
    const { data: existingProps, error: duplicateError } = await supabase
      .from('properties')
      .select('id, address')
      .ilike('address', newPropAddr)
      .limit(1);

    if (existingProps && existingProps.length > 0) {
      showToast("This property address is already registered.", "error");
      return;
    }

    // Tier Limit Check
    if (userRole !== 'admin') {
      const limit = getMaxPropertiesByTier(userProfile?.membership_tier);
      const currentCount = properties.filter(p => p.manager_id === userProfile?.id).length;
      if (currentCount >= limit) {
        showToast("Plan limit reached. Please upgrade to add more properties.", "error");
        return;
      }
    }

    // Default location (NYC) if search failed
    const lat = selectedLocation?.lat || 40.7128 + (Math.random() - 0.5) * 0.05
    const lng = selectedLocation?.lng || -74.0060 + (Math.random() - 0.5) * 0.05

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      showToast("Please log in again.", 'info')
      return
    }

    // Upload proof document if provided
    let proof_url = ""
    if (proofDocument) {
      const fileExt = proofDocument.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('property_verifications').upload(filePath, proofDocument)
      if (uploadError) {
        showToast("Error uploading verification document", "info")
        console.error(uploadError)
      } else {
        const { data } = supabase.storage.from('property_verifications').getPublicUrl(filePath)
        proof_url = data.publicUrl
      }
    }

    // Generate a random 6-character alphanumeric access code
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newP = {
      address: newPropAddr,
      borough: newPropBorough,
      units: newPropUnits,
      status: "Pending Verification", // Safety Mechanism
      violations: 0,
      access_code: generatedCode,
      lat,
      lng,
      image: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        ? `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        : `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300`,
      manager_id: user.id,
      // Temporarily excluding bin and bbl due to missing columns in DB:
      // bin: selectedLocation?.bin || "",
      // bbl: selectedLocation?.bbl || ""
    }

    // Only attach verification_document_url if we actually uploaded one (might still fail if column is missing completely, but this is the correct implementation)
    if (proof_url) {
      (newP as any).verification_document_url = proof_url;
    }

    // Insert into Supabase
    const { data, error } = await supabase.from('properties').insert(newP).select()

    if (error) {
      showToast("Error adding property", 'info')
      console.error("Supabase Insert Error:", JSON.stringify(error, null, 2))
    } else if (data) {
      setProperties([...properties, data[0] as Property])
      setNewPropAddr("")
      setProofDocument(null)
      setSearchResults([])
      showToast(`Property submitted. Pending verification!`)
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
    userProfile={userProfile}
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
          tenant_name: req.tenantName || user.user_metadata?.full_name || 'Tenant',
          unit: req.unit, // Passed from TenantDashboard state dynamically
          tenant_id: user.id,
          property_id: req.property_id || user.user_metadata?.property_id
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
        <aside className="w-64 border-r border-slate-700/50 bg-slate-900/40 backdrop-blur-md/50 flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-700/50 font-bold text-xl text-purple-400 cursor-pointer" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}><ShieldCheck className="w-6 h-6 mr-2" /> Admin Panel</div>
          <nav className="p-4 space-y-2 flex-1">
            {[
              { id: 'admin_overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'admin_verifications', icon: ShieldCheck, label: 'Verifications' },
              { id: 'admin_managers', icon: Building2, label: 'Management Cos' },
              { id: 'admin_tenants', icon: Users, label: 'Tenants' },
              { id: 'admin_subadmins', icon: ShieldCheck, label: 'Sub-Admins' },
              { id: 'admin_pro', icon: Wrench, label: 'Pro Network' },
              { id: 'admin_settings', icon: Settings, label: 'System Settings' }
            ].map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-slate-800/40 text-slate-400'}`}>
                <i.icon className="w-5 h-5" /> {i.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">A</div><div className="text-sm"><div className="font-bold">Super Admin</div><div className="text-xs text-slate-500">System Operator</div></div></div></div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-black relative">
          <header className="h-16 border-b border-slate-700/50 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-md/20">
            <div className="text-sm text-slate-400">System Status: <span className="text-emerald-500 font-bold">Operational</span></div>
            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}>Log Out</Button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {activeTab === 'dashboard' || activeTab === 'admin_overview' ? (
              <div className="space-y-8">
                {/* STATS */}
                <div className="grid grid-cols-4 gap-6">
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-6"><div className="text-sm text-slate-400">Total Users</div><div className="text-3xl font-bold text-white">1,240</div></CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-6"><div className="text-sm text-slate-400">Active Properties</div><div className="text-3xl font-bold text-white mb-1">{properties.length}</div><div className="text-xs text-emerald-500">+12% this month</div></CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-6"><div className="text-sm text-slate-400">Pro Network</div><div className="text-3xl font-bold text-white">{contractors.length}</div></CardContent></Card>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-6"><div className="text-sm text-slate-400">System Load</div><div className="text-3xl font-bold text-purple-400">34%</div></CardContent></Card>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* RECENT REQUESTS */}
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                    <CardHeader><CardTitle className="text-white">Recent Requests</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {requests.slice(0, 5).map(req => (
                        <div key={req.id} className="flex justify-between items-center p-3 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${req.priority === 'Urgent' || req.priority === 'High' ? 'bg-red-500' : 'bg-sky-400'}`}></div>
                            <div><div className="font-medium text-white">{req.issue}</div><div className="text-xs text-slate-400">{req.unit} • {req.tenantName}</div></div>
                          </div>
                          <Badge variant="outline" className="border-slate-700/50 text-slate-400">{req.status}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* PROPERTIES MAP MOCK */}
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 h-[400px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-800/40/50"></div>
                    <div className="z-10 text-center">
                      <MapIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                      <p className="text-slate-500">Live Map View</p>
                    </div>
                  </Card>
                </div>

                {/* PROPERTIES LIST (New) */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50 font-bold text-white flex justify-between items-center">
                    <span>Properties Overview</span>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-slate-700/50 text-slate-400">View All</Button>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {properties.slice(0, 5).map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40/50 transition-colors cursor-pointer" onClick={() => setManageProp(p)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800/40 rounded-lg flex items-center justify-center text-slate-500"><Building2 className="w-5 h-5" /></div>
                          <div><div className="font-bold text-white">{p.address}</div><div className="text-xs text-slate-500">{p.borough} • {p.units} Units</div></div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">{p.violations}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Violations</div>
                          </div>
                          <Badge className={p.status === 'Good' ? 'bg-emerald-500/10 text-emerald-500 border-0' : 'bg-red-500/10 text-red-500 border-0'}>{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}


            {/* ADMIN VERIFICATIONS TAB */}
            {activeTab === 'admin_verifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple-400" /> Pending Property Verifications</h2>
                    <p className="text-slate-400 mt-1">Review proof of ownership documents submitted by managers for new properties.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {properties.filter(p => p.status === 'Pending Verification').length === 0 ? (
                    <div className="text-center py-12 border border-slate-700/50 border-dashed rounded-xl bg-slate-900/40 backdrop-blur-md/50">
                      <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
                      <p className="text-slate-500">There are no properties waiting for verification.</p>
                    </div>
                  ) : (
                    properties.filter(p => p.status === 'Pending Verification').map(p => (
                      <Card key={p.id} className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50">
                        <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                          <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{p.address}</h3>
                              <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                <span>{p.borough}</span> • <span>{p.units} Units</span>
                                {p.bbl && <span>• BBL: {p.bbl}</span>}
                              </div>
                              <div className="text-xs text-sky-400 mt-2 font-mono">Submitted by Manager ID: {p.manager_id}</div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {p.verification_document_url ? (
                              <Button
                                variant="outline"
                                className="border-slate-600 hover:bg-slate-800 text-slate-300 gap-2"
                                onClick={() => window.open(p.verification_document_url, '_blank')}
                              >
                                <LayoutDashboard className="w-4 h-4" /> View Proof Document
                              </Button>
                            ) : (
                              <div className="text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded border border-amber-500/20 text-center">
                                No document provided
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 md:flex-none gap-2"
                                onClick={async () => {
                                  // Update DB
                                  const { error } = await supabase.from('properties')
                                    .update({ status: 'Good' })
                                    .eq('id', p.id);

                                  if (!error) {
                                    setProperties(properties.map(prop => prop.id === p.id ? { ...prop, status: 'Good' } : prop))
                                    showToast("Property Verified and Active!")
                                  } else {
                                    showToast("Error updating property", "info")
                                  }
                                }}
                              >
                                <CheckCircle className="w-4 h-4" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1 md:flex-none gap-2"
                                onClick={async () => {
                                  // Reject (Update status instead of delete to avoid RLS wipeout)
                                  const { error } = await supabase.from('properties')
                                    .update({ status: 'Rejected' })
                                    .eq('id', p.id);

                                  if (!error) {
                                    setProperties(properties.map(prop => prop.id === p.id ? { ...prop, status: 'Rejected' } : prop))
                                    showToast("Property Rejected")
                                  } else {
                                    showToast("Error rejecting property.", "error")
                                    console.error("Reject Update Error:", error)
                                  }
                                }}
                              >
                                <X className="w-4 h-4" /> Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}


            {/* ADMIN USERS TAB */}
            {/* ADMIN USER MANAGEMENT TABS */}
            {
              ['admin_managers', 'admin_tenants', 'admin_subadmins'].includes(activeTab) && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {activeTab === 'admin_managers' ? 'Management Companies' : activeTab === 'admin_tenants' ? 'Tenants' : 'System Administrators'}
                      </h2>
                      <p className="text-slate-400">
                        {activeTab === 'admin_managers' ? 'Oversee property management firms.' : activeTab === 'admin_tenants' ? 'Manage resident access.' : 'Manage super-admin access permissions.'}
                      </p>
                    </div>
                    {activeTab === 'admin_subadmins' && (
                      <Button className="bg-indigo-400 hover:bg-purple-700" onClick={() => alert("To add a new admin, they must sign up using the 'Super Admin Access' link on the login page.")}>
                        <Plus className="w-4 h-4 mr-2" /> Add Admin
                      </Button>
                    )}
                    {activeTab === 'admin_managers' && (
                      <Button className="bg-indigo-500 hover:bg-blue-700" onClick={() => setShowForceAddManager(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Add Company
                      </Button>
                    )}
                  </div>

                  <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-900/40 backdrop-blur-md border-b border-slate-700/50 text-white uppercase text-xs font-bold">
                        {activeTab === 'admin_managers' ? (
                          <tr>
                            <th className="p-4">Company / Manager Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Properties</th>
                            <th className="p-4">Plan Type</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="p-4">Name / ID</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 bg-slate-900/40 backdrop-blur-md/50">
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
                            <tr key={u.id} className="hover:bg-slate-800/40/50 transition-colors">
                              {activeTab === 'admin_managers' ? (
                                <>
                                  <td className="p-4 font-medium text-white flex items-center">
                                    {u.full_name || u.id.slice(0, 8)}
                                    {u.company_code && (
                                      <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded-md border border-indigo-500/30">
                                        {u.company_code}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4">{u.email}</td>
                                  <td className="p-4">
                                    <Badge variant="secondary" className="bg-slate-800/40 text-sky-400 hover:bg-slate-800/60">
                                      {properties.filter(p => p.manager_id === u.id).length} Managed
                                    </Badge>
                                  </td>
                                  <td className="p-4">
                                    <Badge className={`${u.membership_tier === 'Growth' ? 'bg-sky-500/20 text-sky-400' : u.membership_tier === 'Starter' ? 'bg-slate-800 text-slate-300' : 'bg-purple-500/20 text-purple-400'} border-0`}>
                                      {u.membership_tier || 'Free'}
                                    </Badge>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-4 font-medium text-white">{u.full_name || u.id.slice(0, 8)}</td>
                                  <td className="p-4">{u.email}</td>
                                  <td className="p-4"><Badge variant="secondary" className="bg-slate-800/40 text-zinc-300">{u.role}</Badge></td>
                                  <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                                </>
                              )}
                              <td className="p-4">
                                <Badge className={u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : u.status === 'Suspended' ? 'bg-red-500/10 text-red-500' : 'bg-amber-400/10 text-amber-400'}>
                                  {u.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                {activeTab === 'admin_managers' && (
                                  <>
                                    <Button size="icon" variant="outline" title="Reset Password" className="border-amber-700/50 text-amber-500 hover:text-white hover:bg-amber-500/10 mr-2" onClick={async () => {
                                      if (confirm(`Are you sure you want to completely RESET the password for ${u.full_name || u.email}? This will log them out and they will need the new temporary password.`)) {
                                        setForceManagerLoading(true);
                                        try {
                                          // Generate a secure random password locally
                                          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
                                          const randomValues = crypto.getRandomValues(new Uint16Array(12));
                                          const tempPassword = Array.from(randomValues, v => chars[v % chars.length]).join('');

                                          // Get current admin user ID securely
                                          const { data: { user: currentUser } } = await supabase.auth.getUser();
                                          if (!currentUser) throw new Error('Not authenticated');

                                          const response = await fetch('/api/admin/reset-password', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              target_id: u.id,
                                              new_password: tempPassword,
                                              request_user_id: currentUser.id // Needs to be the active admin's user ID
                                            })
                                          });

                                          if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(errorData.error || 'Failed to reset password');
                                          }

                                          // Pop up the same success modal we use for Make Manager
                                          setNewCompanyPassword(tempPassword);

                                        } catch (e: any) {
                                          console.error(e);
                                          showToast(e.message, 'error');
                                        } finally {
                                          setForceManagerLoading(false);
                                        }
                                      }
                                    }}>
                                      <Lock className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-slate-700/50 text-sky-400 hover:text-white hover:bg-sky-500/10 mr-2" onClick={() => {
                                      setEditingCompanyData({ id: u.id, name: u.full_name || '', email: u.email, tier: u.membership_tier || 'Free' });
                                    }}>Edit</Button>
                                  </>
                                )}
                                {(u.status === 'Pending' || u.status === 'Suspended') && (
                                  <Button size="sm" className="bg-emerald-600 hover:bg-green-700 text-white" onClick={async () => {
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
                                <Button size="icon" variant="ghost" className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 ml-2" onClick={async () => {
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
                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl w-full max-w-sm space-y-4 relative">
                          <h3 className="text-xl font-bold text-white mb-4">Add Management Company</h3>
                          <div className="space-y-3">
                            <Input placeholder="Manager Name" value={forceManagerData.name} onChange={e => setForceManagerData({ ...forceManagerData, name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
                            <Input placeholder="Email Address" type="email" value={forceManagerData.email} onChange={e => setForceManagerData({ ...forceManagerData, email: e.target.value.trim() })} className="bg-slate-800/40 border-slate-700/50 text-white" />
                            <Input placeholder="Company Name" value={forceManagerData.company} onChange={e => setForceManagerData({ ...forceManagerData, company: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
                            <div className="text-xs text-amber-400">Note: Default password will be <b>ChangeMe123!</b></div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="ghost" onClick={() => setShowForceAddManager(false)}>Cancel</Button>
                            <Button className="bg-indigo-500 hover:bg-blue-700" onClick={handleForceAddManager} disabled={!forceManagerData.email || forceManagerLoading}>
                              {forceManagerLoading ? 'Creating...' : 'Create Account'}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* NEW COMPANY PASSWORD MODAL */}
                  <AnimatePresence>
                    {newCompanyPassword && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-slate-900/40 backdrop-blur-md border border-emerald-500/50 p-6 rounded-xl w-full max-w-sm space-y-4 relative shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                          <div className="flex justify-center mb-2">
                            <div className="bg-emerald-500/20 p-3 rounded-full">
                              <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-white text-center">Password Generated!</h3>
                          <p className="text-slate-400 text-sm text-center">
                            The secure temporary password has been successfully generated. Please securely share it.
                          </p>
                          <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-lg flex items-center justify-between mt-4">
                            <code className="text-emerald-400 font-mono text-lg">{newCompanyPassword}</code>
                            <Button size="icon" variant="ghost" className={`${isCopied ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-white"}`} onClick={() => {
                              navigator.clipboard.writeText(newCompanyPassword);
                              setIsCopied(true);
                              showToast("Password copied to clipboard!");
                              setTimeout(() => setIsCopied(false), 2000);
                            }}>
                              {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </Button>
                          </div>
                          <div className="text-center mt-6 pt-4 border-t border-slate-800">
                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setNewCompanyPassword(null)}>
                              Close
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* EDIT COMPANY MODAL */}
                  <AnimatePresence>
                    {editingCompanyData && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl w-full max-w-sm space-y-4 relative">
                          <h3 className="text-xl font-bold text-white mb-4">Edit Management Company</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Company / Manager Name</label>
                              <Input placeholder="Company Name" value={editingCompanyData.name} onChange={e => setEditingCompanyData({ ...editingCompanyData, name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Email (Cannot be changed directly)</label>
                              <Input disabled value={editingCompanyData.email} className="bg-slate-900/60 border-slate-700/50 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Plan Tier</label>
                              <select
                                className="w-full bg-slate-800/40 border-slate-700/50 text-white rounded-md p-2 text-sm outline-none focus:border-indigo-500"
                                value={editingCompanyData.tier}
                                onChange={e => setEditingCompanyData({ ...editingCompanyData, tier: e.target.value })}
                              >
                                <option value="Free">Free</option>
                                <option value="Starter">Starter</option>
                                <option value="Growth">Growth</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                            <Button variant="ghost" onClick={() => setEditingCompanyData(null)}>Cancel</Button>
                            <Button className="bg-indigo-500 hover:bg-blue-700 text-white" disabled={isEditingCompany} onClick={async () => {
                              setIsEditingCompany(true);
                              const { error } = await supabase.rpc('update_company_profile', {
                                target_id: editingCompanyData.id,
                                new_name: editingCompanyData.name,
                                new_tier: editingCompanyData.tier
                              });

                              if (!error) {
                                setUsers(users.map(u => u.id === editingCompanyData.id ? { ...u, full_name: editingCompanyData.name, membership_tier: editingCompanyData.tier } : u));
                                showToast("Company details updated!");
                                setEditingCompanyData(null);
                              } else {
                                showToast("Error updating company.", 'error');
                                console.error("Edit Company Error:", error);
                              }
                              setIsEditingCompany(false);
                            }}>
                              {isEditingCompany ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }



            {/* ADMIN REQUESTS TAB */}
            {
              activeTab === 'admin_requests' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div><h2 className="text-2xl font-bold text-white">Request Management</h2><p className="text-slate-400">Track and resolve tenant issues.</p></div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="border-slate-700/50 text-gray-300">Export CSV</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {requests.map(req => (
                      <div key={req.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-lg flex items-center justify-between hover:bg-slate-800/40/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${req.priority === 'Urgent' ? 'bg-red-500/20 text-red-500' : 'bg-sky-400/20 text-sky-400'}`}>
                            {req.type === 'Repair' ? <Wrench className="w-6 h-6" /> : req.type === 'Billing' ? <CreditCard className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-lg">{req.issue}</span>
                              {req.priority === 'Urgent' && <Badge className="bg-red-500 text-white border-0">Urgent</Badge>}
                              <Badge variant="outline" className="border-slate-700/50 text-slate-400">{req.type}</Badge>
                            </div>
                            <div className="text-sm text-slate-400">{req.unit} • {req.tenantName} • {req.date}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            className="bg-slate-950 border border-slate-700/50 text-gray-300 text-sm rounded-md px-3 py-2 outline-none focus:border-purple-500"
                            value={req.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              // Optimistic UI update
                              const updated = requests.map(r => r.id === req.id ? { ...r, status: newStatus } : r);
                              setRequests(updated as any);
                              // Persist to Supabase
                              const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', req.id);
                              if (error) console.error('Failed to persist status:', error);
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                          <Button size="sm" className="bg-slate-800/40 hover:bg-zinc-700 text-white">Details</Button>
                        </div>
                      </div>
                    ))}
                    {requests.length === 0 && <div className="text-center text-slate-500 py-12">No active requests found.</div>}
                  </div>
                </div>
              )
            }
            {/* PRO NETWORK TAB */}
            {
              activeTab === 'admin_pro' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-2xl font-bold text-white">Pro Network Management</h2><p className="text-slate-400">Manage contractors, categories, and verification status.</p></div>
                    <Button className="bg-indigo-400 hover:bg-purple-700 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>
                  </div>

                  {/* FILTERS */}
                  <div className="flex gap-4 bg-slate-900/40 backdrop-blur-md/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-gray-300">Filters:</span>
                    </div>
                    <select className="bg-slate-800/40 border-slate-700/50 text-white text-sm rounded-md px-3 py-1" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
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
                    <select className="bg-slate-800/40 border-slate-700/50 text-white text-sm rounded-md px-3 py-1" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                      <option value="All">All Locations</option>
                      <option value="Manhattan">Manhattan</option>
                      <option value="Brooklyn">Brooklyn</option>
                      <option value="Queens">Queens</option>
                      <option value="Bronx">Bronx</option>
                      <option value="Staten Island">Staten Island</option>
                      <option value="NJ">New Jersey</option>
                    </select>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-500 ml-auto" onClick={() => { setFilterCategory("All"); setFilterLocation("All"); }}>Reset</Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredContractors.length === 0 ? <div className="text-center text-slate-500 py-8">No contractors found matching filters.</div> : filteredContractors.map(c => (
                      <div key={c.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {c.image ? (
                            <img src={c.image} alt={c.name} className="w-12 h-12 rounded-lg object-cover bg-slate-800/40" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-800/40 rounded-lg flex items-center justify-center text-xl font-bold text-slate-500">{c.name[0]}</div>
                          )}
                          <div>
                            <div className="font-bold text-white text-lg">{c.name}</div>
                            {c.company && <div className="text-sm text-slate-400 font-medium">{c.company}</div>}
                            <div className="text-purple-400 text-sm flex items-center gap-2">
                              <span>{c.category || c.type}</span>
                              {c.location && <span className="bg-slate-800/40 text-gray-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{c.location}</span>}
                              <span className="text-emerald-500 flex items-center gap-1">• Verified <CheckCircle className="w-3 h-3" /></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-slate-700/50 text-gray-300 hover:text-white" onClick={() => {
                            setEditingContractor(c)
                            setNewCon({ name: c.name, company: c.company || '', location: c.location || '', category: c.category || c.type, phone: c.phone || '', email: c.email || '', image: c.image || '' })
                            setShowAddContractor(true)
                          }}>Edit Profile</Button>
                          <Button variant="outline" size="sm" className="border-slate-700/50 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDeleteContractor(c.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            {
              activeTab === 'admin_settings' && (
                <div className="max-w-2xl space-y-6">
                  <h2 className="text-2xl font-bold text-white">Global System Settings</h2>
                  <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between"><div className="text-white font-medium">Maintenance Mode</div><div className="w-12 h-6 bg-zinc-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-zinc-400 rounded-full"></div></div></div>
                    <div className="flex items-center justify-between"><div className="text-white font-medium">Allow New User Signup</div><div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div></div>
                    <div className="flex items-center justify-between"><div className="text-white font-medium">Require Admin Approval for Tenants</div><div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div></div>
                  </CardContent></Card>
                </div>
              )
            }
          </div >
        </main >

        {/* ADMIN MODALS */}
        < AnimatePresence > {showAddContractor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl w-full max-w-md space-y-4">
              <h3 className="text-xl font-bold text-white">{editingContractor ? 'Edit Contractor' : 'Add New Contractor'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400">Name</label>
                  <Input placeholder="Contractor Name" value={newCon.name} onChange={e => setNewCon({ ...newCon, name: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Company Name</label>
                  <Input placeholder="Company Name (Optional)" value={newCon.company} onChange={e => setNewCon({ ...newCon, company: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select
                    className="w-full bg-slate-800/40 border-slate-600/50 text-white rounded-md p-2 text-sm"
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
                  <label className="text-xs text-slate-400">Phone</label>
                  <Input placeholder="Phone Number" value={newCon.phone} onChange={e => setNewCon({ ...newCon, phone: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <Input placeholder="Email Address" value={newCon.email} onChange={e => setNewCon({ ...newCon, email: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Profile Image URL</label>
                  <div className="flex gap-2">
                    <Input placeholder="https://..." value={newCon.image} onChange={e => setNewCon({ ...newCon, image: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white flex-1" />
                    <Button variant="outline" type="button" onClick={() => setNewCon({ ...newCon, image: `https://source.unsplash.com/random/100x100/?portrait,${Math.floor(Math.random() * 1000)}` })} className="border-slate-600/50 text-gray-300">Random</Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => { setShowAddContractor(false); setEditingContractor(null); setNewCon({ name: '', category: 'General', phone: '', email: '', company: '', location: '', image: '' }) }}>Cancel</Button>
                <Button className="bg-indigo-400 text-white" onClick={editingContractor ? handleUpdateContractor : handleAddContractor} disabled={!newCon.name}>
                  {editingContractor ? 'Update Contractor' : 'Add Contractor'}
                </Button>
              </div>
            </div>
          </motion.div>
        )
        }</AnimatePresence >
      </div >
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[100] bg-slate-800/40 border border-slate-700/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{toast.msg}
        </motion.div>
      )}</AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-xl cursor-pointer hover:text-sky-400 transition-colors" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}><Building2 className="w-6 h-6 mr-2 text-sky-400" />AssetGuard</div>

        {/* MEMBERSHIP BADGE */}
        {userProfile?.membership_tier ? (
          <div className="mx-4 mt-4 px-4 py-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-sky-400/30 flex items-center justify-between group cursor-pointer hover:border-sky-400/50 transition-all">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {userProfile.membership_tier} <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 group-hover:text-white" onClick={() => setShowUpgradeModal(true)}><Settings className="w-3 h-3" /></Button>
          </div>
        ) : (
          <div className="mx-4 mt-4 px-4 py-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between group cursor-pointer hover:bg-indigo-500/20 transition-all">
            <div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Plan</div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                Free Tier
              </div>
            </div>
            <Button size="sm" className="bg-indigo-500 hover:bg-sky-400 text-white text-xs h-7 px-2" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>
          </div>
        )}

        <nav className="p-4 space-y-2 flex-1">
          {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Overview' }, { id: 'requests', icon: ClipboardList, label: 'Requests', badge: requests.filter(r => r.status === 'Pending').length }, { id: 'map', icon: MapIcon, label: 'Map' }, { id: 'properties', icon: Building2, label: 'Properties' }, { id: 'manager_tenants', icon: Users, label: 'Tenants' }, { id: 'calendar', icon: Calendar, label: 'Compliance Calendar' }, { id: 'll97', icon: Flame, label: 'LL97 Simulator' }, { id: 'contractors', icon: Users, label: 'Pro Network' }, { id: 'settings', icon: Settings, label: 'Settings' }].map(i => (
            <button key={i.id} onClick={() => setActiveTab(i.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-primary/10 text-primary shadow-sm shadow-sky-400/10' : 'hover:bg-secondary text-slate-400 hover:text-white'}`}>
              <i.icon className="w-5 h-5" /> {i.label} {i.badge ? <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/40">{i.badge}</span> : null}
            </button>
          ))}
        </nav>

        {/* API Status Widget */}
        <div className="p-4 mt-auto border-t border-border bg-black/20">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" /> Live Data Feeds
          </h4>
          <div className="space-y-2 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> HPD Violations (wvxf-dvoa)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> 311 Service Requests (erm2)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Housing Litigation (59hk)</div>
            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> HPD Charges (7k4b)</div>
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

        <ErrorBoundary>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/20">
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-6">
                  <Card className="bg-card/50">
                    <CardContent className="p-6">Properties
                      <h3 className="text-2xl font-bold">
                        {properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || '')).length}
                      </h3>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50"><CardContent className="p-6">Requests<h3 className="text-2xl font-bold text-orange-400">{requests.filter(r => r.status === 'Pending').length}</h3></CardContent></Card>
                </div>
                {properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || '')).length > 0 ? (
                  <div className="h-[400px] rounded-xl overflow-hidden border border-border">
                    <MapViewer
                      properties={properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || ''))}
                      onSelectProperty={setManageProp}
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl">
                    <Building2 className="w-14 h-14 mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Welcome to AssetGuard</h3>
                    <p className="text-slate-400 mb-6">Register your first property to start monitoring compliance, violations, and tenant requests.</p>
                    <Button className="bg-primary text-white gap-2" onClick={() => setShowAddProperty(true)}><Plus className="w-4 h-4" /> Add Your First Property</Button>
                  </div>
                )}
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
                        <div className="w-10 h-10 rounded-full bg-sky-400/20 flex justify-center items-center text-sky-400 group-hover:scale-110 transition-transform"><Wrench className="w-5 h-5" /></div>
                        <div>
                          <h4 className="font-bold flex items-center gap-2">
                            {r.issue}
                            {r.assigned_pro_id && <Badge variant="outline" className="text-[10px] h-5 bg-purple-500/10 text-purple-400 border-purple-500/20">Assigned</Badge>}
                          </h4>
                          <p className="text-sm text-muted-foreground">{r.tenantName || r.tenant_name} • {r.unit}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${r.status === 'Pending' ? 'bg-amber-500' : r.status === 'Resolved' ? 'bg-emerald-500' : 'bg-sky-400'} hover:bg-opacity-80 transition-colors`}>{r.status}</Badge>
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
                    <div className="h-48 relative"><img src={p.image || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300'} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300'; e.currentTarget.onerror = null; }} className="w-full h-full object-cover" /><Badge className="absolute top-2 right-2">{p.status}</Badge></div>
                    <CardContent className="p-4">
                      <h3 className="font-bold">{p.address}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{p.units} Units</p>
                      <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 bg-slate-900/40 backdrop-blur-md/50 p-2 rounded border border-slate-700/50">
                        <Lock className="w-3 h-3" />
                        Access Code: <span className="text-zinc-300 font-mono font-bold tracking-widest">{p.access_code || 'N/A'}</span>
                      </div>
                      <Button className="w-full" variant="outline" onClick={() => setManageProp(p)}>Manage Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* MANAGER TENANTS TAB */}
            {activeTab === 'manager_tenants' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Your Tenants</h2>
                    <p className="text-slate-400">View and manage tenants registered to your properties.</p>
                  </div>
                </div>

                <Card className="bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80">
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Name</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Property</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProfiles.filter(p => p.role === 'tenant' && activeProperties.some(prop => prop.id === p.property_id)).map((tenant) => {
                          const prop = activeProperties.find(p => p.id === tenant.property_id);
                          return (
                            <tr key={tenant.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4">
                                <span className="text-sm font-semibold text-slate-200">{tenant.full_name || 'Anonymous Tenant'}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-400">{tenant.email}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-300">{prop?.address || 'Unknown Property'}</span>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 whitespace-nowrap">
                                  {tenant.unit || 'N/A'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {tenant.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-xs text-slate-500">{new Date(tenant.created_at).toLocaleDateString()}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {allProfiles.filter(p => p.role === 'tenant' && activeProperties.some(prop => prop.id === p.property_id)).length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-500">
                              No tenants registered yet. Distribute your property access codes for tenants to sign up.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* MANAGER TENANTS TAB */}
            {activeTab === 'manager_tenants' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Your Tenants</h2>
                    <p className="text-slate-400">View and manage tenants registered to your properties.</p>
                  </div>
                </div>

                <Card className="bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80">
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Name</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Property</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProfiles.filter(p => p.role === 'tenant' && activeProperties.some(prop => prop.id === p.property_id)).map((tenant) => {
                          const prop = activeProperties.find(p => p.id === tenant.property_id);
                          return (
                            <tr key={tenant.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4">
                                <span className="text-sm font-semibold text-slate-200">{tenant.full_name || 'Anonymous Tenant'}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-400">{tenant.email}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-300">{prop?.address || 'Unknown Property'}</span>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 whitespace-nowrap">
                                  {tenant.unit || 'N/A'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {tenant.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-xs text-slate-500">{new Date(tenant.created_at).toLocaleDateString()}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {allProfiles.filter(p => p.role === 'tenant' && activeProperties.some(prop => prop.id === p.property_id)).length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-500">
                              No tenants registered yet. Distribute your property access codes for tenants to sign up.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}


            {/* COMPLIANCE CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-sky-400" /> Compliance Calendar</h2>
                    <p className="text-muted-foreground mt-1">Track key deadlines for all major NYC local laws across your portfolio.</p>
                  </div>
                  {/* Upgrade Placeholder CTA */}
                  {(!userProfile?.membership_tier || userProfile.membership_tier === 'Free') && (
                    <Button className="bg-indigo-500 hover:bg-indigo-500 text-white gap-2" onClick={() => {
                      // Dummy handler for upgrade
                      alert("This will redirect to Stripe Checkout to upgrade your tier to Pro ($29/mo).")
                    }}>
                      <ArrowUpCircle className="w-4 h-4" /> Unlock Pro Features
                    </Button>
                  )}
                </div>

                {properties.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 backdrop-blur-md/50 border border-slate-700/50 rounded-xl relative overflow-hidden group">
                    <Flame className="w-12 h-12 mx-auto text-zinc-700 mb-4 group-hover:text-slate-500 transition-colors" />
                    <h3 className="text-xl font-bold text-white mb-2">No Properties Found</h3>
                    <p className="text-slate-400 mb-6">Add a property to start tracking its NYC compliance deadlines (LL97, LL84, LL11, etc.).</p>
                    <Button className="bg-indigo-500 text-white hover:bg-sky-400" onClick={() => setShowAddProperty(true)}>
                      <Building2 className="w-4 h-4 mr-2" /> Add Your First Property
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(p => (
                      <Card key={p.id} className="bg-card/50 border-slate-700/50 flex flex-col">
                        <CardHeader className="border-b border-slate-800/50 pb-4 bg-slate-900/40 backdrop-blur-md/30">
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span className="truncate pr-4">{p.address}</span>
                            <Badge variant="outline" className="shrink-0">{p.units} Units</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                          <div className="divide-y divide-slate-800/50/50">
                            {/* LL97 */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800/40/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Flame className="w-4 h-4 text-amber-500" /></div>
                                <div>
                                  <div className="text-sm font-bold">LL97 (Carbon)</div>
                                  <div className="text-xs text-slate-500">Report Due</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-white">May 1, 2025</div>
                                <Badge variant="default" className="text-[10px] bg-red-500 mt-1">Action Req</Badge>
                              </div>
                            </div>
                            {/* LL84 */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800/40/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-sky-400/20 flex items-center justify-center"><Zap className="w-4 h-4 text-sky-400" /></div>
                                <div>
                                  <div className="text-sm font-bold">LL84 (Energy)</div>
                                  <div className="text-xs text-slate-500">Benchmarking</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-white">May 1, 2025</div>
                                <Badge variant="outline" className="text-[10px] text-orange-400 border-amber-500/50 mt-1">Approaching</Badge>
                              </div>
                            </div>
                            {/* LL11 */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800/40/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><Building2 className="w-4 h-4 text-purple-500" /></div>
                                <div>
                                  <div className="text-sm font-bold">LL11 (FISP)</div>
                                  <div className="text-xs text-slate-500">Facade Inspect</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-400">Cycle 10</div>
                                <Badge variant="outline" className="text-[10px] text-slate-500 border-gray-700 mt-1">Pending Block</Badge>
                              </div>
                            </div>
                            {/* LL152 */}
                            <div className="p-4 flex items-center justify-between hover:bg-slate-800/40/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center"><Scale className="w-4 h-4 text-gray-300" /></div>
                                <div>
                                  <div className="text-sm font-bold">LL152 (Gas)</div>
                                  <div className="text-xs text-slate-500">Piping System</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-400">Dec 31, 2025</div>
                                <Badge variant="outline" className="text-[10px] text-slate-500 border-gray-700 mt-1">On Track</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        {(!userProfile?.membership_tier || userProfile.membership_tier === 'Free') && (
                          <div className="p-4 bg-indigo-500/10 border-t border-indigo-500/20 text-center">
                            <p className="text-xs text-indigo-300 mb-2">Automated alerts available in Pro.</p>
                            <Button size="sm" variant="outline" className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20" onClick={() => alert("Upgrade to Pro to unlock automated D-30 and D-7 reminders via Email/SMS.")}>Enable Alerts</Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LL97 CARBON LAW SIMULATOR */}
            {activeTab === 'll97' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Flame className="w-6 h-6 text-amber-500" /> LL97 Carbon Emissions Simulator</h2>
                  <p className="text-muted-foreground mt-1">Estimate your building's compliance with NYC Local Law 97 (Climate Mobilization Act) and calculate potential penalties.</p>
                </div>

                {/* Input Form */}
                <Card className="bg-card/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Building Information</CardTitle>
                    <CardDescription>Enter details about your property to simulate LL97 compliance. Select an existing property or enter manually.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick select from existing properties */}
                    {properties.length > 0 && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Quick Select Property</label>
                        <div className="flex flex-wrap gap-2">
                          {properties.map(p => (
                            <Button key={p.id} size="sm" variant="outline" className="text-xs border-slate-700/50 hover:border-sky-400 hover:text-sky-300" onClick={() => runLL97Simulation(p)}>
                              <Building2 className="w-3 h-3 mr-1" /> {p.address}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Approx. Square Footage</label>
                        <Input placeholder="e.g. 50000" value={ll97Props.squareFootage} onChange={e => setLl97Props({ ...ll97Props, squareFootage: e.target.value })} className="bg-slate-800/40 border-slate-600/50" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Primary Heating Fuel</label>
                        <select className="w-full bg-slate-800/40 border border-slate-600/50 text-white rounded-md p-2 text-sm" value={ll97Props.heatingFuel} onChange={e => setLl97Props({ ...ll97Props, heatingFuel: e.target.value })}>
                          <option value="Natural Gas">Natural Gas</option>
                          <option value="#2 Fuel Oil">#2 Fuel Oil</option>
                          <option value="#4 Fuel Oil">#4 Fuel Oil</option>
                          <option value="Electric (Grid)">Electric (Grid)</option>
                          <option value="Steam (District)">Steam (District)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Building Type</label>
                        <select className="w-full bg-slate-800/40 border border-slate-600/50 text-white rounded-md p-2 text-sm" value={ll97Props.buildingType} onChange={e => setLl97Props({ ...ll97Props, buildingType: e.target.value })}>
                          <option value="Multifamily Residential">Multifamily Residential</option>
                          <option value="Office">Office</option>
                          <option value="Retail">Retail</option>
                          <option value="Mixed Use">Mixed Use</option>
                          <option value="Hotel">Hotel</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Year Built</label>
                        <Input placeholder="e.g. 1960" value={ll97Props.yearBuilt} onChange={e => setLl97Props({ ...ll97Props, yearBuilt: e.target.value })} className="bg-slate-800/40 border-slate-600/50" />
                      </div>
                    </div>

                    <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => runLL97Simulation(properties[0])} disabled={ll97Loading}>
                      {ll97Loading ? <><Activity className="w-4 h-4 animate-spin" /> Simulating...</> : <><Flame className="w-4 h-4" /> Run LL97 Simulation</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Results */}
                {ll97Result && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Status Banner */}
                    <div className={`p-6 rounded-xl border ${ll97Result.risk_level === 'Critical' ? 'bg-red-500/10 border-red-500/30' : ll97Result.risk_level === 'High' ? 'bg-amber-500/10 border-amber-500/30' : ll97Result.risk_level === 'Medium' ? 'bg-amber-400/10 border-amber-400/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {ll97Result.risk_level === 'Critical' || ll97Result.risk_level === 'High' ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <CheckCircle className="w-6 h-6 text-emerald-500" />}
                          {ll97Result.compliance_status}
                        </h3>
                        <Badge className={`text-sm px-3 py-1 ${ll97Result.risk_level === 'Critical' ? 'bg-red-500' : ll97Result.risk_level === 'High' ? 'bg-amber-500' : ll97Result.risk_level === 'Medium' ? 'bg-amber-400 text-black' : 'bg-emerald-500'}`}>
                          {ll97Result.risk_level} Risk
                        </Badge>
                      </div>
                      <p className="text-zinc-300">{ll97Result.summary}</p>
                    </div>

                    {/* Emission Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-white mb-1">{ll97Result.estimated_emissions_tco2e}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">tCO₂e / Year</div>
                      </CardContent></Card>
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-sky-300 mb-1">{ll97Result.phase1_limit_tco2e}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phase 1 Limit (2024-29)</div>
                      </CardContent></Card>
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-1">{ll97Result.phase2_limit_tco2e}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Phase 2 Limit (2030-34)</div>
                      </CardContent></Card>
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-red-400 mb-1">{ll97Result.total_10yr_penalty_risk}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">10-Year Penalty Risk</div>
                      </CardContent></Card>
                    </div>

                    {/* Annual Penalties */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-5">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Phase 1 Annual Penalty (2024-2029)</div>
                        <div className="text-2xl font-bold text-white">${ll97Result.phase1_penalty_annual?.toLocaleString() || '0'}</div>
                        <div className="text-xs text-slate-400 mt-1">$268/ton over limit</div>
                      </CardContent></Card>
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50"><CardContent className="p-5">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Phase 2 Annual Penalty (2030-2034)</div>
                        <div className="text-2xl font-bold text-orange-400">${ll97Result.phase2_penalty_annual?.toLocaleString() || '0'}</div>
                        <div className="text-xs text-slate-400 mt-1">Stricter limits apply</div>
                      </CardContent></Card>
                    </div>

                    {/* Retrofit Recommendations */}
                    {ll97Result.retrofits?.length > 0 && (
                      <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2"><Wrench className="w-5 h-5 text-sky-400" /> Recommended Retrofits</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {ll97Result.retrofits.map((r: any, i: number) => (
                            <div key={i} className="flex items-start gap-4 p-4 bg-slate-950 border border-slate-700/50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full mt-2 ${r.priority === 'High' ? 'bg-red-500' : r.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                              <div className="flex-1">
                                <div className="font-bold text-white text-sm">{r.action}</div>
                                <div className="text-xs text-slate-400 mt-1">Cost: {r.estimated_cost} • Emission Reduction: {r.emission_reduction_pct}% • Payback: {r.payback_years} years</div>
                              </div>
                              <Badge variant="outline" className={`shrink-0 text-[10px] ${r.priority === 'High' ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>{r.priority}</Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Timeline */}
                    {ll97Result.compliance_timeline && (
                      <div className="p-4 bg-blue-900/10 border border-sky-400/20 rounded-xl">
                        <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-1"><Clock className="w-4 h-4" /> Compliance Timeline</div>
                        <p className="text-zinc-300 text-sm">{ll97Result.compliance_timeline}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* LL97 SIMULATOR TAB */}
            {activeTab === 'll97' && (
              <div className="space-y-6 max-w-5xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-400"><Leaf className="w-6 h-6" /> Local Law 97 Simulator</h2>
                    <p className="text-muted-foreground mt-1">Estimate carbon emissions, visualize penalty timelines, and discover ROI for green retrofits.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column: Input Form */}
                  <div className="md:col-span-1 space-y-4">
                    <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg text-white">Building Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Property Address *</label>
                          <Input placeholder="e.g. 123 Broadway, NY" className="bg-slate-950 border-slate-700/50 text-white" value={ll97Props.address} onChange={e => setLl97Props({ ...ll97Props, address: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Square Footage *</label>
                          <Input type="number" placeholder="e.g. 50000" className="bg-slate-950 border-slate-700/50 text-white" value={ll97Props.squareFootage} onChange={e => setLl97Props({ ...ll97Props, squareFootage: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Year Built</label>
                          <Input type="number" placeholder="e.g. 1960" className="bg-slate-950 border-slate-700/50 text-white" value={ll97Props.yearBuilt} onChange={e => setLl97Props({ ...ll97Props, yearBuilt: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Primary Fuel</label>
                          <select className="w-full bg-slate-950 border border-slate-700/50 text-white text-sm rounded-md p-2 outline-none focus:ring-1 focus:ring-emerald-500" value={ll97Props.heatingFuel} onChange={e => setLl97Props({ ...ll97Props, heatingFuel: e.target.value })}>
                            <option>Natural Gas</option>
                            <option>#2 Fuel Oil</option>
                            <option>#4 Fuel Oil</option>
                            <option>District Steam</option>
                            <option>Electricity (Heat Pumps)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase">Building Type</label>
                          <select className="w-full bg-slate-950 border border-slate-700/50 text-white text-sm rounded-md p-2 outline-none focus:ring-1 focus:ring-emerald-500" value={ll97Props.buildingType} onChange={e => setLl97Props({ ...ll97Props, buildingType: e.target.value })}>
                            <option>Multifamily Residential</option>
                            <option>Commercial Office</option>
                            <option>Retail</option>
                            <option>Industrial</option>
                            <option>Mixed Use</option>
                          </select>
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 mt-2" onClick={() => runLL97Simulation()} disabled={ll97Loading}>
                          {ll97Loading ? <><Zap className="w-4 h-4 mr-2 animate-pulse" /> Analyzing Emissions Data...</> : <><Activity className="w-4 h-4 mr-2" /> Run AI Simulation</>}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: Visualization Output */}
                  <div className="md:col-span-2 space-y-6">
                    {!ll97Result && !ll97Loading ? (
                      <div className="h-full min-h-[400px] border border-dashed border-slate-700/50 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-900/20">
                        <Leaf className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-500 mb-2">Ready to Simulate</h3>
                        <p className="text-slate-600 max-w-sm">Enter the building parameters on the left to project carbon emissions and calculate 10-year penalty risks for Local Law 97.</p>
                      </div>
                    ) : ll97Loading ? (
                      <div className="h-full min-h-[400px] border border-slate-700/50 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 backdrop-blur-md">
                        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-2 animate-pulse">Running Gemini AI Compliance Models...</h3>
                        <p className="text-slate-500 text-sm">Calculating phase limits and extrapolating retrofit ROI.</p>
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Status Header */}
                        <div className={`p-5 rounded-xl border flex items-center justify-between shadow-lg ${ll97Result.compliance_status === 'Compliant' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {ll97Result.compliance_status === 'Compliant' ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                              <span className={`font-bold text-lg ${ll97Result.compliance_status === 'Compliant' ? 'text-emerald-400' : 'text-red-400'}`}>{ll97Result.compliance_status}</span>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">{ll97Result.summary}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">10-Year Fine Risk</div>
                            <div className="text-3xl font-bold text-white">{ll97Result.total_10yr_penalty_risk}</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Penalty Timeline Chart (Custom CSS Bars) */}
                          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-400" /> Annual Penality Projection</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-end gap-6 h-48 mt-4 pt-4 border-b border-slate-700/50 pb-2 relative">
                                {/* Dynamic Bars */}
                                <div className="flex-1 flex flex-col justify-end items-center group relative cursor-pointer">
                                  <div className="text-xs text-white mb-2 font-mono font-bold">${ll97Result.phase1_penalty_annual?.toLocaleString() || 0}</div>
                                  <div className="w-16 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-md transition-all group-hover:opacity-80 shadow-[0_0_15px_rgba(56,189,248,0.2)]" style={{ height: ll97Result.phase1_penalty_annual > 0 ? '40%' : '10px' }}></div>
                                  <div className="absolute -bottom-6 text-xs text-slate-400 font-bold">2024 - 2029</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-end items-center group relative cursor-pointer">
                                  <div className="text-xs text-red-400 mb-2 font-mono font-bold">${ll97Result.phase2_penalty_annual?.toLocaleString() || 0}</div>
                                  <div className="w-16 bg-gradient-to-t from-red-600 to-orange-400 rounded-t-md transition-all group-hover:opacity-80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" style={{ height: ll97Result.phase2_penalty_annual > 0 ? '90%' : '10px' }}></div>
                                  <div className="absolute -bottom-6 text-xs text-slate-400 font-bold">2030 - 2034</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Emissions Gap Data */}
                          <div className="space-y-4">
                            <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Est. Emissions</div>
                                  <div className="text-xl font-bold text-white">{ll97Result.estimated_emissions_tco2e} <span className="text-sm font-normal text-slate-400">tCO2e</span></div>
                                </div>
                                <Flame className="w-8 h-8 text-orange-500 opacity-50" />
                              </CardContent>
                            </Card>
                            <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                              <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Phase 2 Limit</div>
                                  <div className="text-xl font-bold text-emerald-400">{ll97Result.phase2_limit_tco2e} <span className="text-sm font-normal text-emerald-700">tCO2e</span></div>
                                </div>
                                <Scale className="w-8 h-8 text-emerald-500 opacity-50" />
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {/* Retrofit Recommendations */}
                        {ll97Result.retrofits?.length > 0 && (
                          <div className="bg-blue-900/10 border border-sky-400/20 rounded-xl p-5 mt-6">
                            <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-sky-400" /> AI Recommended Solutions</h3>
                            <div className="space-y-3">
                              {ll97Result.retrofits.map((r: any, i: number) => (
                                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${r.priority === 'Critical' || r.priority === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : r.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                                    <div>
                                      <div className="font-bold text-sky-100 text-sm">{r.action}</div>
                                      <div className="text-xs text-slate-400 mt-1">Est. Cost: <span className="text-slate-300 font-mono">{r.estimated_cost}</span> &nbsp;|&nbsp; Payback: <span className="text-slate-300 font-mono">{r.payback_years} yrs</span></div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end shrink-0 w-full sm:w-auto">
                                    <div className="text-emerald-400 font-bold text-sm">-{r.emission_reduction_pct}% CO2</div>
                                    <Badge variant="outline" className={`mt-1 text-[10px] ${r.priority === 'Critical' || r.priority === 'High' ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>{r.priority}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <Button className="w-full mt-4 bg-indigo-500 hover:bg-sky-400 text-white font-bold transition-all"><ClipboardList className="w-4 h-4 mr-2" /> Match with Contractors On Pro Network</Button>
                          </div>
                        )}
                        {/* Timeline */}
                        {ll97Result.compliance_timeline && (
                          <div className="p-4 bg-slate-950 border border-slate-700/50 rounded-xl flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-slate-300 text-sm leading-relaxed">{ll97Result.compliance_timeline}</p>
                          </div>
                        )}

                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACTORS */}
            {activeTab === 'contractors' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><HardHat className="w-6 h-6 text-sky-400" /> Pro Network Marketplace</h2>
                    <p className="text-muted-foreground mt-1">Find top-rated, verified NYC contractors for your compliance and repair needs.</p>
                  </div>
                  <Button className="bg-indigo-500 hover:bg-blue-700 text-white gap-2" onClick={() => alert("Post a job flow placeholder")}>
                    <ClipboardList className="w-4 h-4" /> Request Quotes
                  </Button>
                </div>

                {/* Verified Badge / Trust Banner */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-emerald-400">AssetGuard Verified Partners.</strong> Every contractor in the Pro Network holds active NYC Department of Buildings (DOB) licenses, verified insurance, and passes rigorous quality checks.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contractors.map(c => (
                    <Card key={c.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 overflow-hidden relative">
                      {c.status === 'Connected' && <div className="absolute top-0 right-0 w-12 h-12 bg-sky-500/20 rounded-bl-full flex items-start justify-end p-2"><CheckCircle className="w-4 h-4 text-sky-400" /></div>}
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 border-2 border-slate-700/50"><AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} /><AvatarFallback>PRO</AvatarFallback></Avatar>
                          <div>
                            <div className="font-bold text-lg text-white">{c.name}</div>
                            <div className="text-sm text-indigo-400 font-medium">{c.type}</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> 4.9 (120 reviews)</span>
                          <span>{Math.floor(Math.random() * 50) + 10} jobs completed</span>
                        </div>

                        {c.status === 'Connected' ? (
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-sky-500/20 text-sky-400 hover:bg-sky-500/30" onClick={() => alert(`Messaging ${c.name}...`)}><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
                            <Button className="flex-1 bg-slate-800/40 text-white hover:bg-slate-700/50 border border-slate-700/50" onClick={() => alert(`Requesting quote from ${c.name}...`)}>Get Quote</Button>
                          </div>
                        ) : (
                          <Button className="w-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/20" onClick={() => {
                            alert(`Connection request sent to ${c.name}. They will review your property portfolio and respond.`);
                            toggleContractor(c.id);
                          }}>
                            {c.status === 'Pending' ? 'Request Pending...' : 'Connect to Network'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div><h2 className="text-3xl font-bold tracking-tight text-white">Organization Profile</h2><p className="text-muted-foreground">Manage your company details and contact info.</p></div>

                <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                  <CardHeader><CardTitle className="text-white">Company Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Company Name</label><Input value={editProfile?.company_name || ""} onChange={e => setEditProfile({ ...editProfile, company_name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" placeholder="e.g. NYC Holdings LLC" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Primary Contact Person</label><Input value={editProfile?.full_name || ""} onChange={e => setEditProfile({ ...editProfile, full_name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" placeholder="e.g. John Doe" /></div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                  <CardHeader><CardTitle className="text-white">Public Contact Info</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Support Phone</label><Input value={editProfile?.phone || ""} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" placeholder="e.g. 212-555-0199" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-gray-300">Support Email</label><Input value={editProfile?.contact_email || ""} onChange={e => setEditProfile({ ...editProfile, contact_email: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" placeholder="e.g. support@nycholdings.com" /></div>
                  </CardContent>
                </Card>

                {/* B2B API ACCESS SETTINGS */}
                <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50 mt-6">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Lock className="w-5 h-5 text-indigo-400" /> B2B API Access</CardTitle>
                    <CardDescription>Generate API keys to integrate NYC compliance data directly into your own software.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(!userProfile?.membership_tier || userProfile.membership_tier !== 'Business') ? (
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-center">
                        <Lock className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                        <h4 className="text-white font-bold mb-1">API Access is a Business Tier Feature</h4>
                        <p className="text-sm text-slate-400 mb-4">Upgrade to the Business Tier ($99/mo) to unlock developer API access and programmatic compliance monitoring.</p>
                        <Button className="bg-indigo-500 hover:bg-sky-400 text-white" onClick={() => alert("Redirect to Stripe checkout for Business Tier...")}><Sparkles className="w-4 h-4 mr-2 text-amber-400" /> Upgrade to Business</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-950 border border-slate-800/50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold text-white">Production API Key</div>
                            <div className="text-xs text-slate-500 font-mono">sk_live_...</div>
                          </div>
                          <Button variant="outline" size="sm" className="border-slate-700/50 text-sky-400 hover:text-sky-300" onClick={() => alert("API Key generated.")}>Generate New Key</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                  <Button size="lg" className="bg-indigo-500 hover:bg-blue-700 text-white px-8" onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              </div>
            )}

            {/* MAP */}
            {activeTab === 'map' && <div className="h-full rounded-xl overflow-hidden border border-border"><MapViewer properties={properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || ''))} onSelectProperty={setManageProp} /></div>}
          </div>
        </ErrorBoundary>
      </main>

      {/* MANAGE PROPERTY MODAL */}
      <AnimatePresence>
        {manageProp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">

              {/* Header */}
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-900/40 backdrop-blur-md/50">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-sky-400" /> {manageProp.address}
                  </h2>
                  <div className="flex gap-4 mt-2 text-sm text-slate-400">
                    <span>{manageProp.units} Units</span>
                    {manageProp.bbl && <span>BBL: {manageProp.bbl}</span>}
                    {manageProp.bin && <span>BIN: {manageProp.bin}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700/50 text-gray-300 hover:text-white bg-slate-800/40/50"
                    onClick={() => generatePDF({ elementId: 'property-report-content', filename: `${manageProp.address.replace(/\s+/g, '_')}_Report.pdf` })}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {userProfile?.membership_tier === 'Free' ? 'Pro Feature' : 'Download Report'}
                  </Button>
                  <button onClick={() => setManageProp(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex px-6 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-md/30">
                <button onClick={() => setPropTab('details')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${propTab === 'details' ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-400 hover:text-gray-300'}`}>Overview</button>
                <button onClick={() => setPropTab('violations')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${propTab === 'violations' ? 'border-amber-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-gray-300'}`}>
                  HPD/DOB Activity {propCityData?.violations?.length > 0 && <span className="bg-amber-500/20 text-orange-400 py-0.5 px-2 rounded-full text-xs">{propCityData.violations.length}</span>}
                </button>
                <button onClick={() => setPropTab('oath')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${propTab === 'oath' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-gray-300'}`}>
                  OATH Hearings {oathHearings.length > 0 && <span className="bg-red-500/20 text-red-400 py-0.5 px-2 rounded-full text-xs">{oathHearings.length}</span>}
                </button>
              </div>

              <div id="property-report-content" className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                {propTab === 'details' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4">Building Image</h3>
                        <div className="h-64 flex-shrink-0 relative rounded-xl overflow-hidden border border-slate-700/50">
                          <img
                            src={manageProp.image || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300'}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover"
                            alt="Building exterior"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400&h=300'; e.currentTarget.onerror = null; }}
                          />
                        </div>
                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => { navigator.clipboard.writeText(manageProp.access_code || ''); showToast("Code Copied!") }}>
                          <div><div className="text-xs text-slate-400 mb-1">Tenant Access Code</div><div className="text-xl font-mono font-bold text-white tracking-widest">{manageProp.access_code || 'N/A'}</div></div>
                          <ClipboardList className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4">Live NYC Data Snapshot</h3>
                        {!propCityData ? (
                          <div className="flex items-center justify-center h-48 border border-slate-700/50 border-dashed rounded-xl bg-slate-900/40 backdrop-blur-md/50">
                            <span className="text-slate-500 flex items-center gap-2"><div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div> Fetching HPD/DOB DB...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl">
                              <div className="text-3xl font-bold text-amber-500 mb-1">{propCityData.violations.length}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Open Violations</div>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl">
                              <div className="text-3xl font-bold text-red-500 mb-1">{oathHearings.length}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">OATH Hearings</div>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl">
                              <div className="text-3xl font-bold text-amber-400 mb-1">{propCityData.complaints.length}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">311 Complaints</div>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl">
                              <div className="text-3xl font-bold text-sky-400 mb-1">{propCityData.litigations.length}</div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Litigations</div>
                            </div>
                          </div>
                        )}

                        {/* LL84 Benchmarking Data */}
                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl space-y-3">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> LL84 Energy Benchmarking ({ll84Data?.reporting_year || 'Latest'})</h4>
                          {ll84Loading ? (
                            <div className="text-sm text-slate-500 flex items-center gap-2"><div className="w-3 h-3 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div> Fetching Benchmarking...</div>
                          ) : ll84Data ? (
                            <div className="grid grid-cols-3 gap-4">
                              <div><div className="text-2xl font-bold text-white">{ll84Data.energy_star_score}</div><div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Energy Star Score</div></div>
                              <div><div className="text-2xl font-bold text-white">{ll84Data.site_eui}</div><div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">EUI (kBtu/ft²)</div></div>
                              <div><div className="text-2xl font-bold text-white">{ll84Data.ghg_emissions}</div><div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GHG Emissions</div></div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No recent benchmarking data found for this property's BBL.</div>
                          )}
                        </div>

                        <Button className="w-full bg-indigo-500 hover:bg-blue-700 text-white gap-2" onClick={() => { setActiveTab('ll97'); setManageProp(null); runLL97Simulation(manageProp); }} disabled={ll97Loading}>
                          <Flame className="w-4 h-4" /> Run LL97 Simulation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {propTab === 'violations' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Open Violations ({propCityData?.violations?.length || 0})</h3>
                    <div className="space-y-3">
                      {propCityData?.violations?.length > 0 ? propCityData.violations.map((v: any, i: number) => (
                        <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-700/50 hover:border-slate-700/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-500">#{v.violationid}</span>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${v.class === 'C' ? 'text-red-500 border-red-500/50' : 'text-amber-500 border-amber-500/50'}`}>Class {v.class}</Badge>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{v.novdescription}</p>
                        </div>
                      )) : <div className="text-center py-12 text-slate-500 border border-slate-700/50 border-dashed rounded-xl"><CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" /><p>No open violations found on HPD.</p></div>}
                    </div>
                  </div>
                )}

                {propTab === 'oath' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2"><Scale className="w-5 h-5 text-red-500" /> OATH Hearings & Penalties</h3>

                    {!manageProp.bbl ? (
                      <div className="text-center py-12 border border-slate-700/50 border-dashed rounded-xl bg-slate-900/40 backdrop-blur-md/50">
                        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white">BBL Required</h3>
                        <p className="text-slate-500">Borough, Block, and Lot number is required to look up OATH hearings.</p>
                      </div>
                    ) : oathLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <div className="w-8 h-8 border-4 border-slate-700/50 border-t-red-500 rounded-full animate-spin mb-4"></div>
                        <p>Searching ECB/OATH records...</p>
                      </div>
                    ) : oathHearings.length === 0 ? (
                      <div className="text-center py-12 border border-slate-700/50 border-dashed rounded-xl bg-slate-900/40 backdrop-blur-md/50">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white">No Open OATH Hearings</h3>
                        <p className="text-slate-500">This property is clear of ECB violations and OATH penalties.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {oathHearings.map((h, i) => (
                          <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 hover:border-slate-700/50 transition-colors flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <Scale className="w-8 h-8 p-1.5 rounded bg-red-500/10 text-red-500" />
                                <div>
                                  <h4 className="font-bold text-white text-md">Ticket #{h.id}</h4>
                                  <p className="text-xs text-slate-400">{h.violation_type} • Severity: {h.severity}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-red-400">${h.penalty_balance.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Balance Due</div>
                              </div>
                            </div>
                            <div className="bg-slate-950 rounded-lg p-3 text-sm text-gray-300 border border-slate-800/50 leading-relaxed">
                              {h.description}
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
                              <div className="flex gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <span className={!h.hearing_date ? "text-gray-600 italic" : "text-gray-300 font-medium"}>
                                    {h.hearing_date ? `Hearing: ${new Date(h.hearing_date).toLocaleDateString()}` : 'No Hearing Set'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-slate-500" />
                                  <span className="text-gray-300">{h.ticket_status || 'Status Unknown'}</span>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => alert("Connecting to Legal Partner integration...")}>
                                Appeal via Attorney
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD PROPERTY MODAL */}
      <AnimatePresence>
        {showAddProperty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl w-full max-w-md space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><MapIcon className="text-emerald-400" /> Register Building</h2>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => { setShowAddProperty(false); setSearchResults([]); setNewPropAddr(""); setProofDocument(null) }}><X className="w-5 h-5" /></Button>
              </div>

              {userRole === 'manager' && (
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Plan: <span className="text-emerald-400 font-bold">{userProfile?.membership_tier || 'Free'}</span></div>
                    <div className="text-sm font-medium text-white">
                      {properties.filter(p => p.manager_id === userProfile?.id).length} / {getMaxPropertiesByTier(userProfile?.membership_tier) === Infinity ? 'Unlimited' : getMaxPropertiesByTier(userProfile?.membership_tier)} Properties Used
                    </div>
                  </div>
                  {properties.filter(p => p.manager_id === userProfile?.id).length >= getMaxPropertiesByTier(userProfile?.membership_tier) && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Limit Reached</Badge>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Property Address</label>
                  <Input placeholder="Enter NYC Address..." value={newPropAddr} onChange={(e) => handleSearchAddress(e.target.value)} className="bg-slate-800/40 border-slate-600/50 text-white" />
                  {isSearching && <p className="text-xs text-sky-300 mt-1">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-slate-800/40 border border-slate-700/50 rounded-md overflow-hidden text-sm max-h-48 overflow-y-auto">
                      {searchResults.slice(0, 5).map((res, i) => (
                        <div key={i} className="p-2 hover:bg-slate-700/60 cursor-pointer text-gray-300 transition-colors" onClick={() => selectAddress(res)}>
                          {res.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {newPropAddr && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Borough</label>
                      <select
                        className="w-full bg-slate-800/40 border-slate-600/50 text-white rounded-md p-2 text-sm border focus:outline-none focus:border-indigo-500"
                        value={newPropBorough}
                        onChange={(e) => setNewPropBorough(e.target.value)}
                      >
                        <option value="Manhattan">Manhattan</option>
                        <option value="Brooklyn">Brooklyn</option>
                        <option value="Queens">Queens</option>
                        <option value="Bronx">Bronx</option>
                        <option value="Staten Island">Staten Island</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Total Units</label>
                      <Input
                        type="number"
                        min="1"
                        value={newPropUnits}
                        onChange={(e) => setNewPropUnits(parseInt(e.target.value) || 1)}
                        className="bg-slate-800/40 border-slate-600/50 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* PROOF OF OWNERSHIP UI */}
                {newPropAddr && (
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-fade-in">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">Ownership Verification Required</h4>
                        <p className="text-xs text-slate-400 mb-3 leading-relaxed">To ensure data integrity and prevent unauthorized access, newly added properties require ownership verification (Deed or Management Agreement).</p>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                            <span>Upload Proof Document</span>
                            <span className="text-slate-500 font-normal">.pdf, .jpg, .png</span>
                          </label>
                          <label className="flex flex-col items-center justify-center gap-2 border border-slate-700/50 border-dashed rounded-md p-4 bg-slate-950/50 hover:bg-slate-950 transition-colors cursor-pointer group text-center">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setProofDocument(e.target.files[0])
                                }
                              }}
                            />
                            {proofDocument ? (
                              <>
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <span className="text-sm text-emerald-400 font-medium truncate max-w-[200px]">{proofDocument.name}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors"><Plus className="w-4 h-4" /></div>
                                <span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Select file...</span>
                              </>
                            )}
                          </label>
                          <div className="text-slate-500 text-sm mt-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Document will be securely stored and reviewed by admins.</div>
                        </div>

                        <div className="flex justify-end pt-4 space-x-3 border-t border-slate-700/50 mt-6">
                          <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300" onClick={() => { setShowAddProperty(false); setSearchResults([]); setNewPropAddr(""); setProofDocument(null) }}>Cancel</Button>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 px-6"
                            onClick={handleAddProperty}
                            disabled={!proofDocument || (userRole === 'manager' && properties.filter(p => p.manager_id === userProfile?.id).length >= getMaxPropertiesByTier(userProfile?.membership_tier))}
                          >
                            Submit for Verification <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANAGE REQUEST MODAL */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl w-full max-w-lg space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">{selectedRequest.issue}</h3>
                  <p className="text-sm text-slate-400">Requested by {selectedRequest.tenantName || 'Tenant'} • Unit {selectedRequest.unit}</p>
                </div>
                <Badge className={`${selectedRequest.status === 'Pending' ? 'bg-amber-500' : selectedRequest.status === 'Resolved' ? 'bg-emerald-500' : 'bg-sky-400'} ml-2`}>{selectedRequest.status}</Badge>
              </div>

              <div className="bg-slate-950 p-4 rounded-md border border-slate-700/50 text-sm text-gray-300">
                <strong>Description:</strong><br />
                {selectedRequest.desc || selectedRequest.description || 'No description provided.'}
              </div>

              <div className="space-y-4 border-t border-slate-700/50 pt-4">
                <h4 className="text-sm font-bold text-white">Action</h4>
                {selectedRequest.status === 'Pending' && (
                  <Button className="w-full bg-sky-600 hover:bg-sky-500 text-white mb-2" onClick={async () => {
                    setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: 'In Progress' } : r));
                    const reqId = selectedRequest.id;
                    setSelectedRequest(null);
                    showToast("Request marked as In Progress.");

                    const { error } = await supabase
                      .from('requests')
                      .update({ status: 'In Progress' })
                      .eq('id', reqId);

                    if (error) {
                      showToast("Failed to sync status to database", "error");
                    }
                  }}>
                    <Wrench className="w-4 h-4 mr-2" /> Mark as In Progress
                  </Button>
                )}
                {selectedRequest.status === 'In Progress' && (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mb-2" onClick={async () => {
                    setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: 'Resolved' } : r));
                    const reqId = selectedRequest.id;
                    setSelectedRequest(null);
                    showToast("Request marked as resolved.");

                    const { error } = await supabase
                      .from('requests')
                      .update({ status: 'Resolved' })
                      .eq('id', reqId);

                    if (error) {
                      console.error("Failed to update request status in DB:", error);
                      showToast("Failed to sync status to database", "error");
                    }
                  }}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Resolved
                  </Button>
                )}
                {(selectedRequest.status === 'Pending' || selectedRequest.status === 'In Progress') && (
                  <Button variant="outline" className="w-full border-sky-400/50 text-sky-300 hover:bg-sky-400/10" onClick={() => {
                    setActiveTab('contractors');
                    setSelectedRequest(null);
                  }}>
                    <HardHat className="w-4 h-4 mr-2" /> Find Contractor
                  </Button>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setSelectedRequest(null)}>Close</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPGRADE / PLAN DETAILS MODAL */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/50">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" /> Plan Details & Upgrade
                  </h3>
                  <p className="text-sm text-slate-400">Manage your AssetGuard subscription and limits.</p>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div className="space-y-4">
                  <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">Current Plan</div>
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-white font-bold text-lg">{userProfile?.membership_tier || "Free Tier"}</span>
                    </div>
                    {userProfile?.membership_tier === "Starter" ? (
                      <p className="text-xs text-slate-400 leading-relaxed">You are currently on the Starter Plan. Upgrade to Growth to unlock instant AI Affidavits and Priority Pro Dispatch.</p>
                    ) : userProfile?.membership_tier === "Growth" ? (
                      <p className="text-xs text-slate-400 leading-relaxed">You are on the Growth Plan. You have access to our most popular automation tools.</p>
                    ) : (
                      <p className="text-xs text-slate-400 leading-relaxed">You are on the Free Tier. You can track up to 1 property. Upgrade for premium features.</p>
                    )}

                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="flex justify-between text-xs mb-1 text-slate-400">
                        <span>Properties Monitored</span>
                        <span className="text-white">1 / {userProfile?.membership_tier === "Growth" ? "20" : userProfile?.membership_tier === "Starter" ? "3" : "1"}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: '33%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade Options */}
                <div className="space-y-4">
                  <div className="text-xs font-bold tracking-widest text-sky-400 uppercase">Available Upgrades</div>

                  {userProfile?.membership_tier !== "Growth" && (
                    <div className="p-4 rounded-xl bg-sky-900/10 border border-sky-500/30 hover:bg-sky-900/20 transition-colors cursor-pointer group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                      <h4 className="text-white font-bold text-md mb-1 group-hover:text-sky-300 transition-colors">Growth Plan</h4>
                      <div className="text-2xl font-bold text-white mb-2">$99<span className="text-sm font-normal text-slate-400">/mo</span></div>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Up to 20 Units</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Instant AI Affidavits</li>
                        <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Financial Forecasting</li>
                      </ul>
                      <Button className="w-full mt-3 bg-sky-500 hover:bg-sky-400 text-white h-8 text-xs font-bold" onClick={() => alert("Stripe payment gateway placeholder")}>Upgrade to Growth</Button>
                    </div>
                  )}

                  {userProfile?.membership_tier === "Growth" && (
                    <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/30 hover:bg-purple-900/20 transition-colors cursor-pointer group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">PREMIUM</div>
                      <h4 className="text-white font-bold text-md mb-1 group-hover:text-purple-300 transition-colors">Premium Enterprise</h4>
                      <p className="text-xs text-slate-400 mb-2">Need more than 20 units? Get custom pricing and white-glove onboarding for large portfolios.</p>
                      <Button variant="outline" className="w-full mt-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 h-8 text-xs font-bold" onClick={() => alert("Contact sales placeholder")}>Contact Sales</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

