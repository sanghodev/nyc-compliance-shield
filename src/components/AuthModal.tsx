
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, Building2, Home, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabaseClient"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    defaultRole: "manager" | "tenant" | "admin" | "contractor" // Added contractor
    selectedTier?: string // Added tier
    onLoginSuccess: (role: "manager" | "tenant" | "admin" | "contractor") => void
}

export function AuthModal({ isOpen, onClose, defaultRole, selectedTier, onLoginSuccess }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [accessCode, setAccessCode] = useState("")
    const [unit, setUnit] = useState("")

    // ... (rest of simple state)

    const handleAuth = async () => {
        setLoading(true)
        setError(null)
        try {
            if (isLogin) {
                // ... (existing login logic)
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) throw error
                const role = data.user.user_metadata.role || defaultRole
                if (defaultRole === 'admin' && role !== 'admin') throw new Error("Access Denied.")
                onLoginSuccess(role)
            } else {
                // SIGN UP
                let propertyId = null

                // Validate Access Code & Unit for Tenants
                if (defaultRole === 'tenant') {
                    if (!accessCode) throw new Error("Property Access Code required.")
                    if (!unit) throw new Error("Unit number required.")

                    const res = await fetch('/api/validate-tenant', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_code: accessCode, unit: unit.trim().toUpperCase() })
                    })
                    const data = await res.json()

                    if (!res.ok) {
                        throw new Error(data.error || "Invalid Access Code or Unit.")
                    }
                    propertyId = data.property_id
                } else if (defaultRole === 'admin') {
                    if (!accessCode) throw new Error("Admin Secret Code required.")
                    if (accessCode !== 'SUPERADMIN2026') throw new Error("Invalid Admin Secret Code.")
                }

                // Prepare Metdata
                const meta = {
                    role: defaultRole,
                    property_id: propertyId,
                    unit: defaultRole === 'tenant' ? unit.trim().toUpperCase() : null,
                    access_code: accessCode,
                    status: defaultRole === 'manager' ? 'Active' : 'Pending', // Manager active by default for trial
                    membership_tier: selectedTier || 'Starter', // Default to Starter
                    commission_rate: defaultRole === 'contractor' ? 0.15 : 0 // 15% for contractors
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: meta }
                })
                if (error) throw error
                if (data.session) onLoginSuccess(defaultRole)
                else setError("Check email for verification.")
            }
            onClose()
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-zinc-900 border border-zinc-700 w-full max-w-md p-8 rounded-2xl shadow-2xl relative"
                    >
                        {/* Close button ... */}
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-8">
                            {/* Icon Logic */}
                            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${defaultRole === 'manager' ? 'bg-blue-600' : defaultRole === 'contractor' ? 'bg-orange-600' : 'bg-green-600'}`}>
                                {defaultRole === 'manager' ? <Building2 className="w-8 h-8 text-white" /> : <Home className="w-8 h-8 text-white" />}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {isLogin ? 'Log In' : 'Create Account'}
                            </h2>
                            {selectedTier && !isLogin && (
                                <div className="inline-block bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
                                    Selected Plan: {selectedTier}
                                </div>
                            )}
                            <p className="text-gray-400 text-sm">
                                {defaultRole === 'contractor' ? "Join the Pro Network via Agent Commission." : "Manage your portfolio with AI."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Access Code Input (For Tenant & Admin Signup) */}
                            {!isLogin && (defaultRole === 'tenant' || defaultRole === 'admin') && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">{defaultRole === 'admin' ? 'Admin Secret Code' : 'Property Access Code'}</label>
                                        <Input
                                            type="text"
                                            placeholder={defaultRole === 'admin' ? "Enter secret code" : "Enter 6-character code"}
                                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                                            value={accessCode}
                                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    {defaultRole === 'tenant' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-300">Unit Number</label>
                                            <Input
                                                type="text"
                                                placeholder="e.g. 4B, 12, Penthouse"
                                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                                                value={unit}
                                                onChange={(e) => setUnit(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                />
                            </div>

                            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">{error}</div>}

                            <Button
                                className={`w-full h-12 text-lg font-bold mt-2 ${defaultRole === 'manager' ? 'bg-blue-600 hover:bg-blue-700' : defaultRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                onClick={handleAuth}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? "Sign In" : "Create Account")}
                            </Button>

                            <div className="text-center mt-4">
                                <span className="text-gray-400 text-sm">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
                                <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-white font-bold hover:underline transition-all">
                                    {isLogin ? "Sign Up" : "Log In"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
