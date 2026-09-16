import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail, ArrowRight } from "lucide-react";
import { DevOSLogo } from "@/components/DevOSLogo";

const footerLinks = [
    {
        title: "Platform",
        links: ["Templates", "Orchestration", "Deployment", "API Access"]
    },
    {
        title: "Resources",
        links: ["Documentation", "Showcase", "Blog", "Community"]
    },
    {
        title: "Company",
        links: ["About Us", "Contact", "Partners", "Privacy Policy"]
    }
];

export default function Footer() {
    return (
        <footer className="relative z-10 border-t border-white/[0.05] bg-black pt-24 pb-12">
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-3 mb-6">
                            <DevOSLogo size={40} />
                            <span className="text-2xl font-black text-white tracking-widest uppercase italic">DEVOS</span>
                        </div>
                        <p className="text-sm leading-relaxed text-white/40 mb-8 max-w-xs">
                            The elite developer operating system for shipping production-ready SaaS in record time.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="h-10 w-10 flex items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.02] text-white/40 hover:text-white transition-all"
                                >
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {footerLinks.map((section) => (
                            <div key={section.title}>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/90 mb-6">
                                    {section.title}
                                </h4>
                                <ul className="space-y-4">
                                    {section.links.map((link) => (
                                        <li key={link}>
                                            <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/90 mb-6">
                            Ship Weekly
                        </h4>
                        <p className="text-sm text-white/40 mb-6">
                            Get curated templates and dev news in your inbox.
                        </p>
                        <form className="relative group">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-colors"
                            />
                            <button className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors">
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-white/20">
                        © 2026 Developer Intelligence Systems. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-white/20 hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="text-xs text-white/20 hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
