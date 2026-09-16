import { motion } from "framer-motion";
import {
    Waves,
    BrainCircuit,
    ShieldCheck,
    Zap,
    BarChart3,
    Satellite,
} from "lucide-react";
import GlassCard from "./GlassCard";

const cards = [
    {
        icon: <Waves className="h-6 w-6" />,
        title: "Simulate Floods Instantly",
        description:
            "Run real-time climate stress-tests for your city, roads, or power plants. Get visual flood models in under 30 seconds.",
        glow: "192 100% 50%",
    },
    {
        icon: <BrainCircuit className="h-6 w-6" />,
        title: "AI Risk Scoring",
        description:
            "Every asset gets a dynamic risk score powered by multi-model AI ensembles. Explainable, auditable, instant.",
        glow: "265 90% 60%",
    },
    {
        icon: <ShieldCheck className="h-6 w-6" />,
        title: "ROI Estimator",
        description:
            "Know the financial impact before you invest. Our AI calculates retrofit ROI with 94% accuracy against actuals.",
        glow: "152 69% 50%",
    },
    {
        icon: <Zap className="h-6 w-6" />,
        title: "Real-Time Alerts",
        description:
            "Push notifications when risk thresholds breach. Integrates with SCADA, IoT sensors, and municipal dashboards.",
        glow: "38 92% 55%",
    },
    {
        icon: <BarChart3 className="h-6 w-6" />,
        title: "Decision Dashboards",
        description:
            "Drag-and-drop analytics for policy makers. Compare scenarios, export compliance reports, share with stakeholders.",
        glow: "220 85% 60%",
    },
    {
        icon: <Satellite className="h-6 w-6" />,
        title: "Satellite Integration",
        description:
            "Fuse satellite imagery, weather data, and ground sensors into a unified intelligence layer. Updated every 15 minutes.",
        glow: "340 80% 55%",
    },
];

export default function ValuePropositionCards() {
    return (
        <section className="relative z-10 px-6 py-32 md:px-12">
            {/* Section heading */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7 }}
                className="mx-auto mb-16 max-w-2xl text-center"
            >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/80">
                    Why CLIMX
                </p>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                    Infrastructure intelligence,{" "}
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        redefined
                    </span>
                </h2>
                <p className="mt-4 text-base text-white/50">
                    Six capabilities that give governments and enterprises an unfair
                    advantage against climate risk.
                </p>
            </motion.div>

            {/* Cards grid */}
            <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, i) => (
                    <GlassCard
                        key={card.title}
                        icon={card.icon}
                        title={card.title}
                        description={card.description}
                        glowColor={card.glow}
                        delay={i * 0.08}
                    />
                ))}
            </div>
        </section>
    );
}
