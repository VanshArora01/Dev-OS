import { motion } from "framer-motion";
import { ShieldAlert, Activity, IndianRupee, Cpu, TrendingUp } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useState, useEffect } from "react";
import { getStats } from "@/lib/api";
import { StatsData } from "@/lib/types";
import { LucideIcon } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const LiveIndicator = () => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_theme(colors.emerald.400)]" />
    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Live</span>
  </div>
);

const cardAccents = [
  {
    color: "indigo",
    borderColor: "border-indigo-100 dark:border-indigo-500/10",
    iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    glow: "shadow-indigo-500/5"
  },
  {
    color: "rose",
    borderColor: "border-rose-100 dark:border-rose-500/10",
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    glow: "shadow-rose-500/5"
  },
  {
    color: "amber",
    borderColor: "border-amber-100 dark:border-amber-500/10",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/5"
  },
  {
    color: "emerald",
    borderColor: "border-emerald-100 dark:border-emerald-500/10",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/5"
  },
];

export default function StatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const fetchStats = () => {
    if (userEmail) {
      getStats(userEmail).then(setStats).catch(console.error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (!stats) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />
      ))}
    </div>
  );

  const cards = [
    { label: "Projects Monitored", value: stats.projectsMonitored, icon: Activity, suffix: "", trend: stats.trends.projectsTrend },
    { label: "Risk Alerts", value: stats.riskAlerts, icon: ShieldAlert, suffix: "", trend: stats.trends.riskTrend },
    { label: "Expected Loss", value: stats.expectedAnnualLoss, icon: IndianRupee, suffix: "", isINR: true, trend: stats.trends.lossTrend },
    {
      label: "Active Nodes",
      value: stats.activeSimulations,
      icon: Cpu,
      suffix: "",
      trend: stats.trends.simulationsTrend,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} card={card} index={i} accent={cardAccents[i % cardAccents.length]} />
      ))}
    </div>
  );
}

function StatCard({
  card,
  index,
  accent,
}: {
  card: { label: string; value: number; icon: LucideIcon; suffix: string; isINR?: boolean; trend?: string };
  index: number;
  accent: any;
}) {
  const count = useAnimatedCounter(card.value, 1500);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative p-6 group overflow-hidden bg-white dark:bg-zinc-900 border ${accent.borderColor} rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 ${accent.glow}`}
    >
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className={`w-10 h-10 rounded-xl ${accent.iconBg} flex items-center justify-center transition-all duration-300`}>
          <card.icon className={`w-5 h-5 ${accent.iconColor}`} />
        </div>

        {card.trend && (
          <div className="flex items-center gap-2">
            {card.trend === 'Live' ? (
              <LiveIndicator />
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-tighter">{card.trend}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-1">
          <h4 className="text-2xl font-black dark:text-white text-slate-900 tracking-tight">
            {card.isINR ? formatINR(count) : count}
          </h4>
          <span className="text-xs font-bold text-slate-400 dark:text-zinc-600">{card.suffix}</span>
        </div>

        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
          {card.label}
        </p>
      </div>
    </motion.div>
  );
}
