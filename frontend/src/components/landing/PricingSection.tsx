import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Sparkles, Building2, Rocket, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRef } from "react";

interface Tier {
    id: string;
    name: string;
    icon: React.ReactNode;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    popular?: boolean;
    color: string;
    gradient: string;
}

const tiers: Tier[] = [
    {
        id: "starter",
        name: "Developer",
        icon: <Rocket className="h-5 w-5" />,
        price: "$0",
        period: "/mo",
        description: "Perfect for hacking together side projects and MVPs.",
        features: [
            "Up to 3 Projects",
            "Human-verified Templates",
            "Public Community Access",
            "Basic Dashboard Metrics",
            "Standard API access",
        ],
        cta: "Get Started",
        color: "cyan",
        gradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
        id: "pro",
        name: "Founder",
        icon: <Sparkles className="h-5 w-5" />,
        price: "$19",
        period: "/mo",
        description: "The complete toolkit for scaling your SaaS to the moon.",
        features: [
            "Unlimited Projects",
            "AI Orchestration Engine",
            "Custom Domain Support",
            "Advanced RBAC",
            "Priority Compute Queuing",
            "White-label Analytics",
        ],
        cta: "Upgrade to Founder",
        popular: true,
        color: "purple",
        gradient: "from-purple-500/30 to-pink-500/30",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        icon: <Building2 className="h-5 w-5" />,
        price: "Custom",
        period: "",
        description: "Unmatched scale for large teams and platform builders.",
        features: [
            "Everything in Pro",
            "Dedicated Infrastructure",
            "Custom SLAs & Security",
            "SSO/SAML integration",
            "Dedicated Account Manager",
            "On-premise deployment",
        ],
        cta: "Talk to Sales",
        color: "amber",
        gradient: "from-amber-500/20 to-orange-500/20",
    },
];

function PricingCard({ tier, index }: { tier: Tier; index: number }) {
    const navigate = useNavigate();
    const cardRef = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        x.set((mouseXVal / width) - 0.5);
        y.set((mouseYVal / height) - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleAction = () => {
        if (tier.id === 'starter') {
            navigate('/projects');
        } else {
            toast.info("Transitioning to payment gateway...");
        }
    };

    const colorMap: Record<string, string> = {
        cyan: "text-cyan-400",
        purple: "text-purple-400",
        amber: "text-amber-400"
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            style={{ rotateX, rotateY, perspective: 1000 }}
            className="group relative h-full"
        >
            <div className={`relative h-full flex flex-col p-8 rounded-[2.5rem] border bg-black/40 backdrop-blur-3xl overflow-hidden ${tier.popular ? "border-white/20" : "border-white/10"}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${colorMap[tier.color]}`}>
                            {tier.icon}
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase text-white/50">{tier.name}</span>
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-5xl font-black tracking-tighter text-white">{tier.price}</span>
                        <span className="text-lg font-medium text-white/30">{tier.period}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/40 mb-8 font-medium">{tier.description}</p>
                </div>

                <div className="relative z-10 flex-1 space-y-4 mb-10">
                    <div className="h-px bg-white/5 w-full" />
                    {tier.features.map((feature, i) => (
                        <div key={feature} className="flex items-start gap-3">
                            <div className={`mt-1 p-0.5 rounded-full bg-white/5 ${colorMap[tier.color]}`}>
                                <Check className="h-3 w-3" strokeWidth={3} />
                            </div>
                            <span className="text-sm text-white/60 font-medium">{feature}</span>
                        </div>
                    ))}
                </div>

                <motion.button
                    onClick={handleAction}
                    className={`relative w-full py-4 rounded-2xl font-bold tracking-tight transition-all duration-500 flex items-center justify-center gap-2 ${tier.popular ? "bg-white text-black" : "bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black"}`}
                >
                    <span className="relative z-10">{tier.cta}</span>
                    <ArrowRight className="h-4 w-4 relative z-10" />
                </motion.button>
            </div>
        </motion.div>
    );
}

export default function PricingSection() {
    return (
        <section className="relative z-10 px-6 py-40 md:px-12 bg-black">
            <div className="mx-auto max-w-7xl">
                <div className="mb-24 text-center">
                    <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="mb-4 text-xs font-bold uppercase tracking-[0.4em] text-blue-400">
                        The Infrastructure
                    </motion.p>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tighter text-white md:text-6xl">
                        Built for <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Every Journey</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {tiers.map((tier, i) => (
                        <PricingCard key={tier.id} tier={tier} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
