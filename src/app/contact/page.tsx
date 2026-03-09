
"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send, CheckCircle, Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Simulate form submission
        setTimeout(() => {
            setSubmitted(true)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="font-bold text-xl tracking-tight">
                        Evereez <span className="text-gray-500 text-sm font-normal ml-2">Contact Support</span>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16">
                    <div className="space-y-8">
                        <h1 className="text-5xl font-bold tracking-tight">Get in touch</h1>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            Have a question or need assistance? Our support team is here to help you 24/7. We typically respond within 15 minutes.
                        </p>

                        <div className="space-y-6 pt-8">
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                                    <Mail className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Email Us</div>
                                    <div className="text-sm">support@evereez.com</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                                    <Phone className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Call Us</div>
                                    <div className="text-sm">+1 (212) 555-0192</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-300">
                                <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                                    <MapPin className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Visit Us</div>
                                    <div className="text-sm">1 World Trade Center, New York, NY</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
                        <CardContent className="p-8">
                            {submitted ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                                    <p className="text-gray-400">Thanks for reaching out {formData.name}.<br />We'll be in touch shortly.</p>
                                    <Button variant="outline" className="mt-6 border-zinc-700 text-white hover:bg-zinc-800" onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", subject: "", message: "" }) }}>Send another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">Your Name</label>
                                        <Input required placeholder="John Doe" className="bg-black border-zinc-700 h-12 text-white" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">Email Address</label>
                                        <Input required type="email" placeholder="john@example.com" className="bg-black border-zinc-700 h-12 text-white" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">Subject</label>
                                        <select className="w-full bg-black border border-zinc-700 text-white rounded-md h-12 px-3 outline-none focus:ring-2 focus:ring-purple-500" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                                            <option value="" disabled>Select a topic</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Technical Support">Technical Support</option>
                                            <option value="Billing Issue">Billing Issue</option>
                                            <option value="Feature Request">Feature Request</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400">Message</label>
                                        <textarea required className="w-full bg-black border border-zinc-700 text-white rounded-md p-4 h-32 outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="How can we help you?" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}></textarea>
                                    </div>
                                    <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-900/20">Send Message <Send className="w-4 h-4 ml-2" /></Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
