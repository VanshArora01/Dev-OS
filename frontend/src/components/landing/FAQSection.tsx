import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
    {
        question: "How does session tracking work?",
        answer: "DevOS allows you to log work sessions with summaries, durations, and next steps. Your focus history is stored in a clean, cronological timeline per project."
    },
    {
        question: "Who is DevOS for?",
        answer: "DevOS is built specifically for students, freelancers, and software engineers who need to maintain mental continuity across multiple active projects."
    },
    {
        question: "What are Micro-Tasks?",
        answer: "Micro-Tasks are immediate, actionable items for your project. We limit you to 5 active tasks to prevent backlog overwhelm and keep you focused on the absolute next steps."
    },
    {
        question: "How does it stop context loss?",
        answer: "By requiring a 'Next Plan' at the end of every session, DevOS ensures you never start a workday wondering where you left off. You resume with a clear intention every single time."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="relative z-10 px-6 py-32 md:px-12 bg-black text-white">
            <div className="mx-auto max-w-3xl">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl uppercase italic px-4">
                        Developer Continuity FAQ
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="flex w-full items-center justify-between px-8 py-6 text-left"
                            >
                                <span className="font-bold text-white uppercase tracking-widest text-sm">{faq.question}</span>
                                {openIndex === i ? (
                                    <Minus className="h-4 w-4 text-white/40" />
                                ) : (
                                    <Plus className="h-4 w-4 text-white/40" />
                                )}
                            </button>
                            <motion.div
                                initial={false}
                                animate={{ height: openIndex === i ? "auto" : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-8 pb-6 text-sm leading-relaxed text-white/40 font-medium italic">
                                    {faq.answer}
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
