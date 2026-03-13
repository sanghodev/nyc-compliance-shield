
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { 
  Users, Building2, ShieldCheck, Search, Plus, 
  Settings, Bell, LayoutDashboard, LogOut, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace("/")
        return
      }
      
      const role = session.user.user_metadata?.role
      if (role !== "admin") {
        router.replace("/")
        return
      }
      setIsAdmin(true)
    }
    checkAdmin()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Security Command</h1>
              <p className="text-slate-400">System-wide monitoring and administration</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">1,284</div>
              <p className="text-xs text-emerald-500 mt-1">+12% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">Managed Buildings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">542</div>
              <p className="text-xs text-sky-400 mt-1">Active coverage</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider">System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-xs text-slate-500 mt-1">All systems nominal</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-white/10 text-sky-400 border-sky-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider">Security Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">ALPHA</div>
              <p className="text-xs mt-1">Hardened active</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/40 border-white/10">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>System-wide actions and security logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium">User Password Reset</div>
                      <div className="text-xs text-slate-500">Admin-initiated • 5m ago</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">Success</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
