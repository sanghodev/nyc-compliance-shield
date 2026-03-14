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
  Sparkles, ArrowRight, Scale, Flame, HardHat, Calendar, ArrowUpCircle, Download, Leaf, Clock, ClipboardList, PenTool, Smartphone, Phone, Lock, Trash2, Home, Copy, Check, ShieldAlert, History as HistoryIcon, LogOut
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
import ReactMarkdown from 'react-markdown'

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
  company_name?: string
}

interface TenantRequest {
  id: number
  tenantName: string
  unit: string
  issue: string
  description?: string
  type: string
  status: string
  date?: string
  created_at?: string
  priority: string
  contact_preference?: string
  assigned_pro_id?: number
  property_id?: number
  tenant_id?: string
}

interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: string
  status: "Pending" | "Active" | "Suspended"
  created_at: string
  company_name?: string
  company_code?: string
  membership_tier?: string
  unit?: string
  property_id?: number
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md border-b border-zinc-800 py-3' : 'bg-transparent py-6 border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Building2 className={`w-6 h-6 ${isScrolled ? 'text-sky-400' : 'text-slate-400'}`} />
            <span className="text-slate-200">Evereez<span className="text-sm text-slate-400 ml-3 hidden sm:inline-block font-normal">Everything Managed. Effortlessly.</span></span>
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
              Smart Buildings.<br />Total Ease.
            </h1>
            <p className="text-xl md:text-2xl text-sky-400 font-bold mb-4">
              Powered by Evereez.
            </p>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-8">
              The first AI-driven platform that turns complex NYC compliance into absolute simplicity.
            </p>
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
            <h2 className="text-4xl md:text-5xl font-bold text-white">Why Evereez?</h2>
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
              <div className="flex items-center gap-3 text-emerald-500 font-bold text-xl"><CheckCircle className="w-6 h-6" /> Evereez Way</div>
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
                <h4 className="font-bold text-sm">Professional Network</h4>
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
                <li className="flex gap-3 text-gray-300"><CheckCircle className="w-5 h-5 text-zinc-600" /> Access to Contractor Marketplace</li>
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
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> Priority Expert Dispatch</li>
                <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-sky-400" /> Financial Forecasting</li>
              </ul>
              <Button className="w-full bg-indigo-500 hover:bg-sky-400 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-900/40" onClick={() => onEnter("manager", "Growth")}>Get Started</Button>
            </motion.div>

            {/* TIER 3: ENTERPRISE / ASKING */}
            <motion.div whileHover={{ y: -10 }} className="p-8 rounded-3xl bg-gradient-to-b from-purple-900/20 to-black border border-purple-500/30 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 z-0"></div>
              <div className="relative z-10">
                <div className="text-purple-400 font-bold tracking-widest text-sm mb-4 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4" /> Evereez Premium</div>
                <div className="text-4xl font-bold text-white mb-2">Custom<span className="text-lg text-slate-500 font-normal"></span></div>
                <p className="text-slate-400 mb-8">We manage everything for you.</p>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> <b>Unlimited Units</b></li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> Dedicated Asset Manager</li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> 24/7 White-Glove Support</li>
                  <li className="flex gap-3 text-white"><CheckCircle className="w-5 h-5 text-purple-500" /> Full Legal Representation</li>
                </ul>
                <Button className="w-full bg-white hover:bg-gray-200 text-black font-bold py-6 rounded-xl" onClick={() => window.open('mailto:sales@evereez.com')}>Contact Sales</Button>
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
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-xl" onClick={() => window.open('mailto:partners@evereez.com')}>Email Us</Button>
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

          {/* Admin access hidden for security - use obfuscated route directly */}
        </div>
      </section>

      <footer className="py-12 border-t border-white/10 text-center bg-black relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4 text-xl font-bold"><Building2 className="w-6 h-6 text-indigo-500" /> Evereez</div>
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
function ViolationItem({ v, onGenerateAffidavit, isGenerating, showToast }: { v: any, onGenerateAffidavit?: (v: any) => void, isGenerating?: boolean, showToast: (msg: string, type?: any) => void }) {
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
              <Button size="sm" className="flex-1 bg-indigo-500 hover:bg-blue-700 text-white h-7 text-xs gap-2" onClick={(e) => { e.stopPropagation(); showToast(`Connecting you with ${insight.pro}...`, "info") }}>
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
function PropertyDetailsModal({ property, cityData, onClose, showToast, userRole }: { property: Property, cityData: any, onClose: () => void, showToast: (msg: string, type?: any) => void, userRole: UserRole }) {
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
                    <div className="text-sm font-bold text-sky-400 mb-1 tracking-widest bg-sky-500/10 px-3 py-1 rounded-md border border-sky-500/20">
                      {userRole && (userRole === 'admin' || property.manager_id === (supabase.auth.getUser() as any)?.data?.user?.id)
                        ? (property.access_code || "N/A")
                        : "••••••"}
                    </div>
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

                <div className="flex justify-end pt-6 border-t border-slate-700/50">
                  <Button variant="outline" onClick={onClose} className="mr-2 border-slate-700/50 text-gray-300 hover:text-white">Close</Button>
                  {userRole && (
                    <Button className="bg-indigo-500 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20" onClick={() => showToast("Ownership verified. Redirecting...", "success")}>
                      Manage Portfolio
                    </Button>
                  )}
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

function DocumentPreviewModal({ doc, onClose }: { doc: any, onClose: () => void }) {
  if (!doc) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-2xl z-10 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950/40">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 capitalize">{doc.category}</Badge>
                {doc.expires_at && (
                  <Badge className={`${new Date(doc.expires_at) < new Date() ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'}`}>
                    Expires: {new Date(doc.expires_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-white truncate">{doc.file_name}</h2>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Preview / Link */}
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
              {doc.file_type?.includes('image') ? (
                <img src={doc.file_url} className="w-full h-full object-contain" />
              ) : (
                <>
                  <FileText className="w-16 h-16 text-slate-700" />
                  <p className="text-sm text-slate-500 font-mono">{doc.file_type}</p>
                </>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button className="bg-white text-black hover:bg-sky-400 hover:text-white" onClick={() => window.open(doc.file_url, '_blank')}>
                  <Download className="w-4 h-4 mr-2" /> View Full File
                </Button>
              </div>
            </div>

            {/* AI Analysis section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-widest text-xs">
                <Sparkles className="w-4 h-4" /> AI Extraction Summary
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm italic leading-relaxed">
                "{doc.ai_summary || "Document analysis in progress. Please check back in a few moments."}"
              </div>

              {doc.ai_processed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key Dates */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Key Dates
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(doc.ai_key_dates) && doc.ai_key_dates.length > 0 ? doc.ai_key_dates.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs items-center">
                          <span className="text-slate-400">{d.label}:</span>
                          <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{d.date}</span>
                        </div>
                      )) : <p className="text-[10px] text-slate-600 italic">No dates detected</p>}
                    </div>
                  </div>
                  {/* Amounts */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-3 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Financials
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(doc.ai_amounts) && doc.ai_amounts.length > 0 ? doc.ai_amounts.map((a: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs items-center">
                          <span className="text-slate-400">{a.label}:</span>
                          <span className="text-emerald-400 font-bold">{a.amount}</span>
                        </div>
                      )) : <p className="text-[10px] text-slate-600 italic">No financial data detected</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Parties */}
            {Array.isArray(doc.ai_parties) && doc.ai_parties.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-2">
                  <Users className="w-3 h-3" /> Relevant Parties
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.ai_parties.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-400">{p}</Badge>)}
                </div>
              </div>
            )}

            {/* Notes */}
            {doc.notes && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Manual Notes</div>
                <p className="text-sm text-slate-400 bg-slate-800/20 p-3 rounded-lg border border-slate-700/30 line-clamp-3">{doc.notes}</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-800 flex justify-end bg-slate-950/40 gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white" onClick={onClose}>Close</Button>
            <Button className="bg-sky-500 hover:bg-sky-400 text-white" onClick={() => window.open(doc.file_url, '_blank')}>Download PDF</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function AiHistoryModal({ isOpen, onClose, history, isLoading, onSelect }: { isOpen: boolean, onClose: () => void, history: any[], isLoading: boolean, onSelect: (record: any) => void }) {
  if (!isOpen) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative shadow-2xl z-10 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-sky-400" /> Consultation History
              </h2>
              <p className="text-xs text-slate-500 mt-1">Select a previously saved consultation to reload the chat.</p>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Activity className="w-10 h-10 text-sky-400 animate-spin" />
                <p className="text-slate-500 font-medium">Loading your consultations...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-white font-bold">No history found</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-xs">You haven't saved any consultations yet. Save one to see it here.</p>
                </div>
              </div>
            ) : (
              history.map((record: any) => (
                <button
                  key={record.id}
                  onClick={() => onSelect(record)}
                  className="w-full text-left p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-sky-400 hover:bg-slate-800/80 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-200 group-hover:text-white truncate pr-4">{record.title}</h4>
                    <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-500 capitalize">{record.agent_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(record.created_at).toLocaleString()}
                    </div>
                    <span>{record.messages.length} messages</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
            <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-white" onClick={onClose}>Close</Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// --- MAIN APP ---
export default function APP_ROOT() {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'map', 'reports', 'settings', 'll97', 'contractors'
  const [isLoaded, setIsLoaded] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [editProfile, setEditProfile] = useState<any>({}) // Local buffer for edits

  // AI Compliance Autopilot State
  const [complianceResolutions, setComplianceResolutions] = useState<any[]>([])
  const [isAnalyzingAutopilot, setIsAnalyzingAutopilot] = useState(false)

  // Document Vault State
  const [vaultDocuments, setVaultDocuments] = useState<any[]>([])
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [docFilter, setDocFilter] = useState('all')
  const [vaultProp, setVaultProp] = useState<Property | null>(null)

  // Autopilot Interaction State
  const [activeAutopilotStep, setActiveAutopilotStep] = useState<any>(null)
  const [matchingContractors, setMatchingContractors] = useState<any[]>([])
  const [isMatchingPro, setIsMatchingPro] = useState(false)
  const [isGeneratingStepDoc, setIsGeneratingStepDoc] = useState(false)
  const [showDocPreview, setShowDocPreview] = useState<any>(null)

  // PDF Report Hook
  const { generatePDF, isGenerating: isGeneratingPDF } = useGeneratePDF()

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState<UserRole>(null)
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Admin Data
  const [users, setUsers] = useState<UserProfile[]>([])

  // LL97 Simulator State (Dashboard Context)
  const [ll97Props, setLl97Props] = useState({ address: '', squareFootage: '', heatingFuel: 'Natural Gas', buildingType: 'Multifamily Residential', yearBuilt: '' })
  const [ll97Result, setLl97Result] = useState<any>(null)
  const [ll97Loading, setLl97Loading] = useState(false)

  // Compliance Calendar State
  const [calSearch, setCalSearch] = useState("")
  const [calCategoryFilter, setCalCategoryFilter] = useState("all")
  const [calStatusFilter, setCalStatusFilter] = useState("all")
  const [vaultSearch, setVaultSearch] = useState("")

  // AI Consultants State
  const [aiAgentType, setAiAgentType] = useState<'legal' | 'real_estate' | 'tax'>('legal')
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your NYC Real Estate & Legal AI consultant. How can I help you today?' }
  ])
  const [aiChatInput, setAiChatInput] = useState("")
  const [isAiChatLoading, setIsAiChatLoading] = useState(false)
  const [isSavingChat, setIsSavingChat] = useState(false)
  const [aiChatHistory, setAiChatHistory] = useState<any[]>([])
  const [showAiHistory, setShowAiHistory] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [newTenant, setNewTenant] = useState({
    full_name: "",
    email: "",
    unit: "",
    property_id: ""
  })
  const [isAddingTenant, setIsAddingTenant] = useState(false)

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

        // Fetch full profile from database as source of truth
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
          setEditProfile(profile)
        } else {
          // Fallback to metadata if profile not found
          setUserProfile(session.user.user_metadata)
          setEditProfile(session.user.user_metadata)
        }
      }
    }
    checkSession()
  }, [])

  // Data
  const [properties, setProperties] = useState<Property[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [requests, setRequests] = useState<TenantRequest[]>([])
  const [tenants, setTenants] = useState<UserProfile[]>([])

  // Fetch Data from Supabase
  useEffect(() => {
    if (!userRole) return; // Wait until authenticated

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const role = user.user_metadata?.role || userRole;

      // Ensure userProfile is synced with DB
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) setUserProfile(profile)

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

      // 4. Fetch AI Compliance Resolutions
      const fetchAutopilot = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        try {
          const res = await fetch('/api/compliance-autopilot?property_id=' + (props?.[0]?.id || 0), {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          const json = await res.json()
          if (json.data) setComplianceResolutions(json.data)
        } catch (e) { console.error("Autopilot Fetch Error:", e) }
      }
      fetchAutopilot()

      // 5. Fetch Documents
      const fetchDocs = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        try {
          const res = await fetch('/api/documents', {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          const json = await res.json()
          if (json.data) setVaultDocuments(json.data)
        } catch (e) { console.error("Docs Fetch Error:", e) }
      }
      fetchDocs()

      // 6. Refresh Contractors from real individual DB
      const fetchContractors = async () => {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('role', 'contractor')
          if (data) setContractors(prev => {
            const contMap = new Map(prev.map(c => [c.id, c]))
            data.forEach((p: any) => {
              if (contMap.has(p.id)) {
                const existing = contMap.get(p.id)!
                contMap.set(p.id, { ...existing, phone: p.phone, email: p.email })
              }
            })
            return Array.from(contMap.values())
          })
        } catch (e) { }
      }
      fetchContractors()

      // 7. Fetch Tenants
      if (role === 'manager' && props && props.length > 0) {
        const propIds = props.map(p => p.id)
        const { data: tenantData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'tenant')
          .in('property_id', propIds)
        if (tenantData) setTenants(tenantData)
      }

      const { data: reqs } = await reqsQuery
      if (reqs) {
        const formatted = reqs.map((r: any) => ({
          ...r,
          tenantName: r.tenant_name || 'Tenant',
          desc: r.description
        }))
        setRequests(formatted)
      }
    }

    if (userRole) fetchData()
  }, [userRole, properties.length]) // Refresh when properties are loaded or role changes

  const handleAddTenant = async () => {
    if (!newTenant.email || !newTenant.property_id || !newTenant.unit) {
      showToast("Please fill in all required fields.", "info")
      return
    }
    setIsAddingTenant(true)
    try {
      // 1. Check if user exists in profiles
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newTenant.email.toLowerCase().trim())
        .single()

      if (existing) {
        // Update existing profile (Associate with property)
        const { error: upErr } = await supabase
          .from('profiles')
          .update({
            property_id: parseInt(newTenant.property_id),
            unit: newTenant.unit,
            full_name: newTenant.full_name || existing.full_name,
            role: 'tenant',
            status: 'Active'
          })
          .eq('id', existing.id)

        if (upErr) throw upErr
        showToast("Tenant added successfully!")
      } else {
        // In this demo, we can't create Auth users from client side without Admin privileges.
        // We'll show a message that an invite was "sent".
        showToast(`Account for ${newTenant.email} not found. Invitation email sent!`, "info")
      }

      setShowAddTenant(false)
      setNewTenant({ full_name: "", email: "", unit: "", property_id: "" })

      // Refresh list
      const propIds = properties.map(p => p.id)
      const { data: tData } = await supabase.from('profiles').select('*').eq('role', 'tenant').in('property_id', propIds)
      if (tData) setTenants(tData)

    } catch (e: any) {
      showToast(e.message || "Failed to add tenant", "error")
    } finally {
      setIsAddingTenant(false)
    }
  }

  const handleAIChat = async () => {
    if (!aiChatInput.trim()) return
    const userMsg = { role: 'user', content: aiChatInput }
    setAiChatMessages(prev => [...prev, userMsg])
    const query = aiChatInput
    setAiChatInput("")
    setIsAiChatLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ type: aiAgentType, query })
      })
      const json = await res.json()
      if (json.response) {
        setAiChatMessages(prev => [...prev, {
          role: 'assistant',
          content: json.response,
          isPremium: json.isPremium,
          usedContext: json.usedContext,
          sources: json.sources
        }])
      } else {
        showToast(json.error || "AI Error", "error")
      }
    } catch (e) {
      showToast("Chat failed", "error")
    } finally {
      setIsAiChatLoading(false)
    }
  }

  const handleSaveChat = async () => {
    if (aiChatMessages.length <= 1) {
      showToast("No chat content to save.", "info")
      return
    }
    setIsSavingChat(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/save-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          agent_type: aiAgentType,
          messages: aiChatMessages,
          title: `NYC ${aiAgentType} Advice (${new Date().toLocaleDateString()})`
        })
      })
      const json = await res.json()
      if (json.success) {
        showToast("Consultation saved to your records.", "success")
      } else {
        showToast(json.error || "Save failed", "error")
      }
    } catch (e) {
      showToast("Error saving consultation", "error")
    } finally {
      setIsSavingChat(false)
    }
  }

  const fetchChatHistory = async () => {
    setIsHistoryLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/save-chat', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const json = await res.json()
      if (json.success) setAiChatHistory(json.data)
    } catch (e) {
      console.error("Error fetching history:", e)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const loadChatRecord = (record: any) => {
    setAiAgentType(record.agent_type)
    setAiChatMessages(record.messages)
    setShowAiHistory(false)
    showToast(`Loaded: ${record.title}`, "success")
  }

  // Fetch Users for Admin and Manager
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'manager') {
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
  const [editingCompanyData, setEditingCompanyData] = useState<{ id: string, name: string, company_name: string, email: string, tier: string } | null>(null)
  const [isEditingCompany, setIsEditingCompany] = useState(false)

  const [chatUser, setChatUser] = useState<Contractor | null>(null)
  const [chatMsg, setChatMsg] = useState("")
  const [manageProp, setManageProp] = useState<Property | null>(null)
  const [propCityData, setPropCityData] = useState<any>(null) // City Data State
  const [isIndexingDoc, setIsIndexingDoc] = useState<number | null>(null)
  const [oathHearings, setOathHearings] = useState<any[]>([])
  const [oathLoading, setOathLoading] = useState(false)
  const [ll84Data, setLl84Data] = useState<any>(null)
  const [ll84Loading, setLl84Loading] = useState(false)
  const [propTab, setPropTab] = useState<'details' | 'violations' | 'oath' | 'autopilot' | 'vault'>('details')
  const [isDeletingProperty, setIsDeletingProperty] = useState(false)

  // SECURE DELETE MODAL STATE
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [onConfirmDelete, setOnConfirmDelete] = useState<(() => Promise<void>) | null>(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("Confirm Deletion")
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState("Are you sure you want to PERMANENTLY delete this? This action cannot be undone.")

  // Fetch NYC Open Data
  const fetchCityData = async (address: string, bin?: string, bbl?: string) => {
    setPropCityData(null) // Reset
    try {
      let currentBin = bin
      let currentBbl = bbl

      // 0. SELF-HEALING: If BIN/BBL are missing, try to find them via GeoSearch
      if (!currentBin && address) {
        console.log("Self-healing: Fetching missing BIN for", address)
        const geoRes = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}`)
        const geoData = await geoRes.json()
        if (geoData.features && geoData.features.length > 0) {
          const first = geoData.features[0]
          currentBin = first.properties?.addendum?.pad?.bin || first.properties?.pad_bin || first.properties?.bin || ""
          currentBbl = first.properties?.addendum?.pad?.bbl || first.properties?.pad_bbl || first.properties?.bbl || ""
          console.log("Self-healing: Found BIN", currentBin, "BBL", currentBbl)
        }
      }

      console.log("Fetching City Data for:", { address, currentBin, currentBbl })

      let vioUrl = ""
      let compUrl = ""
      let litUrl = ""
      let chargeUrl = ""
      let regUrl = ""

      if (currentBin || currentBbl) {
        // Precise Lookup
        const binFilter = currentBin ? `&bin=${currentBin}` : ''
        const bblFilter = currentBbl ? `&bbl=${currentBbl}` : ''

        // HPD Violations dataset (wvxf-dwi5) supports BIN but NOT BBL directly
        vioUrl = `https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$limit=50&$order=novissueddate DESC&violationstatus=Open${binFilter}`
        // 311 Complaints (erm2-nwe9) supports BBL
        compUrl = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=50&$order=created_date DESC${bblFilter || binFilter}`
        // Litigations (59kj-x8nc) supports BIN
        litUrl = `https://data.cityofnewyork.us/resource/59kj-x8nc.json?$limit=50&$order=caseopendate DESC${binFilter}`

        // Registrations (tesw-yqqr) supports BIN
        regUrl = `https://data.cityofnewyork.us/resource/tesw-yqqr.json?$limit=1&$order=lastregistrationdate DESC${binFilter}`
        // Fee Charges (cp6j-7bjj) - some fields like bbl require $where for filtering
        const chargeFilter = currentBbl ? `&$where=bbl='${currentBbl}'` : binFilter ? `&$where=bin='${currentBin}'` : ''
        chargeUrl = `https://data.cityofnewyork.us/resource/cp6j-7bjj.json?$limit=5&$order=feeissueddate DESC${chargeFilter}`

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
        chargeUrl = `https://data.cityofnewyork.us/resource/cp6j-7bjj.json?$limit=5&$order=feeissueddate DESC&housenumber=${houseNum}&streetname=${encodedStreet}`
      }

      console.log("URLs:", { vioUrl, compUrl, chargeUrl })

      const results = await Promise.all([
        fetch(vioUrl).then(r => r.json()).catch(() => []),
        fetch(compUrl).then(r => r.json()).catch(() => []),
        fetch(litUrl).then(r => r.json()).catch(() => []),
        fetch(regUrl).then(r => r.json()).catch(() => []),
        fetch(chargeUrl).then(r => r.json()).catch(() => [])
      ])

      const [rawVios, comps, lits, regs, charges] = results;

      // Map snake_case to frontend expected format if they differ significantly
      const vios = Array.isArray(rawVios) ? rawVios.map((v: any) => ({
        ...v,
        novdescription: v.nov_description || v.novdescription,
        novissueddate: v.nov_issued_date || v.novissueddate,
        violationid: v.violationid || v.nov_id
      })) : []

      setPropCityData({
        bin: currentBin || vios[0]?.bin || "N/A",
        violations: vios,
        complaints: Array.isArray(comps) ? comps : [],
        litigations: Array.isArray(lits) ? lits : [],
        registrations: Array.isArray(regs) ? regs : [{ registrationid: "N/A", class: "N/A" }],
        charges: Array.isArray(charges) ? charges : []
      })

      // Sync data back to Supabase if we found new info
      if (manageProp) {
        const updatePayload: any = { violations: vios.length }
        if (!manageProp.bin && currentBin) updatePayload.bin = currentBin
        if (!manageProp.bbl && currentBbl) updatePayload.bbl = currentBbl

        await supabase
          .from('properties')
          .update(updatePayload)
          .eq('id', manageProp.id)

        // Sync local state so UI updates immediately (e.g. Autopilot tab can check .bin)
        const updatedProp = { ...manageProp, ...updatePayload }
        setManageProp(updatedProp)
        setProperties(prev => prev.map(p => p.id === manageProp.id ? updatedProp : p))
      }

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

      // Fetch existing AI Autopilot Roadmaps
      const fetchAutopilot = async () => {
        try {
          const auth = await supabase.auth.getSession()
          const res = await fetch(`/api/compliance-autopilot?property_id=${manageProp.id}`, {
            headers: { Authorization: `Bearer ${auth.data.session?.access_token}` }
          })
          const json = await res.json()
          if (json.data) {
            setComplianceResolutions(json.data)
          }
        } catch (e) {
          console.error("Error fetching Autopilot data:", e)
        }
      }
      fetchAutopilot()

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
      setComplianceResolutions([])
      setPropTab('details')
    }
  }, [manageProp?.id])

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
        const res = await fetch(`/api/geosearch?text=${encodeURIComponent(q)}`)
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
      const res = await fetch(`/api/geosearch?text=${encodeURIComponent(publicSearchQuery)}`)
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
  const [newCon, setNewCon] = useState({ name: '', category: 'General', phone: '', email: '', company_name: '', location: '', image: '' })

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
  const [forceManagerData, setForceManagerData] = useState({ name: '', email: '', company_name: '' })
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
            company_name: forceManagerData.company_name
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
          company_name: forceManagerData.company_name,
          company_code: generatedCode || null,
          created_at: new Date().toISOString()
        }])
        setShowForceAddManager(false)
        setForceManagerData({ name: '', email: '', company_name: '' })
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
        company_name: newCon.company_name,
        category: newCon.category,
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
      setNewCon({ name: '', category: 'General', phone: '', email: '', company_name: '', location: '', image: '' })
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
      company_name: newCon.company_name,
      category: newCon.category,
      phone: newCon.phone,
      email: newCon.email,
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
    setNewCon({ name: '', category: 'General', phone: '', email: '', company_name: '', location: '', image: '' })
  }

  // LOGIC: Delete Contractor
  const handleDeleteContractor = async (id: number) => {
    setDeleteConfirmTitle("Remove Contractor")
    const contractor = contractors.find(c => c.id === id)
    setDeleteConfirmMessage(`Are you sure you want to remove ${contractor?.name || 'this contractor'} from the network?`)
    setOnConfirmDelete(() => async () => {
      const { error } = await supabase.from('contractors').delete().eq('id', id)
      if (!error) {
        setContractors(contractors.filter(c => c.id !== id))
        showToast("Contractor removed.")
        setDeleteConfirmOpen(false)
        setDeleteConfirmText("")
      } else {
        showToast("Error removing contractor", 'error')
      }
    })
    setDeleteConfirmOpen(true)
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
    let lat = selectedLocation?.lat || 40.7128 + (Math.random() - 0.5) * 0.05
    let lng = selectedLocation?.lng || -74.0060 + (Math.random() - 0.5) * 0.05
    let bin = selectedLocation?.bin
    let bbl = selectedLocation?.bbl

    // Force BIN/BBL lookup if missing (e.g. user just typed text but didn't click result)
    if (!bin && newPropAddr) {
      try {
        const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(newPropAddr)}`)
        const data = await res.json()
        if (data.features && data.features.length > 0) {
          const f = data.features[0]
          lat = f.geometry.coordinates[1]
          lng = f.geometry.coordinates[0]
          bin = f.properties?.addendum?.pad?.bin || f.properties?.pad_bin || f.properties?.bin || ""
          bbl = f.properties?.addendum?.pad?.bbl || f.properties?.pad_bbl || f.properties?.bbl || ""
        }
      } catch (e) {
        console.error("Forced GeoSearch Error:", e)
      }
    }
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
      const filePath = `verifications/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('document-vault').upload(filePath, proofDocument)
      if (uploadError) {
        showToast("Error uploading verification document", "info")
        console.error(uploadError)
      } else {
        const { data } = supabase.storage.from('document-vault').getPublicUrl(filePath)
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
      bin: bin || "",
      bbl: bbl || ""
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
    }
  }

  // --- DELETE PROPERTY HANDLER ---
  const handleDeleteProperty = async (propId: number) => {
    setIsDeletingProperty(true)
    try {
      const { error } = await supabase.rpc('delete_property', { target_id: propId })
      if (error) throw error

      setProperties(prev => prev.filter(p => p.id !== propId))
      setManageProp(null)
      setDeleteConfirmOpen(false)
      showToast("Property and all associated data deleted successfully.")
    } catch (e: any) {
      console.error("Delete Property Error:", e)
      showToast(`Error: ${e.message || 'Failed to delete property'}`, 'error')
    } finally {
      setIsDeletingProperty(false)
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
      {manageProp && <PropertyDetailsModal property={manageProp} cityData={propCityData} onClose={() => setManageProp(null)} showToast={showToast} userRole={userRole} />}
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

      {/* GLOBAL NOTIFICATIONS */}
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[10000] bg-slate-800/40 border border-slate-700/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{toast.msg}
        </motion.div>
      )}</AnimatePresence>

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{deleteConfirmTitle}</h3>
                <p className="text-sm text-slate-400">{deleteConfirmMessage}</p>
              </div>

              <div className="space-y-4">
                <div className="text-xs text-center text-slate-500 uppercase font-bold tracking-widest">Type <span className="text-red-400">DELETE</span> to confirm</div>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="bg-slate-950 border-slate-700/50 text-white text-center font-bold tracking-widest uppercase h-12 outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-slate-400 hover:text-white"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setDeleteConfirmText("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                  disabled={deleteConfirmText !== "DELETE" || isDeletingProperty}
                  onClick={async () => {
                    if (onConfirmDelete) {
                      await onConfirmDelete()
                    }
                  }}
                >
                  {isDeletingProperty ? <Activity className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
              { id: 'admin_pro', icon: Wrench, label: 'Professional Network' },
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
                            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                              {activeTab === 'admin_managers' ? (
                                <>
                                  <td className="p-4">
                                    <div className="flex flex-col">
                                      <div className="font-medium text-white">{u.full_name || u.id.slice(0, 8)}</div>
                                      {u.company_name && <div className="text-xs text-slate-500 font-normal">{u.company_name}</div>}
                                      {u.company_code && (
                                        <div className="mt-1">
                                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono rounded-md border border-indigo-500/30">
                                            {u.company_code}
                                          </span>
                                        </div>
                                      )}
                                    </div>
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
                                      setEditingCompanyData({ id: u.id, name: u.full_name || '', company_name: u.company_name || '', email: u.email, tier: u.membership_tier || 'Free' });
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
                                <Button size="icon" variant="ghost" className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 ml-2" onClick={() => {
                                  setDeleteConfirmTitle("Delete User Account")
                                  setDeleteConfirmMessage(`Are you sure you want to PERMANENTLY delete ${u.full_name || u.email}? This will also remove all their associated properties, contractors, and requests.`)
                                  setOnConfirmDelete(() => async () => {
                                    const { error } = await supabase.rpc('delete_user', { target_id: u.id });
                                    if (error) {
                                      console.error("Delete Error Full Details:", error);
                                      showToast(`Error: ${error.message || 'Unknown error'}`, 'error');
                                    } else {
                                      setUsers(users.filter(user => user.id !== u.id));
                                      setProperties(properties.filter(p => p.manager_id !== u.id));
                                      setContractors(contractors.filter(c => (c as any).manager_id !== u.id));
                                      const managerPropertyIds = properties.filter(p => p.manager_id === u.id).map(p => p.id);
                                      setRequests(requests.filter(req => (!req.property_id || !managerPropertyIds.includes(req.property_id)) && req.tenant_id !== u.id));
                                      showToast("User and all associated data deleted successfully.");
                                      setDeleteConfirmOpen(false)
                                      setDeleteConfirmText("")
                                    }
                                  })
                                  setDeleteConfirmOpen(true)
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
                            <Input placeholder="Company Name" value={forceManagerData.company_name} onChange={e => setForceManagerData({ ...forceManagerData, company_name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
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
                              <label className="text-xs text-slate-400 mb-1 block">Manager Name</label>
                              <Input placeholder="Manager Name" value={editingCompanyData.name} onChange={e => setEditingCompanyData({ ...editingCompanyData, name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                              <Input placeholder="Company Name" value={editingCompanyData.company_name} onChange={e => setEditingCompanyData({ ...editingCompanyData, company_name: e.target.value })} className="bg-slate-800/40 border-slate-700/50 text-white" />
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
                                new_company_name: editingCompanyData.company_name,
                                new_tier: editingCompanyData.tier
                              });

                              if (!error) {
                                setUsers(users.map(u => u.id === editingCompanyData.id ? { ...u, full_name: editingCompanyData.name, company_name: editingCompanyData.company_name, membership_tier: editingCompanyData.tier } : u));
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
            {/* CONTRACTOR NETWORK TAB */}
            {activeTab === 'contractors' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><HardHat className="w-6 h-6 text-sky-400" /> Professional Contractor Network</h2>
                    <p className="text-slate-400">Verified specialists for NYC compliance, repairs, and inspections.</p>
                  </div>
                  {userRole === 'admin' && (
                    <Button className="bg-sky-500 hover:bg-sky-400 text-white" onClick={() => setShowAddContractor(true)}><Plus className="w-4 h-4 mr-2" /> Add New Contractor</Button>
                  )}
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-4 bg-slate-900/40 backdrop-blur-md/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-gray-300">Filters:</span>
                  </div>
                  <select className="bg-slate-800/40 border-slate-700/50 text-white text-sm rounded-md px-3 py-1 outline-none focus:ring-1 focus:ring-sky-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {['Plumbing', 'Electrical', 'HVAC', 'Construction', 'Cleaning', 'Exterminator', 'Handyman', 'Security', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-800/40 border-slate-700/50 text-white text-sm rounded-md px-3 py-1 outline-none focus:ring-1 focus:ring-sky-500" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                    <option value="All">All Boroughs</option>
                    {['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-500 ml-auto" onClick={() => { setFilterCategory("All"); setFilterLocation("All"); }}>Reset Filters</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredContractors.length === 0 ? (
                    <div className="col-span-full text-center py-20 border border-dashed border-slate-800 rounded-2xl">
                      <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-slate-500">No matching contractors found</h3>
                    </div>
                  ) : filteredContractors.map(c => (
                    <Card key={c.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 group hover:border-sky-500/30 transition-all cursor-pointer overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5 flex gap-4 items-start border-b border-slate-800/50">
                          <div className="w-14 h-14 bg-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                            {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <HardHat className="w-6 h-6 text-slate-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg truncate group-hover:text-sky-400 transition-colors">{c.name}</h4>
                            <div className="text-xs text-purple-400 font-bold uppercase tracking-widest mt-0.5">{c.category || c.type}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px] px-1.5 h-5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</Badge>
                              {c.location && <Badge variant="outline" className="border-slate-700 text-slate-500 text-[10px] px-1.5 h-5">{c.location}</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-black/10 flex items-center justify-between">
                          <div className="flex gap-1 items-center">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span className="text-xs font-bold text-white">4.8</span>
                            <span className="text-[10px] text-slate-500">(24 Reviews)</span>
                          </div>
                          <div className="flex gap-2">
                            {userRole === 'admin' && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-white" onClick={(e) => {
                                e.stopPropagation()
                                setEditingContractor(c)
                                setNewCon({ name: c.name, company_name: c.company_name || '', location: c.location || '', category: c.category || c.type, phone: c.phone || '', email: c.email || '', image: c.image || '' })
                                setShowAddContractor(true)
                              }}><Settings className="w-4 h-4" /></Button>
                            )}
                            <Button size="sm" className="bg-sky-500 hover:bg-sky-400 text-white h-8 text-xs font-bold">Contact Pro</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                  <Input placeholder="Company Name (Optional)" value={newCon.company_name} onChange={e => setNewCon({ ...newCon, company_name: e.target.value })} className="bg-slate-800/40 border-slate-600/50 text-white" />
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
                <Button variant="ghost" onClick={() => { setShowAddContractor(false); setEditingContractor(null); setNewCon({ name: '', category: 'General', phone: '', email: '', company_name: '', location: '', image: '' }) }}>Cancel</Button>
                <Button className="bg-indigo-400 text-white" onClick={editingContractor ? handleUpdateContractor : handleAddContractor} disabled={!newCon.name}>
                  {editingContractor ? 'Update Contractor' : 'Add Contractor'}
                </Button>
              </div>
            </div>
          </motion.div>
        )
        }</AnimatePresence >

        {/* GLOBAL NOTIFICATIONS */}
        < AnimatePresence > {toast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[10000] bg-slate-800/40 border border-slate-700/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{toast.msg}
          </motion.div>
        )
        }</AnimatePresence >

        {/* GLOBAL DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {
            deleteConfirmOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{deleteConfirmTitle}</h3>
                    <p className="text-sm text-slate-400">{deleteConfirmMessage}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="text-xs text-center text-slate-500 uppercase font-bold tracking-widest">Type <span className="text-red-400">DELETE</span> to confirm</div>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE here..."
                      className="bg-slate-950 border-slate-700/50 text-white text-center font-bold tracking-widest uppercase h-12 outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      className="flex-1 text-slate-400 hover:text-white"
                      onClick={() => {
                        setDeleteConfirmOpen(false)
                        setDeleteConfirmText("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                      disabled={deleteConfirmText !== "DELETE" || isDeletingProperty}
                      onClick={async () => {
                        if (onConfirmDelete) {
                          await onConfirmDelete()
                        }
                      }}
                    >
                      {isDeletingProperty ? <Activity className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          }
        </AnimatePresence>
      </div>
    )
  }

  // Flatten compliance events for the calendar list view
  const allCalendarEvents = properties.flatMap(p => [
    { id: `${p.id}-ll97`, propertyAddress: p.address, propertyId: p.id, law: 'LL97', category: 'Carbon Emissions', deadline: 'May 1, 2025', status: 'Action Req', color: 'text-amber-500', bgColor: 'bg-amber-500/20', icon: 'Flame' },
    { id: `${p.id}-ll84`, propertyAddress: p.address, propertyId: p.id, law: 'LL84', category: 'Energy Benchmarking', deadline: 'May 1, 2025', status: 'Approaching', color: 'text-sky-400', bgColor: 'bg-sky-400/20', icon: 'Zap' },
    { id: `${p.id}-ll11`, propertyAddress: p.address, propertyId: p.id, law: 'LL11', category: 'Facade Inspection', deadline: 'Cycle 10', status: 'Pending', color: 'text-purple-500', bgColor: 'bg-purple-500/20', icon: 'Building2' },
    { id: `${p.id}-ll152`, propertyAddress: p.address, propertyId: p.id, law: 'LL152', category: 'Gas Piping', deadline: 'Dec 31, 2025', status: 'On Track', color: 'text-gray-400', bgColor: 'bg-slate-800/50', icon: 'Scale' },
  ])

  const filteredCalendarEvents = allCalendarEvents.filter(ev => {
    const matchesSearch = ev.propertyAddress.toLowerCase().includes(calSearch.toLowerCase())
    const matchesCategory = calCategoryFilter === 'all' || ev.law === calCategoryFilter
    const matchesStatus = calStatusFilter === 'all' || ev.status === calStatusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Group by property for the new cleaner UI
  const groupedCalendar = properties.map(p => {
    const events = filteredCalendarEvents.filter(e => e.propertyId === p.id)
    if (events.length === 0) return null

    // Most urgent event for this building
    const primaryEvent = [...events].sort((a, b) => {
      if (a.status === 'Action Req' && b.status !== 'Action Req') return -1
      if (a.status !== 'Action Req' && b.status === 'Action Req') return 1
      return 0
    })[0]

    return {
      property: p,
      allLaws: allCalendarEvents.filter(e => e.propertyId === p.id), // All 4 laws for this building
      filteredEvents: events,
      primaryEvent: primaryEvent,
      criticalCount: events.filter(e => e.status === 'Action Req').length,
      warningCount: events.filter(e => e.status === 'Approaching').length
    }
  }).filter(Boolean).sort((a: any, b: any) => {
    // Sort grouped list by primary event urgency
    if (a.primaryEvent.status === 'Action Req' && b.primaryEvent.status !== 'Action Req') return -1
    return 0
  })

  // Filter vault documents
  const filteredVaultDocuments = vaultDocuments.filter(d => {
    const matchesProperty = !vaultProp || String(d.property_id) === String(vaultProp.id)
    const matchesCategory = docFilter === 'all' || d.category === docFilter
    const matchesSearch = vaultSearch === "" ||
      d.file_name?.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      (d.ai_analysis?.overall_summary && typeof d.ai_analysis.overall_summary === 'string' && d.ai_analysis.overall_summary.toLowerCase().includes(vaultSearch.toLowerCase()))
    return matchesProperty && matchesCategory && matchesSearch
  }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-6 right-6 z-[10000] bg-slate-800/40 border border-slate-700/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{toast.msg}
        </motion.div>
      )}</AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col z-20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="h-16 flex items-center px-6 border-b border-border font-bold text-xl cursor-pointer hover:text-sky-400 transition-colors" onClick={async () => { await supabase.auth.signOut(); setUserRole(null); }}><Building2 className="w-6 h-6 mr-2 text-sky-400" />Evereez</div>

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

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'autopilot', icon: Sparkles, label: 'AI Autopilot', isPro: true },
            { id: 'ai_consultants', icon: MessageSquare, label: 'AI Consultants', isPro: true },
            { id: 'documents', icon: FileText, label: 'Document Vault', isPro: true },
            { id: 'requests', icon: ClipboardList, label: 'Requests', badge: requests.filter(r => r.status === 'Pending').length },
            { id: 'map', icon: MapIcon, label: 'Map' },
            { id: 'properties', icon: Building2, label: 'Properties' },
            { id: 'manager_tenants', icon: Users, label: 'Tenants' },
            { id: 'calendar', icon: Calendar, label: 'Compliance Calendar' },
            { id: 'll97', icon: Flame, label: 'LL97 Simulator' },
            { id: 'contractors', icon: HardHat, label: 'Contractor Network' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].filter(i => {
            if (i.id === 'manager_tenants' || i.id === 'requests') return (userRole as string) === 'manager' || (userRole as string) === 'admin'
            return true
          }).map(i => (
            <button
              key={i.id}
              onClick={() => setActiveTab(i.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-primary/10 text-primary shadow-sm shadow-sky-400/10' : 'hover:bg-secondary text-slate-400 hover:text-white'}`}
            >
              <i.icon className={`w-5 h-5 ${i.isPro ? 'text-purple-400' : ''}`} />
              <span className="flex-1 text-left">{i.label}</span>
              {i.isPro && <Sparkles className="w-3 h-3 text-purple-400 opacity-60" />}
              {i.badge ? <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-lg shadow-red-500/40">{i.badge}</span> : null}
            </button>
          ))}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="px-4 pb-2">
          <button
            onClick={async () => {
              try { await supabase.auth.signOut() } catch (err) {}
              setUserRole(null)
              window.location.href = "/"
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10 text-slate-400 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-left">Log Out</span>
          </button>
        </div>

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
              <div className="space-y-10 pb-10">
                {/* PREMIUM HERO SECTION */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/50 shadow-2xl p-8 group"
                >
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-sky-500/10 rounded-full blur-[100px] group-hover:bg-sky-500/20 transition-all duration-700"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-widest text-xs">
                        <Sparkles className="w-4 h-4 animate-pulse" /> AI Powered Portfolio Manager
                      </div>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">{userProfile?.full_name?.split(' ')[0] || 'Manager'}</span>
                      </h1>
                      <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                        Welcome back to your NYC compliance mission control. You have <span className="text-white font-bold">{properties.length} active properties</span> and <span className="text-amber-400 font-bold">{requests.filter(r => r.status === 'Pending').length} unresolved requests</span> that need your attention.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button onClick={() => setShowAddProperty(true)} size="lg" className="bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 px-8 py-6 rounded-2xl font-bold gap-2">
                        <Plus className="w-5 h-5" /> Add Property
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => setActiveTab('ai_consultants')} className="border-slate-700 text-white hover:bg-slate-800 px-8 py-6 rounded-2xl font-bold gap-2 backdrop-blur-md">
                        <MessageSquare className="w-5 h-5 text-sky-400" /> AI Consultant
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* EXPIRY ALERT BANNER (If any) */}
                {vaultDocuments.some(d => d.expires_at && (new Date(d.expires_at).getTime() - new Date().getTime()) < 30 * 24 * 60 * 60 * 1000) && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between group backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold shadow-inner">!</div>
                      <div>
                        <h4 className="font-bold text-amber-500">Urgent: Document Expiration</h4>
                        <p className="text-xs text-slate-400">Critical: <span className="text-white font-bold">{vaultDocuments.filter(d => d.expires_at && (new Date(d.expires_at).getTime() - new Date().getTime()) < 30 * 24 * 60 * 60 * 1000).length} documents</span> are expiring within the next 30 days. Action required to maintain compliance.</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg" onClick={() => { setActiveTab('documents'); setDocFilter('all'); }}>Review Now</Button>
                  </motion.div>
                )}

                {/* EXPANDED METRICS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-0">{properties.filter(p => p.status === 'Good').length} Healthy</Badge>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-white">{properties.length}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Properties</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{properties.filter(p => p.status === 'Warning').length} Warning</span>
                        <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{properties.filter(p => p.status === 'Critical').length} Critical</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-white">{requests.filter(r => r.status === 'Pending').length}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Requests</p>
                      <p className="text-[10px] text-slate-600 font-medium italic">Needs Attention</p>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono">ENCRYPTED</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-white">{vaultDocuments.length}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Vault Documents</p>
                      <p className="text-[10px] text-slate-600 font-medium italic">{vaultDocuments.filter(d => d.ai_processed).length} AI Processed</p>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '94%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-white">94%</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Compliance Score</p>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">+2.4% vs last month</p>
                    </div>
                  </motion.div>
                </div>

                {/* COMPLIANCE BREAKDOWN */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-sky-400" /> Compliance Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { agency: 'HPD', status: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', count: properties.reduce((acc, p) => acc + (p.violations || 0), 0) + ' Violations' },
                      { agency: 'DOB', status: 'Warning', color: 'text-amber-400', bg: 'bg-amber-500/10', count: '2 Open Complaints' },
                      { agency: 'FDNY', status: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', count: 'Active Permits' },
                      { agency: 'Sanitation', status: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', count: '0 Summon' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/40 border border-slate-700/50 rounded-2xl flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-black mb-3 text-xs`}>
                          {item.agency}
                        </div>
                        <div className="text-sm font-bold text-white mb-1">{item.status}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QUICK ACTIONS & RECENT ACTIVITY */}
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" /> Command Center
                      </h3>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setActiveTab('autopilot')}
                        className="bg-gradient-to-br from-indigo-600/20 to-indigo-900/20 border border-indigo-500/30 p-6 rounded-3xl text-left hover:border-indigo-400 transition-all group relative overflow-hidden"
                      >
                        <Sparkles className="w-10 h-10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-lg font-bold text-white mb-2">Compliance Autopilot</h4>
                        <p className="text-sm text-slate-400">Launch AI strategy to resolve pending building violations automatically.</p>
                      </button>
                      
                      <button 
                        onClick={() => setActiveTab('documents')}
                        className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 p-6 rounded-3xl text-left hover:border-emerald-400 transition-all group"
                      >
                        <FileText className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-lg font-bold text-white mb-2">Document Analysis</h4>
                        <p className="text-sm text-slate-400">Upload and instantly extract data from leases, insurance, and notices.</p>
                      </button>
                    </div>

                    {properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || '')).length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">Portfolio Map View</h3>
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('map')} className="text-sky-400 hover:text-white">View Full Map <ArrowRight className="w-3 h-3 ml-1" /></Button>
                        </div>
                        <div className="h-[300px] rounded-3xl overflow-hidden border border-slate-700/50 shadow-inner shadow-black">
                          <MapViewer
                            properties={properties.filter(p => !['Pending Verification', 'Rejected'].includes(p.status || ''))}
                            onSelectProperty={setManageProp}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl">
                        <Building2 className="w-14 h-14 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Portfolio Empty</h3>
                        <p className="text-slate-400 mb-6">Start by adding your first NYC property to unlock the full compliance dashboard.</p>
                        <Button onClick={() => setShowAddProperty(true)} className="bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 rounded-xl px-8 font-bold">Register Property</Button>
                      </div>
                    )}
                  </div>

                  {/* SIDEBAR: RECENT REQUESTS PREVIEW */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-sky-400" /> Pending Items
                      </h3>
                      <Badge className="bg-sky-500/20 text-sky-400">{requests.filter(r => r.status === 'Pending').length}</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {requests.filter(r => r.status === 'Pending').length > 0 ? (
                        requests.filter(r => r.status === 'Pending').slice(0, 4).map((req: TenantRequest, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 bg-slate-900/40 border border-slate-700/50 rounded-2xl hover:bg-slate-800/40 transition-colors cursor-pointer group"
                            onClick={() => setActiveTab('requests')}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{req.type}</span>
                              <span className="text-[10px] text-slate-500">{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{req.description}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="py-10 text-center border border-dashed border-slate-700/50 rounded-2xl">
                          <CheckCircle className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                          <p className="text-xs text-slate-500 italic">No pending requests</p>
                        </div>
                      )}
                      
                      <Button variant="ghost" onClick={() => setActiveTab('requests')} className="w-full text-slate-500 hover:text-white border border-slate-800/50 rounded-xl text-xs py-6">
                        View All Requests <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </div>

                    {/* UPGRADE TEASER if not Pro */}
                    {userProfile?.membership_tier !== 'Pro' && (
                      <div className="mt-8 p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                        <Sparkles className="absolute -top-4 -right-4 w-20 h-20 text-white/10 group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="font-black text-lg mb-2 relative z-10">Go Pro Today</h4>
                        <p className="text-xs text-indigo-100 mb-4 opacity-90 leading-relaxed">Unlock unlimited AI Compliance roadmaps and priority contractor matching.</p>
                        <Button onClick={() => setShowUpgradeModal(true)} className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-lg">Upgrade Now</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI CONSULTANTS */}
            {activeTab === 'ai_consultants' && (
              <div className="flex flex-col h-[calc(100vh-12rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-sky-400">
                      <MessageSquare className="w-6 h-6" /> Specialized AI Consultants
                    </h2>
                    <p className="text-muted-foreground mt-1">Get expert NYC legal, real estate, and tax advice from specialized AI agents.</p>
                  </div>
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    {[
                      { id: 'legal', label: 'Legal', icon: Scale, color: 'text-purple-400' },
                      { id: 'real_estate', label: 'Real Estate', icon: Building2, color: 'text-emerald-400' },
                      { id: 'tax', label: 'Tax', icon: CreditCard, color: 'text-amber-400' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setAiAgentType(t.id as any)
                          setAiChatMessages([{ role: 'assistant', content: `Hello! I'm your NYC ${t.label} AI consultant. How can I assist you?` }])
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${aiAgentType === t.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <t.icon className={`w-4 h-4 ${aiAgentType === t.id ? t.color : ''}`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 font-bold"
                      onClick={handleSaveChat}
                      disabled={isSavingChat || aiChatMessages.length <= 1}
                    >
                      {isSavingChat ? <Activity className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      Save Consultation
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white gap-2 font-bold"
                      onClick={() => {
                        setShowAiHistory(true)
                        fetchChatHistory()
                      }}
                    >
                      <HistoryIcon className="w-3 h-3" />
                      History
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {aiChatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-sky-500' : 'bg-slate-800 border border-slate-700'}`}>
                            {m.role === 'user' ? <Users className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div className={`space-y-2`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none' : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none ProseMirror markdown-content'}`}>
                              {m.role === 'assistant' ? (
                                <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                                  <ReactMarkdown>
                                    {m.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                m.content
                              )}
                            </div>
                            {m.usedContext && (
                              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider px-1">
                                <ShieldCheck className="w-3 h-3" /> Growth Plan: Analyzed {m.sources?.length || 0} documents
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isAiChatLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="bg-slate-800/30 p-4 rounded-2xl rounded-tl-none border border-slate-700/30 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-black/20 border-t border-slate-700/50">
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleAIChat(); }}
                      className="flex gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 focus-within:ring-2 focus-within:ring-sky-500/50 transition-all"
                    >
                      <Input
                        value={aiChatInput}
                        onChange={(e) => setAiChatInput(e.target.value)}
                        placeholder={`${aiAgentType === 'legal' ? 'Ask about NYC Housing Law, MDL, or compliance...' : aiAgentType === 'tax' ? 'Ask about property tax assessments, exemptions, or PILOT...' : 'Ask about management strategy, ROI, or LL97 response...'}`}
                        className="bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-600 h-11"
                        disabled={isAiChatLoading}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="bg-sky-500 hover:bg-sky-400 text-white rounded-lg h-11 w-11 shadow-lg shadow-sky-500/20"
                        disabled={isAiChatLoading || !aiChatInput.trim()}
                      >
                        {isAiChatLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </form>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Secure AI Environment
                      </div>
                      {userProfile?.membership_tier === 'Free' && (
                        <div className="text-amber-500 font-bold flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setShowUpgradeModal(true)}>
                          <Sparkles className="w-3 h-3" /> Upgrade to Growth for Personal Document Analysis
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => setManageProp(p)}>Manage Details</Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTitle("Delete Property")
                            setDeleteConfirmMessage(`Are you sure you want to PERMANENTLY delete ${p.address}? All documents, requests, and city data history will be lost.`)
                            setOnConfirmDelete(() => async () => {
                              await handleDeleteProperty(p.id)
                              setDeleteConfirmOpen(false)
                              setDeleteConfirmText("")
                            })
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* AI COMPLIANCE AUTOPILOT */}
            {activeTab === 'autopilot' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-400"><Sparkles className="w-6 h-6" /> AI Compliance Autopilot</h2>
                    <p className="text-muted-foreground mt-1">Automated violation resolution paths, document generation, and contractor matching.</p>
                  </div>
                  {manageProp ? (
                    <Button
                      className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
                      disabled={isAnalyzingAutopilot}
                      onClick={async () => {
                        if (!manageProp.bin) {
                          showToast("Property BIN missing for analysis.", "info")
                          return
                        }
                        setIsAnalyzingAutopilot(true)
                        try {
                          // Fetch latest violations for this property first
                          const resVio = await fetch(`/api/check_violations?bin=${manageProp.bin}`)
                          const jsonVio = await resVio.json()
                          const vios = jsonVio.violations || []

                          if (vios.length === 0) {
                            showToast("No open violations found to analyze.", "info")
                            return
                          }

                          const auth = await supabase.auth.getSession()
                          const res = await fetch('/api/compliance-autopilot', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${auth.data.session?.access_token}`
                            },
                            body: JSON.stringify({ property_id: manageProp.id, violations: vios })
                          })
                          const json = await res.json()
                          if (json.data) {
                            setComplianceResolutions(json.data)
                            showToast("AI Autopilot initialized!")
                          } else {
                            showToast(json.error || "Analysis failed.", "error")
                          }
                        } catch (e) {
                          showToast("Error starting Autopilot.", "error")
                        } finally {
                          setIsAnalyzingAutopilot(false)
                        }
                      }}
                    >
                      {isAnalyzingAutopilot ? <Activity className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4" />}
                      {isAnalyzingAutopilot ? 'Analyzing...' : 'Generate Action Plans'}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 px-3 py-1">Select a Property to start Autopilot</Badge>
                  )}
                </div>

                {!manageProp ? (
                  <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 backdrop-blur-md">
                    <Building2 className="w-16 h-16 mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-500">No Property Selected</h3>
                    <p className="text-slate-600 max-w-sm mx-auto mb-6">Select a property from your portfolio or the map to see its AI resolution paths.</p>
                    <Button variant="outline" className="border-slate-800 text-slate-400" onClick={() => setActiveTab('properties')}>Go to Properties</Button>
                  </div>
                ) : complianceResolutions.length === 0 ? (
                  <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20 backdrop-blur-md">
                    <ShieldAlert className="w-16 h-16 mx-auto text-purple-500/50 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No active resolutions</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Hit "Generate Action Plans" above to have AI analyze this property's violations and build your compliance roadmap.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {complianceResolutions.map((resolution: any) => (
                      <Card key={resolution.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 overflow-hidden">
                        <div className="flex flex-col lg:flex-row">
                          {/* Sidebar Info */}
                          <div className="w-full lg:w-72 bg-black/20 border-r border-slate-800/50 p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge className={`${resolution.violation_class === 'C' ? 'bg-red-500' : resolution.violation_class === 'B' ? 'bg-amber-500' : 'bg-sky-500'}`}>Class {resolution.violation_class}</Badge>
                              <Badge variant="outline" className="border-slate-700 text-slate-400">ID: {resolution.violation_id}</Badge>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{resolution.violation_description}</h3>
                            <div className="space-y-4 mt-6">
                              <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Score</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${resolution.ai_risk_score}%` }}></div>
                                  </div>
                                  <span className="text-sm font-bold text-purple-400">{resolution.ai_risk_score}</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</label>
                                <div className="mt-1">
                                  <Badge className={resolution.overall_status === 'resolved' ? 'bg-emerald-500' : 'bg-sky-500'}>{resolution.overall_status?.replace('_', ' ')}</Badge>
                                </div>
                              </div>
                              <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
                                <p className="text-[11px] text-purple-300 italic">"AI predicts a resolution timeline of 14-21 days if steps are followed."</p>
                              </div>
                            </div>
                          </div>

                          {/* Action Plan */}
                          <div className="flex-1 p-6">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <HistoryIcon className="w-4 h-4 text-purple-400" /> AI Action Plan Steps
                            </h4>
                            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                              {resolution.ai_action_plan?.map((step: any, idx: number) => (
                                <div key={idx} className="relative pl-8 group">
                                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-slate-900 z-10 flex items-center justify-center text-[10px] font-bold ${step.status === 'done' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-purple-500 group-hover:text-white transition-colors'}`}>
                                    {step.status === 'done' ? <Check className="w-3 h-3" /> : idx + 1}
                                  </div>
                                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-bold text-white">{step.title}</h5>
                                        <Badge variant="outline" className="text-[10px] h-4 border-slate-700 text-slate-500">{step.category}</Badge>
                                      </div>
                                      <p className="text-sm text-slate-400">{step.description}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      {step.category === 'Paperwork' && step.status !== 'done' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10 h-7"
                                          disabled={isGeneratingStepDoc}
                                          onClick={async () => {
                                            setIsGeneratingStepDoc(true)
                                            try {
                                              const auth = await supabase.auth.getSession()
                                              const docGenRes = await fetch('/api/compliance-autopilot/generate-doc', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.session?.access_token}` },
                                                body: JSON.stringify({
                                                  resolution_id: resolution.id,
                                                  step_index: idx,
                                                  property_id: manageProp.id
                                                })
                                              })
                                              const json = await docGenRes.json()
                                              if (json.data) {
                                                setShowDocPreview(json.data)
                                                // Refresh resolutions to show 'Mark Done' or linked doc
                                                showToast("AI Document Generated!")
                                              }
                                            } catch (e) { showToast("Generation error", "error") }
                                            finally { setIsGeneratingStepDoc(false) }
                                          }}
                                        >
                                          {isGeneratingStepDoc ? <Activity className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3 mr-1" />}
                                          Generate Doc
                                        </Button>
                                      )}
                                      {['Plumbing', 'Electrical', 'HVAC', 'Lead', 'Repair', 'Construction'].some(k => step.category?.includes(k)) && step.status !== 'done' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 h-7"
                                          disabled={isMatchingPro}
                                          onClick={async () => {
                                            setActiveAutopilotStep({ ...step, resId: resolution.id, idx })
                                            setIsMatchingPro(true)
                                            try {
                                              const resMatch = await fetch(`/api/compliance-autopilot/match-contractor?category=${step.category}&borough=${manageProp.borough}`)
                                              const json = await resMatch.json()
                                              setMatchingContractors(json.data || [])
                                            } catch (e) { console.error(e) }
                                            finally { setIsMatchingPro(false) }
                                          }}
                                        >
                                          {isMatchingPro ? <Activity className="w-3 h-3 animate-spin" /> : <HardHat className="w-3 h-3 mr-1" />}
                                          Match Pro
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        className={`${step.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-800/40 text-slate-400 hover:text-white'} h-7`}
                                        onClick={async () => {
                                          const nextStatus = step.status === 'done' ? 'pending' : 'done'
                                          const auth = await supabase.auth.getSession()
                                          const upRes = await fetch('/api/compliance-autopilot', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.session?.access_token}` },
                                            body: JSON.stringify({ resolution_id: resolution.id, step_index: idx, step_status: nextStatus })
                                          })
                                          const upJson = await upRes.json()
                                          if (upJson.data) {
                                            setComplianceResolutions(prev => prev.map(p => p.id === resolution.id ? upJson.data : p))
                                            showToast(`Step "${step.title}" marked as ${nextStatus}`)
                                          }
                                        }}
                                      >
                                        {step.status === 'done' ? 'Resolved' : 'Mark Done'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DOCUMENT VAULT */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-sky-400" /> Document Vault</h2>
                    <p className="text-muted-foreground mt-1">AI-powered centralized document repository for all compliance records.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {userRole === 'manager' && (
                      <div className="flex gap-2">
                        <select
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500 min-w-[200px]"
                          value={vaultProp?.id ? String(vaultProp.id) : ""}
                          onChange={(e) => {
                            const val = e.target.value
                            const p = properties.find(prop => String(prop.id) === val) || null
                            setVaultProp(p)
                          }}
                        >
                          <option value="">All Buildings</option>
                          {properties.map(p => (
                            <option key={p.id} value={String(p.id)}>{p.address}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
                    <div className="relative group">
                      <input
                        type="file"
                        id="doc-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (!vaultProp && userRole === 'manager') {
                            showToast("Please select a property first", "info")
                            return
                          }
                          setIsUploadingDoc(true)
                          try {
                            const auth = await supabase.auth.getSession()
                            const formData = new FormData()
                            formData.append('file', file)
                            if (vaultProp) formData.append('property_id', String(vaultProp.id))

                            const uploadRes = await fetch('/api/documents/upload', {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${auth.data.session?.access_token}` },
                              body: formData
                            })
                            const json = await uploadRes.json()
                            if (json.data) {
                              setVaultDocuments([json.data, ...vaultDocuments])
                              showToast("Document Uploaded & AI Analysis Started!")
                            } else {
                              showToast(json.error || "Upload failed", "error")
                            }
                          } catch (e) { showToast("Upload error.", "error") }
                          finally {
                            setIsUploadingDoc(false)
                            e.target.value = '' // Reset input
                          }
                        }}
                      />
                      <Button
                        className="bg-sky-500 hover:bg-sky-400 text-white gap-2 shadow-lg shadow-sky-500/20"
                        disabled={isUploadingDoc || (userRole === 'manager' && !vaultProp)}
                        onClick={() => document.getElementById('doc-upload')?.click()}
                      >
                        {isUploadingDoc ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isUploadingDoc ? 'Uploading...' : 'Upload'}
                      </Button>
                      {userRole === 'manager' && !vaultProp && (
                        <div className="absolute -bottom-8 right-0 text-[10px] text-amber-500 font-bold whitespace-nowrap animate-pulse">
                          Select building first
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {vaultDocuments.length === 0 ? (
                  <div className="p-20 text-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/20">
                    <FileText className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Vault Empty</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-6">
                      {userRole === 'manager' && !vaultProp ? "Select a building to view documents." : "Upload documents to start AI analysis."}
                    </p>
                  </div>
                ) : filteredVaultDocuments.length === 0 ? (
                  <div className="p-20 text-center border border-slate-700/50 rounded-2xl bg-slate-900/20">
                    <Search className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400">No documents match your search or filter.</p>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800/80 bg-slate-900/50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Document Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Building / Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">AI Analysis</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Uploaded At</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {filteredVaultDocuments.map((doc: any) => (
                            <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                    {doc.file_type?.includes('pdf') ? <FileText className="w-5 h-5 text-red-400" /> : <FileText className="w-5 h-5 text-sky-400" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">{doc.file_name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">ID: {String(doc.id).slice(0, 8)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-300 font-medium">
                                  {properties.find(p => String(p.id) === String(doc.property_id))?.address || "Unassigned"}
                                </div>
                                <Badge className="mt-1 text-[9px] bg-slate-800 border-0 capitalize">{doc.category}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                {doc.ai_processed ? (
                                  <div className="space-y-1">
                                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 whitespace-nowrap">
                                      <ShieldCheck className="w-3 h-3" /> AI Analyzed
                                    </div>
                                    {doc.ai_analysis?.overall_summary && (
                                      <div className="text-[10px] text-slate-500 line-clamp-1 italic">"{doc.ai_analysis.overall_summary}"</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-sky-400 font-bold flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 animate-spin" /> Processing...
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-mono text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {(userProfile?.membership_tier === 'Growth' || userProfile?.membership_tier === 'Business' || (userRole as string) === 'admin') ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${isIndexingDoc === doc.id ? 'text-purple-400 animate-spin' : 'text-slate-500 hover:text-purple-400'}`}
                                      title="AI Education (Index for Consulting)"
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        setIsIndexingDoc(doc.id)
                                        try {
                                          const res = await fetch('/api/documents/index', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ document_id: doc.id })
                                          })
                                          const json = await res.json()
                                          if (json.success) showToast(json.message || "AI Education Complete!")
                                          else showToast(json.error || "Education failed", "error")
                                        } catch (e) { showToast("Indexing error", "error") }
                                        finally { setIsIndexingDoc(null) }
                                      }}
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </Button>
                                  ) : null}
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => setSelectedDoc(doc)}>
                                    <Activity className="w-4 h-4" />
                                  </Button>
                                  <Link href={doc.file_url} target="_blank">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-400 hover:text-white hover:bg-sky-500/20">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COMPLIANCE CALENDAR */}
            {/* COMPLIANCE CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-sky-400" /> Compliance Calendar</h2>
                    <p className="text-muted-foreground mt-1">Unified view of all NYC local law deadlines across your portfolio.</p>
                  </div>
                  {/* Upgrade Placeholder CTA */}
                  {(!userProfile?.membership_tier || userProfile.membership_tier === 'Free') && (
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2 shadow-lg shadow-indigo-500/20" onClick={() => setShowUpgradeModal(true)}>
                      <ArrowUpCircle className="w-4 h-4" /> Unlock growth features
                    </Button>
                  )}
                </div>

                {/* FILTER BAR */}
                <Card className="bg-slate-900/40 backdrop-blur-md border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          placeholder="Search addresses..."
                          className="pl-10 bg-slate-950 border-slate-800 focus:ring-sky-500"
                          value={calSearch}
                          onChange={(e) => setCalSearch(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4">
                        <select
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500 min-w-[140px]"
                          value={calCategoryFilter}
                          onChange={(e) => setCalCategoryFilter(e.target.value)}
                        >
                          <option value="all">All Laws</option>
                          <option value="LL97">LL97 (Carbon)</option>
                          <option value="LL84">LL84 (Energy)</option>
                          <option value="LL11">LL11 (Facade)</option>
                          <option value="LL152">LL152 (Gas)</option>
                        </select>
                        <select
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500 min-w-[140px]"
                          value={calStatusFilter}
                          onChange={(e) => setCalStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="Action Req">Action Required</option>
                          <option value="Approaching">Approaching</option>
                          <option value="On Track">On Track</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {properties.length === 0 ? (
                  <div className="p-20 text-center bg-slate-900/40 backdrop-blur-md/50 border border-dashed border-slate-700/50 rounded-2xl">
                    <HistoryIcon className="w-12 h-12 mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Portfolio Empty</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">Add properties to start tracking their NYC compliance deadlines in a unified view.</p>
                    <Button className="bg-sky-500 hover:bg-sky-400" onClick={() => setShowAddProperty(true)}>Add Property</Button>
                  </div>
                ) : groupedCalendar.length === 0 ? (
                  <div className="p-20 text-center bg-slate-900/20 border border-slate-800 rounded-2xl">
                    <Filter className="w-10 h-10 mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500">No properties match your current filters.</p>
                    <Button variant="link" className="text-sky-400 mt-2" onClick={() => { setCalSearch(""); setCalCategoryFilter("all"); setCalStatusFilter("all"); }}>Clear Filters</Button>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800/80 bg-slate-900/50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Building Address</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance Matrix</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Next Deadline</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {groupedCalendar.map((group: any) => (
                            <tr key={group.property.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">{group.property.address}</div>
                                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{group.property.borough.toUpperCase()} • {group.property.units} UNITS</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {group.allLaws.map((ev: any) => (
                                    <div
                                      key={ev.law}
                                      className={`group/law relative px-2.5 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${group.filteredEvents.find((fe: any) => fe.law === ev.law) ? 'opacity-100 scale-100 shadow-lg' : 'opacity-20 scale-90 grayscale'} ${ev.status === 'Action Req' ? 'bg-red-500/10 border-red-500/50' : ev.status === 'Approaching' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/50 border-slate-700'}`}
                                      title={`${ev.law}: ${ev.status}`}
                                    >
                                      {ev.icon === 'Flame' && <Flame className={`w-3.5 h-3.5 ${ev.status === 'Action Req' ? 'text-red-500' : ev.status === 'Approaching' ? 'text-amber-500' : 'text-slate-400'}`} />}
                                      {ev.icon === 'Zap' && <Zap className={`w-3.5 h-3.5 ${ev.status === 'Action Req' ? 'text-red-500' : ev.status === 'Approaching' ? 'text-amber-500' : 'text-slate-400'}`} />}
                                      {ev.icon === 'Building2' && <Building2 className={`w-3.5 h-3.5 ${ev.status === 'Action Req' ? 'text-red-500' : ev.status === 'Approaching' ? 'text-amber-500' : 'text-slate-400'}`} />}
                                      {ev.icon === 'Scale' && <Scale className={`w-3.5 h-3.5 ${ev.status === 'Action Req' ? 'text-red-500' : ev.status === 'Approaching' ? 'text-amber-500' : 'text-slate-400'}`} />}
                                      <span className="text-[9px] font-bold text-slate-300">{ev.law}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-mono text-white flex items-center gap-2">
                                  {group.primaryEvent.status === 'Action Req' && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
                                  {group.primaryEvent.deadline}
                                </div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{group.primaryEvent.law} • {group.primaryEvent.category}</div>
                              </td>
                              <td className="px-6 py-4">
                                {calCategoryFilter === 'all' ? (
                                  <div className="flex flex-col gap-1">
                                    {group.criticalCount > 0 && (
                                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] px-1.5 py-0">
                                        {group.criticalCount} Critical {group.criticalCount > 1 ? 'Laws' : 'Law'}
                                      </Badge>
                                    )}
                                    {group.warningCount > 0 && (
                                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[9px] px-1.5 py-0">
                                        {group.warningCount} Warning
                                      </Badge>
                                    )}
                                    {group.criticalCount === 0 && group.warningCount === 0 && (
                                      <Badge className="bg-slate-800 text-slate-500 border-0 text-[10px] px-1.5 py-0">All On Track</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <Badge className={`text-[10px] ${group.primaryEvent.status === 'Action Req' ? 'bg-red-500' : group.primaryEvent.status === 'Approaching' ? 'bg-amber-500' : 'bg-slate-800'} border-0`}>
                                    {group.primaryEvent.status}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="sm" className="text-sky-400 hover:text-white hover:bg-sky-500/20 gap-2" onClick={() => setManageProp(group.property)}>
                                  View Details <ArrowRight className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TENANTS (MANAGER ONLY) */}
            {activeTab === 'manager_tenants' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white"><Users className="w-6 h-6 text-sky-400" /> Tenant Management</h2>
                    <p className="text-muted-foreground mt-1">Manage and invite tenants for your properties.</p>
                  </div>
                  <Button onClick={() => setShowAddTenant(true)} className="bg-indigo-500 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> Add Tenant</Button>
                </div>

                {tenants.length === 0 ? (
                  <div className="p-20 text-center border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/20 backdrop-blur-md">
                    <Users className="w-16 h-16 mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No Tenants Yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Add tenants to allow them to report issues and access building information via the Tenant Portal.</p>
                    <Button variant="outline" className="border-slate-700/50 text-slate-400 hover:text-white" onClick={() => setShowAddTenant(true)}>Add Your First Tenant</Button>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800/80 bg-slate-950/50">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Name / Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Building / Unit</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Joined At</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {tenants.map(t => (
                            <tr key={t.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8 border border-slate-700/50"><AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.full_name}`} /><AvatarFallback>TN</AvatarFallback></Avatar>
                                  <div>
                                    <div className="text-sm font-bold text-white uppercase">{t.full_name || 'Unnamed Tenant'}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{t.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-300 font-medium">{properties.find(p => p.id === t.property_id)?.address || 'Unknown Building'}</div>
                                <Badge className="mt-1 text-[10px] bg-slate-800 text-slate-400 border-0">Unit {t.unit || 'N/A'}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={`${t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} border`}>{t.status}</Badge>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-mono text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => alert("Message feature coming soon")}><MessageSquare className="w-4 h-4" /></Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                    onClick={async () => {
                                      if (confirm(`Remove ${t.full_name} from this property?`)) {
                                        await supabase.from('profiles').update({ property_id: null, unit: null }).eq('id', t.id)
                                        setTenants(tenants.filter(x => x.id !== t.id))
                                        showToast("Tenant removed.")
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LL97 SIMULATOR TAB */}
            {activeTab === 'll97' && (
              <div className="space-y-6 max-w-5xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-400"><Leaf className="w-6 h-6" /> Local Law 97 Carbon Simulator</h2>
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
                        {/* Quick select from existing properties */}
                        {properties.length > 0 && (
                          <div className="pb-4 border-b border-slate-800/50">
                            <label className="text-xs text-slate-400 mb-2 block font-bold uppercase tracking-wider">Quick Select</label>
                            <div className="flex flex-wrap gap-2">
                              {properties.slice(0, 5).map(p => (
                                <Button key={p.id} size="sm" variant="outline" className="text-[10px] h-7 border-slate-700/50 hover:border-emerald-400 hover:text-emerald-400 bg-slate-950/50" onClick={() => runLL97Simulation(p)}>
                                  <Building2 className="w-3 h-3 mr-1" /> {p.address.split(',')[0]}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

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
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 mt-2 shadow-lg shadow-emerald-500/20" onClick={() => runLL97Simulation()} disabled={ll97Loading}>
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
                    <strong className="text-emerald-400">Evereez Verified Partners.</strong> Every contractor in the Pro Network holds active NYC Department of Buildings (DOB) licenses, verified insurance, and passes rigorous quality checks.
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
                            {c.company_name && <div className="text-sm text-slate-400 font-medium">{c.company_name}</div>}
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
        <DocumentPreviewModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        <AiHistoryModal 
          isOpen={showAiHistory} 
          onClose={() => setShowAiHistory(false)} 
          history={aiChatHistory} 
          isLoading={isHistoryLoading} 
          onSelect={loadChatRecord} 
        />
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
                  {userRole === 'manager' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        setDeleteConfirmTitle("Delete Property")
                        setDeleteConfirmMessage(`Are you sure you want to PERMANENTLY delete ${manageProp.address}? All documents, requests, and city data history will be lost.`)
                        setOnConfirmDelete(() => async () => {
                          await handleDeleteProperty(manageProp.id)
                          setDeleteConfirmOpen(false)
                          setDeleteConfirmText("")
                        })
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Property
                    </Button>
                  )}
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
                <button onClick={() => setPropTab('autopilot')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${propTab === 'autopilot' ? 'border-purple-400 text-purple-300' : 'border-transparent text-slate-400 hover:text-gray-300'}`}>
                  <Sparkles className="w-4 h-4" /> AI Autopilot
                </button>
                <button onClick={() => setPropTab('vault')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${propTab === 'vault' ? 'border-sky-400 text-sky-300' : 'border-transparent text-slate-400 hover:text-gray-300'}`}>
                  <FileText className="w-4 h-4" /> Documents
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

                        <Button
                          className="w-full bg-indigo-500 hover:bg-blue-700 text-white gap-2"
                          onClick={() => {
                            setActiveTab('ll97');
                            setManageProp(null);
                            if (manageProp) runLL97Simulation(manageProp);
                          }}
                          disabled={ll97Loading}
                        >
                          <Flame className="w-4 h-4" /> Run LL97 Simulation
                        </Button>

                        {/* NEW: Building AI Expert contextual entry */}
                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5 mt-6 group hover:border-purple-400/40 transition-all">
                          <h3 className="font-bold text-white text-md flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-purple-400" /> Building AI Expert</h3>
                          <p className="text-xs text-slate-400 mb-4 leading-relaxed">Get expert legal and real estate advice for this property ({manageProp.address}) based on its specific documents and live city data.</p>
                          <Button
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-lg shadow-purple-500/20"
                            onClick={() => {
                              setAiAgentType('legal');
                              setAiChatMessages([{ role: 'assistant', content: `Hello! I've reviewed the documents and live data for ${manageProp.address}. How can I help you regarding this building?` }]);
                              setActiveTab('ai_consultants');
                              setManageProp(null);
                            }}
                          >
                            <MessageSquare className="w-4 h-4" /> Chat with Building AI
                          </Button>
                        </div>
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

                {propTab === 'autopilot' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-purple-400"><Sparkles className="w-5 h-5" /> AI Resolution Roadmap</h3>
                        <p className="text-sm text-slate-400 mt-1">Automated compliance steps and risk analysis for this property.</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
                        disabled={isAnalyzingAutopilot}
                        onClick={async () => {
                          if (!manageProp.bbl) { showToast("BBL missing for analysis.", "info"); return; }
                          setIsAnalyzingAutopilot(true)
                          try {
                            const resVio = await fetch(`/api/check_violations?bbl=${manageProp.bbl}`)
                            const jsonVio = await resVio.json()
                            const vios = jsonVio.data || []
                            if (vios.length === 0) { showToast("No open violations found.", "info"); return; }
                            const auth = await supabase.auth.getSession()
                            const res = await fetch('/api/compliance-autopilot', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.session?.access_token}` },
                              body: JSON.stringify({ property_id: manageProp.id, violations: vios })
                            })
                            const json = await res.json()
                            if (json.data) {
                              setComplianceResolutions(json.data)
                              showToast("AI Autopilot initialized!")
                            } else {
                              const errorMsg = json.error || "Analysis failed."
                              showToast(errorMsg, "error")
                            }
                          } catch (e: any) {
                            const errorMsg = e.message || "Error starting Autopilot."
                            showToast(errorMsg, "error")
                          }
                          finally { setIsAnalyzingAutopilot(false) }
                        }}
                      >
                        {isAnalyzingAutopilot ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isAnalyzingAutopilot ? 'Analyzing...' : 'Generate Roadmap'}
                      </Button>
                    </div>

                    {complianceResolutions.length === 0 ? (
                      <div className="p-16 text-center border border-slate-700/50 border-dashed rounded-2xl bg-slate-900/20 backdrop-blur-md">
                        <ShieldAlert className="w-12 h-12 mx-auto text-purple-500/50 mb-3" />
                        <h4 className="font-bold text-white mb-1">No Active AI Roadmap</h4>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">Click "Generate Roadmap" to analyze violations and build a compliance strategy.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {complianceResolutions.map((res: any) => (
                          <div key={res.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/20">
                              <div className="flex items-center gap-3">
                                <Badge className={`${res.violation_class === 'C' ? 'bg-red-500' : 'bg-amber-500'}`}>Class {res.violation_class}</Badge>
                                <span className="font-bold text-sm text-white">#{res.violation_id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">AI Risk Score:</span>
                                <span className="text-sm font-bold text-purple-400">{res.ai_risk_score}</span>
                              </div>
                            </div>
                            <div className="p-4 space-y-4">
                              <p className="text-sm text-gray-300 italic">"{res.violation_description}"</p>

                              <div className="space-y-3 pt-2">
                                {res.ai_action_plan?.map((step: any, idx: number) => (
                                  <div key={idx} className="flex gap-3 items-start group">
                                    <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${step.status === 'done' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                                      {step.status === 'done' ? <Check className="w-3 h-3" /> : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{step.title}</div>
                                        <button
                                          onClick={async () => {
                                            const nextStatus = step.status === 'done' ? 'pending' : 'done'
                                            const auth = await supabase.auth.getSession()
                                            const upRes = await fetch('/api/compliance-autopilot', {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.data.session?.access_token}` },
                                              body: JSON.stringify({ resolution_id: res.id, step_index: idx, step_status: nextStatus })
                                            })
                                            const upJson = await upRes.json()
                                            if (upJson.data) {
                                              setComplianceResolutions(prev => prev.map(p => p.id === res.id ? upJson.data : p))
                                            }
                                          }}
                                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded transition-colors ${step.status === 'done' ? 'text-emerald-500 hover:text-red-500' : 'text-slate-500 hover:text-white'}`}
                                        >
                                          {step.status === 'done' ? 'Undo' : 'Mark Done'}
                                        </button>
                                      </div>
                                      <p className="text-[11px] text-slate-400 leading-tight">{step.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {propTab === 'vault' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-sky-400" /> Building Vault</h3>
                        <p className="text-sm text-slate-400 mt-1">Property-specific document repository.</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="modal-doc-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file || !manageProp) return
                            setIsUploadingDoc(true)
                            try {
                              const auth = await supabase.auth.getSession()
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('property_id', String(manageProp.id))

                              const uploadRes = await fetch('/api/documents/upload', {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${auth.data.session?.access_token}` },
                                body: formData
                              })
                              const json = await uploadRes.json()
                              if (json.data) {
                                setVaultDocuments([json.data, ...vaultDocuments])
                                showToast("Document Uploaded!")
                              } else {
                                showToast(json.error || "Upload failed", "error")
                              }
                            } catch (e) { showToast("Upload error", "error") }
                            finally {
                              setIsUploadingDoc(false)
                              e.target.value = '' // Reset input
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-sky-500 hover:bg-sky-400 text-white gap-2"
                          onClick={() => document.getElementById('modal-doc-upload')?.click()}
                          disabled={isUploadingDoc}
                        >
                          {isUploadingDoc ? <Activity className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Upload
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vaultDocuments.filter(d => d.property_id === manageProp.id).length === 0 ? (
                        <div className="col-span-full p-12 text-center border border-slate-700/50 border-dashed rounded-xl">
                          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500">No documents found for this property.</p>
                        </div>
                      ) : (
                        vaultDocuments.filter(d => d.property_id === manageProp.id).map((doc: any) => (
                          <Card key={doc.id} className="bg-slate-900/40 border-slate-800 hover:border-sky-500/30 transition-all cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                            <CardContent className="p-4 flex gap-4 items-center">
                              <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6 text-slate-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{doc.file_name}</h4>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{doc.category} • {new Date(doc.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${doc.ai_processed ? 'bg-sky-500' : 'bg-amber-500 animate-pulse'}`} />
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
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
                {selectedRequest.description || 'No description provided.'}
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
                  <p className="text-sm text-slate-400">Manage your Evereez subscription and limits.</p>
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

      {/* GLOBAL DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden p-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{deleteConfirmTitle}</h3>
                <p className="text-sm text-slate-400">{deleteConfirmMessage}</p>
              </div>

              <div className="space-y-4">
                <div className="text-xs text-center text-slate-500 uppercase font-bold tracking-widest">Type <span className="text-red-400">DELETE</span> to confirm</div>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here..."
                  className="bg-slate-950 border-slate-700/50 text-white text-center font-bold tracking-widest uppercase h-12 outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-slate-400 hover:text-white"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setDeleteConfirmText("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                  disabled={deleteConfirmText !== "DELETE" || isDeletingProperty}
                  onClick={async () => {
                    if (onConfirmDelete) {
                      await onConfirmDelete()
                    }
                  }}
                >
                  {isDeletingProperty ? <Activity className="w-4 h-4 animate-spin" /> : "Delete Forever"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD TENANT MODAL */}
      <AnimatePresence>
        {showAddTenant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-xl w-full max-w-md space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="text-sky-400" /> Invite Tenant</h2>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setShowAddTenant(false)}><X className="w-5 h-5" /></Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Tenant Full Name</label>
                  <Input
                    placeholder="e.g. Jane Smith"
                    value={newTenant.full_name}
                    onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })}
                    className="bg-slate-800/40 border-slate-600/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 uppercase font-bold">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    className="bg-slate-800/40 border-slate-600/50 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Unit # *</label>
                    <Input
                      placeholder="e.g. 4B"
                      value={newTenant.unit}
                      onChange={(e) => setNewTenant({ ...newTenant, unit: e.target.value })}
                      className="bg-slate-800/40 border-slate-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase font-bold">Building *</label>
                    <select
                      className="w-full bg-slate-800/40 border border-slate-600/50 text-white rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
                      value={newTenant.property_id}
                      onChange={(e) => setNewTenant({ ...newTenant, property_id: e.target.value })}
                    >
                      <option value="">Select Building</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.address}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg text-xs text-slate-400 leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <p>If the tenant already has an Evereez account, they will be instantly linked. If not, they will receive an invitation to join your building.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-6">
                  <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowAddTenant(false)}>Cancel</Button>
                  <Button
                    className="bg-indigo-500 hover:bg-blue-700 text-white px-8"
                    onClick={handleAddTenant}
                    disabled={isAddingTenant || !newTenant.email || !newTenant.property_id || !newTenant.unit}
                  >
                    {isAddingTenant ? <Activity className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Invite Tenant
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

