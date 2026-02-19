"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react"

export default function ViolationItem({ v }: { v: any }) {
    const [expanded, setExpanded] = useState(false)

    // Simple AI Insight Logic (Mock)
    const getAIInsight = (desc: string) => {
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
            msg: "General maintenance violation.",
            action: "Inspect and repair as per housing code.",
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
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-md mb-2">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                            <Sparkles className="w-3 h-3" /> AI Insight
                        </div>
                        <p className="text-zinc-300 text-xs mb-2">{insight.msg}</p>
                        <div className="text-xs font-semibold text-white">Recommended Action:</div>
                        <p className="text-zinc-400 text-xs mb-3">{insight.action}</p>

                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs gap-2">
                            Connect with {insight.pro} <ArrowRight className="w-3 h-3" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
