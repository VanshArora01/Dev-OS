import type { ReactNode } from "react";
import { BentoCard, type BentoVariant } from "@/components/ui/bento-card";
import type { Accent } from "@/lib/accents";

interface SurfaceCardProps {
    accent?: Accent;
    elevated?: boolean;
    variant?: BentoVariant;
    className?: string;
    children?: ReactNode;
}

export function SurfaceCard({ accent, variant = "neutral", className, children }: SurfaceCardProps) {
    return (
        <BentoCard variant={variant} accent={accent} className={className}>
            {children}
        </BentoCard>
    );
}
