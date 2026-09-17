import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useClerk } from "@clerk/clerk-react";
import { ChevronDown, BarChart3, CheckCircle2, MousePointer2, Zap, ArrowRight, LogIn, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { setDemoMode } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";

import AnoAI from "@/components/ui/animated-shader-background";
import BentoFeatures from "@/components/landing/BentoFeatures";
import PricingSection from "@/components/landing/PricingSection";
import BottomCTA from "@/components/landing/BottomCTA";
import Footer from "@/components/landing/Footer";
import TrustedCompanies from "@/components/landing/TrustedCompanies";
import StatsSection from "@/components/landing/StatsSection";
import FAQSection from "@/components/landing/FAQSection";
import FloatingBackground from "@/components/landing/FloatingBackground";
import { DevOSLogo } from "@/components/DevOSLogo";

gsap.registerPlugin(SplitText);

export default function LandingPage() {
    return (
        <>
            <LandingContent />
        </>
    );
}

function LandingContent() {
    const rootRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const h1Ref = useRef<HTMLHeadingElement>(null);
    const subRef = useRef<HTMLParagraphElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const mockupRef = useRef<HTMLDivElement>(null);

    const { isSignedIn, isDemo } = useAuthUser();
    let clerk: any = null;
    try {
        clerk = useClerk();
    } catch {
        // Clerk optional
    }

    const handleSignIn = () => {
        if (clerk?.openSignIn) {
            clerk.openSignIn({
                forceRedirectUrl: "#/",
                fallbackRedirectUrl: "#/",
            });
        } else {
            setDemoMode(true);
            window.location.hash = "#/";
            window.location.reload();
        }
    };

    const handleSignUp = () => {
        if (clerk?.openSignUp) {
            clerk.openSignUp({
                forceRedirectUrl: "#/",
                fallbackRedirectUrl: "#/",
            });
        } else {
            setDemoMode(true);
            window.location.hash = "#/";
            window.location.reload();
        }
    };

    useGSAP(
        () => {
            const ctas = ctaRef.current ? Array.from(ctaRef.current.children) : [];
            const subSplit = new SplitText(subRef.current, { type: "lines" });

            gsap.set(bgRef.current, { filter: "blur(40px)", opacity: 0 });
            gsap.set(iconRef.current, { opacity: 0, scale: 0.2, rotateY: -180 });
            gsap.set(h1Ref.current, { opacity: 0, y: 100, scale: 0.95, filter: "blur(20px)" });
            gsap.set(subSplit.lines, { opacity: 0, y: 30, filter: "blur(10px)" });
            gsap.set(descRef.current, { opacity: 0, y: 20 });
            if (ctas.length) gsap.set(ctas, { opacity: 0, y: 30, scale: 0.9 });
            gsap.set(scrollRef.current, { opacity: 0, y: 20 });
            gsap.set(mockupRef.current, { opacity: 0, y: 150, scale: 0.7, rotateX: 30, filter: "blur(10px)" });

            const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

            tl.to(bgRef.current, { filter: "blur(0px)", opacity: 1, duration: 2.5 }, 0.2)
                .to(iconRef.current, { opacity: 1, scale: 1, rotateY: 0, duration: 1.2, ease: "back.out(2)" }, 0.5)
                .to(h1Ref.current, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.5 }, 0.8)
                .to(subSplit.lines, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.1 }, "-=1")
                .to(descRef.current, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
                .to(ctas, { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.2, ease: "back.out(1.2)" }, "-=0.4")
                .to(mockupRef.current, { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)", duration: 2, ease: "power4.out" }, "-=0.8")
                .to(scrollRef.current, { opacity: 1, y: 0, duration: 0.8 }, "-=0.5");

            return () => {
                subSplit.revert();
            };
        },
        { scope: rootRef },
    );

    return (
        <div ref={rootRef} className="relative w-full overflow-x-hidden bg-black text-white selection:bg-indigo-500/30">
            <section className="relative h-screen w-full flex flex-col items-center pt-12 pb-0 overflow-hidden">
                <div className="absolute inset-0 z-0" ref={bgRef}>
                    <AnoAI />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.15),transparent_70%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                    <div
                        ref={iconRef}
                        className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 hover:rotate-6 hover:scale-110"
                    >
                        <div className="relative w-14 h-14 rounded-2xl shadow-[0_0_40px_rgba(108,92,231,0.45)] overflow-hidden transition-transform group-hover/logo:scale-110">
                            <DevOSLogo size={56} className="w-full h-full" />
                        </div>
                    </div>

                    <div ref={h1Ref} className="mx-auto flex justify-center mb-8 relative">
                        <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tighter uppercase italic px-4 leading-tight drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
                            <span className="inline-block text-white">DEV</span>
                            <span className="inline-block bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent pr-12 -mr-10">OS</span>
                            <br />
                            <span className="inline-block text-white/90">MONITOR.</span>
                        </h1>
                    </div>

                    <p ref={subRef} className="mx-auto mt-6 max-w-4xl text-xs font-black tracking-[0.6em] text-indigo-400 uppercase md:text-lg drop-shadow-lg opacity-80 italic">
                        The Neural Engine for Project Continuity.
                    </p>

                    <p ref={descRef} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg font-bold italic tracking-tight">
                        DevOS tracks your neural trajectory across sessions, eliminating context loss
                        and optimizing your deployment velocity.
                    </p>

                    <div ref={ctaRef} className="mt-10 flex flex-wrap items-center justify-center gap-4 relative z-20">
                        {isSignedIn || isDemo ? (
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.hash = "#/";
                                    window.location.reload();
                                }}
                                className="group relative h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-8 text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center justify-center gap-3 cursor-pointer min-w-[200px]"
                            >
                                Launch Dashboard
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSignIn}
                                    className="group relative h-14 rounded-2xl bg-indigo-600 px-8 text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-indigo-500 hover:scale-[1.03] active:scale-[0.98] shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2.5 cursor-pointer min-w-[160px]"
                                >
                                    <LogIn size={15} />
                                    Log In
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSignUp}
                                    className="group relative h-14 rounded-2xl border border-white/15 bg-white/[0.04] px-8 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/30 hover:scale-[1.03] active:scale-[0.98] shadow-xl flex items-center justify-center gap-2.5 cursor-pointer min-w-[160px]"
                                >
                                    <Sparkles size={15} className="text-indigo-400" />
                                    Sign Up
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDemoMode(true);
                                        window.location.hash = "#/";
                                        window.location.reload();
                                    }}
                                    className="group relative h-14 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-300 backdrop-blur-xl transition-all duration-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:scale-[1.03] active:scale-[0.98] shadow-[0_15px_30px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2.5 cursor-pointer min-w-[200px]"
                                >
                                    <Zap size={15} className="text-emerald-400" fill="currentColor" />
                                    Try Guest Demo
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Dashboard Mockup - Highly Premium Redesign */}
                <div
                    ref={mockupRef}
                    className="relative z-10 mt-16 w-full max-w-5xl mx-auto px-6 perspective-2000"
                >
                    <div className="relative rounded-[3rem] border border-white/5 bg-zinc-950/80 backdrop-blur-3xl overflow-hidden shadow-[0_120px_100px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-700 hover:scale-[1.005]">
                        {/* Fake UI Header */}
                        <div className="h-20 border-b border-white/5 flex items-center px-10 justify-between bg-white/[0.01]">
                            <div className="flex gap-3">
                                <div className="w-3 h-3 rounded-full bg-rose-500/30" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex gap-4">
                                    <div className="w-20 h-2 bg-white/5 rounded-full" />
                                    <div className="w-20 h-2 bg-white/5 rounded-full" />
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/20" />
                            </div>
                        </div>

                        {/* Fake UI Content - Reflecting the Redesign */}
                        <div className="p-6 flex gap-6 min-h-[350px] bg-gradient-to-br from-indigo-500/[0.02] to-transparent">
                            {/* Fake Sidebar Area */}
                            <div className="w-16 flex flex-col gap-8 items-center py-4 border-r border-white/5 pr-10 opacity-30">
                                <div className="w-8 h-8 rounded-xl bg-white/5" />
                                <div className="w-8 h-8 rounded-xl bg-indigo-600/40" />
                                <div className="w-8 h-8 rounded-xl bg-white/5" />
                                <div className="w-8 h-8 rounded-xl bg-white/5" />
                                <div className="w-8 h-8 rounded-xl bg-white/5" />
                            </div>

                            <div className="flex-1 space-y-6">
                                {/* Top Stats Grid */}
                                <div className="grid grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-24 rounded-[1.5rem] bg-white/[0.03] border border-white/5 p-4 space-y-2">
                                            <div className="h-1.5 w-1/2 bg-white/5 rounded-full" />
                                            <div className="h-6 w-2/3 bg-indigo-500/20 rounded-xl" />
                                        </div>
                                    ))}
                                </div>

                                {/* Main Workspace Content */}
                                <div className="grid grid-cols-12 gap-10">
                                    <div className="col-span-8 space-y-6">
                                        <div className="h-48 rounded-[2rem] bg-indigo-600/[0.03] border border-indigo-500/10 p-6 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-600/[0.05] to-transparent" />
                                            <div className="flex items-center gap-3 text-indigo-400 mb-4 font-black uppercase text-[10px] tracking-widest">
                                                <BarChart3 size={16} />
                                                Session Trajectory
                                            </div>
                                            <div className="h-20 w-full flex items-end gap-2 px-2">
                                                {[50, 80, 45, 90, 65, 100, 30, 85, 75, 95].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: `${h}%` }}
                                                        className="flex-1 bg-indigo-600/20 rounded-t-lg border-t border-x border-indigo-500/20"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="h-32 rounded-[1.5rem] bg-white/[0.02] border border-white/5" />
                                            <div className="h-32 rounded-[1.5rem] bg-white/[0.02] border border-white/5" />
                                        </div>
                                    </div>
                                    <div className="col-span-4 h-full rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-8 flex flex-col gap-4">
                                        <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                        <div className="space-y-3">
                                            <div className="h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/10 flex items-center px-4">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-500/20" />
                                            </div>
                                            <div className="h-12 rounded-xl bg-white/[0.02] border border-white/5 px-4" />
                                            <div className="h-12 rounded-xl bg-white/[0.02] border border-white/5 px-4" />
                                            <div className="h-12 rounded-xl bg-white/[0.02] border border-white/5 px-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cursor Interaction Visual */}
                        <motion.div
                            animate={{ x: [200, 600, 300, 200], y: [100, 400, 200, 100] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute z-20 pointer-events-none opacity-40"
                        >
                            <MousePointer2 className="text-white fill-white w-8 h-8 drop-shadow-2xl" />
                        </motion.div>

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                    </div>

                    {/* Floating Tech Badges */}
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-16 top-1/4 p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-2xl z-20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-400" size={20} />
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-black text-white uppercase tracking-widest">Active Sync</div>
                                <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest opacity-60">Verified</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div ref={scrollRef} className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2">
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20">SYSTEM SCAN</span>
                        <ChevronDown className="h-5 w-5 text-indigo-500/40" />
                    </motion.div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-10" />
            </section>

            <div className="relative bg-black pb-32">
                <FloatingBackground />
                <TrustedCompanies />
                <div className="py-24 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-indigo-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
                    <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">The Cost of Friction</h2>
                        <p className="text-white/40 leading-relaxed text-lg font-bold max-w-2xl mx-auto">
                            Task switching destroys performance. DevOS preserves your momentum at the core level.
                        </p>
                    </div>
                </div>
                <StatsSection />
                <BentoFeatures />
                <PricingSection />
                <FAQSection />
                <BottomCTA />
                <Footer />
            </div>
        </div>
    );
}
