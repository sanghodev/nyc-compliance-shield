
import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="font-bold text-xl tracking-tight">
                        Evereez <span className="text-gray-500 text-sm font-normal ml-2">Privacy Policy</span>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto space-y-8 text-gray-300 leading-relaxed">
                <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                <p className="text-sm text-gray-500">Last Updated: February 13, 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
                    <p>
                        Welcome to Evereez ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our services. This policy outlines our handling practices and how we collect and use the Personal Data you provide during your interactions with us.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. Data We Collect</h2>
                    <p>
                        We collect information that identifies, relates to, describes, references, is capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or device ("personal information"). This includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Identifiers (e.g., real name, alias, postal address, unique personal identifier, online identifier, Internet Protocol address, email address).</li>
                        <li>Commercial information (e.g., records of personal property, products or services purchased, obtained, or considered).</li>
                        <li>Internet or other similar network activity (e.g., browsing history, search history, information on a consumer's interaction with a website, application, or advertisement).</li>
                        <li>Geolocation data (e.g., physical location or movements).</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. How We Use Your Data</h2>
                    <p>
                        We use the collected information for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To fulfill or meet the reason for which the information is provided.</li>
                        <li>To provide you with information, products, or services that you request from us.</li>
                        <li>To provide you with email alerts, event registrations, and other notices concerning our products or services.</li>
                        <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us.</li>
                        <li>To improve our website and present its contents to you.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
                    <p>
                        We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">5. Contact Information</h2>
                    <p>
                        To ask questions or comment about this privacy policy and our privacy practices, contact us at: <a href="mailto:privacy@evereez.com" className="text-blue-500 hover:underline">privacy@evereez.com</a>
                    </p>
                </section>

            </div>
        </div>
    )
}
