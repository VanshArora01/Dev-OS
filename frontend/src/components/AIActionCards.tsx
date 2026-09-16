import { Download, ExternalLink, Mail } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { BentoCard } from "@/components/ui/bento-card";

export interface ActionCard {
  type: "download" | "drive" | "email";
  label: string;
  file_name?: string;
  download_url?: string;
  url?: string;
  success?: boolean;
}

export function AIActionCards({ cards }: { cards: ActionCard[] }) {
  if (!cards?.length) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {cards.map((card, i) => (
          <BentoCard key={i} variant={card.success === false ? "neutral" : "filled"} accent="emerald" className="!p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs flex items-center gap-1.5 ${card.success === false ? "text-slate-700 dark:text-zinc-200" : "text-white"}`}>
                <StatusPill kind={card.success === false ? "pending" : "completed"} />
                {card.label}
              </p>
              {card.file_name && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{card.file_name}</p>
              )}
            </div>
            {card.type === "download" && card.download_url && (
              <a href={card.download_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 shrink-0 inline-flex items-center gap-1">
                <Download size={13} />
                Download
              </a>
            )}
            {card.type === "drive" && card.url && (
              <a href={card.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-indigo-600 shrink-0 inline-flex items-center gap-1">
                <ExternalLink size={13} />
                Open
              </a>
            )}
            {card.type === "email" && (
              <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                <Mail size={13} />
                Sent
              </span>
            )}
          </BentoCard>
      ))}
    </div>
  );
}
