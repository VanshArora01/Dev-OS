import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel glow-border p-12 text-center max-w-md"
      >
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          Coming Soon
        </div>
      </motion.div>
    </div>
  );
}
