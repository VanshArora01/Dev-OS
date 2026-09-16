import { motion } from "framer-motion";

const companies = [
    "NOAA",
    "NASA",
    "UNICEF",
    "World Bank",
    "FEMA",
    "ESA",
    "USGS",
    "MET Office",
];

export default function TrustedCompanies() {
    return (
        <section className="relative z-10 py-16 bg-black/40 backdrop-blur-md border-y border-white/[0.05] overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-32 bg-indigo-500/[0.05] blur-[100px] rounded-full pointer-events-none" />
            <div className="mx-auto max-w-7xl px-6 relative z-10">
                <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-10 italic">
                    Powering Intelligence For
                </p>

                <div className="relative flex overflow-hidden">
                    <div className="flex animate-marquee whitespace-nowrap gap-12 md:gap-24">
                        {[...companies, ...companies].map((company, i) => (
                            <span
                                key={i}
                                className="text-2xl md:text-3xl font-bold tracking-tighter text-white/20 hover:text-white/40 transition-colors duration-300"
                            >
                                {company}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />
        </section>
    );
}
