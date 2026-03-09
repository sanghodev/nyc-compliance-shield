
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="font-bold text-xl tracking-tight">
                        Evereez <span className="text-gray-500 text-sm font-normal ml-2">Terms of Service</span>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto space-y-8 text-gray-300 leading-relaxed">
                <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
                <p className="text-sm text-gray-500">Effective Date: February 13, 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using the Evereez website ("Site") and related services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. User Accounts</h2>
                    <p>
                        To access certain features of the Services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. Intellectual Property</h2>
                    <p>
                        The Services and their entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by Evereez, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. Prohibited Uses</h2>
                    <p>
                        You may use the Services only for lawful purposes and in accordance with these Terms. You agree not to use the Services:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                        <li>To send, knowingly receive, upload, download, use, or re-use any material that does not comply with the content standards set out in these Terms.</li>
                        <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
                        <li>To impersonate or attempt to impersonate Evereez, a Evereez employee, another user, or any other person or entity.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">5. Limitation of Liability</h2>
                    <p>
                        IN NO EVENT WILL EVEREEZ, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SERVICES.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">6. Changes to Terms</h2>
                    <p>
                        We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them. Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes.
                    </p>
                </section>

            </div>
        </div>
    )
}
