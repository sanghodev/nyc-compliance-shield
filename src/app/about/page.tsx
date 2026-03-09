
import Link from "next/link"
import { Building2, CheckCircle, Shield, Zap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <span>Asset<span className="text-gray-400">Guard</span></span>
                    </Link>
                    <div className="flex gap-6 text-sm font-medium text-gray-400">
                        <Link href="/about" className="text-white">About</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto space-y-16">
                <div className="text-center space-y-6">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Smart Buildings. Total Ease.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Evereez was born from a simple frustration: Why is managing buildings in 2026 still so hard? We are building the operating system for the built world.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 pt-12">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-6 h-6 text-purple-500" /> Trust & Security
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            We believe that trust is the currency of real estate. Our platform ensures that every transaction, every maintenance request, and every compliance document is verifiable and secure.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Zap className="w-6 h-6 text-yellow-500" /> Speed & Automation
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            Time is the only asset you can't buy more of. We automate the mundane—HPD filings, rent collection, repair dispatching—so you can focus on growing your portfolio.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users className="w-6 h-6 text-blue-500" /> Tenant Experience
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            Happy tenants stay longer. We provide a 5-star digital experience that makes paying rent and requesting repairs as easy as ordering a ride.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" /> Compliance First
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            NYC regulations are a minefield. Evereez acts as your 24/7 compliance officer, ensuring you never miss a filing deadline or face a preventable fine.
                        </p>
                    </div>
                </div>

                <div className="pt-24 text-center">
                    <h2 className="text-3xl font-bold mb-8">Join the Revolution</h2>
                    <Link href="/">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full text-lg font-bold">Get Started Today</Button>
                    </Link>
                </div>

            </div>

            <footer className="py-12 border-t border-white/10 text-center bg-black relative z-10 text-gray-600 text-xs">
                © 2026 Evereez. All rights reserved.
            </footer>
        </div>
    )
}
