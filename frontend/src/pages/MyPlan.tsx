import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CreditCard,
    Zap,
    ShieldCheck,
    Clock,
    ArrowUpCircle,
    XCircle,
    CheckCircle2,
    TrendingUp,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { cancelSubscription, subscribeToPlan } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export default function MyPlan() {
    const { user } = useUser();
    const { subscription, isLoading, refreshSubscription, showSubscriptionModal } = useSubscription();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancel = async () => {
        if (!user?.id) return;
        if (!confirm("Are you sure you want to cancel your subscription? You will lose access to pro features at the end of your billing period.")) return;

        setIsProcessing(true);
        try {
            await cancelSubscription(user.id);
            await refreshSubscription();
            toast.success("Subscription cancelled successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to cancel subscription");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReactivate = async () => {
        if (!user?.id || !subscription?.planName) return;

        setIsProcessing(true);
        try {
            await subscribeToPlan(user.id, subscription.planName);
            await refreshSubscription();
            toast.success("Subscription reactivated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to reactivate subscription");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDowngrade = async () => {
        if (!user?.id) return;
        if (!confirm("Are you sure you want to downgrade to the Starter plan?")) return;

        setIsProcessing(true);
        try {
            await subscribeToPlan(user.id, 'starter');
            await refreshSubscription();
            toast.success("Downgraded to Starter plan");
        } catch (error: any) {
            toast.error(error.message || "Failed to downgrade");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpgrade = () => {
        showSubscriptionModal('pro');
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const plan = subscription?.planName || 'starter';
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'enterprise';
    const isCancelled = subscription?.status === 'cancelled';

    const projectsUsed = subscription?.projectsUsed || 0;
    const projectLimit = subscription?.planDetails?.limits?.projects || 5;
    const projectsRemaining = projectLimit === Infinity ? 'Unlimited' : Math.max(0, projectLimit - projectsUsed);
    const projectsPercent = projectLimit === Infinity ? 0 : (projectsUsed / projectLimit) * 100;

    const evalsUsed = subscription?.evaluationsUsed || 0;
    const evalsLimit = subscription?.planDetails?.limits?.evaluations || 10;
    const evalsRemaining = evalsLimit === Infinity ? 'Unlimited' : Math.max(0, evalsLimit - evalsUsed);
    const evalsPercent = evalsLimit === Infinity ? 0 : (evalsUsed / evalsLimit) * 100;

    return (
        <div className="p-6 space-y-8 max-w-[1200px] mx-auto">
            <header className="space-y-2">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                    <CreditCard className="w-8 h-8" />
                    My Plan
                </h1>
                <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Manage your subscription and track your usage</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Current Plan Card */}
                    <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                        <CardHeader className="p-8 border-b border-white/5 relative">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Current Subscription
                                </CardTitle>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isCancelled ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>
                                    {isCancelled ? 'Pending Cancellation' : (subscription?.status || 'Active')}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 relative">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Plan</p>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                                        {plan}
                                        {(isPro || isEnterprise) && <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {isCancelled ? (
                                        <Button
                                            onClick={handleReactivate}
                                            disabled={isProcessing}
                                            className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs px-6 rounded-xl h-11"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Resume Subscription
                                        </Button>
                                    ) : (
                                        <>
                                            {!isPro && !isEnterprise && (
                                                <Button
                                                    onClick={handleUpgrade}
                                                    className="bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs px-6 rounded-xl h-11"
                                                >
                                                    <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade to Pro
                                                </Button>
                                            )}
                                            {isPro && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => showSubscriptionModal('enterprise')}
                                                    className="border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs px-6 rounded-xl h-11"
                                                >
                                                    <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade to Enterprise
                                                </Button>
                                            )}
                                            {(isPro || isEnterprise) && (
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleDowngrade}
                                                    disabled={isProcessing}
                                                    className="text-white/40 hover:text-white hover:bg-white/10 font-black uppercase tracking-widest text-[10px] rounded-xl h-11"
                                                >
                                                    Back to Starter
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {plan !== 'starter' && !isCancelled && (
                                        <Button
                                            variant="ghost"
                                            onClick={handleCancel}
                                            disabled={isProcessing}
                                            className="text-white/40 hover:text-rose-400 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] rounded-xl h-11"
                                        >
                                            {isProcessing ? "Processing..." : "Cancel Plan"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3 text-white/60">
                                    <Clock className="w-4 h-4" />
                                    <div className="text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-white/30 block mb-0.5">Billing Period Start</span>
                                        {subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-white/60">
                                    <Clock className="w-4 h-4" />
                                    <div className="text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-white/30 block mb-0.5">Next Renewal</span>
                                        {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage Statistics */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Usage Tracking
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UsageCard
                                title="Infrastructure Projects"
                                used={projectsUsed}
                                limit={projectLimit}
                                remaining={projectsRemaining}
                                percent={projectsPercent}
                                icon={TrendingUp}
                            />
                            <UsageCard
                                title="AI Evaluations"
                                used={evalsUsed}
                                limit={evalsLimit}
                                remaining={evalsRemaining}
                                percent={evalsPercent}
                                icon={Zap}
                            />
                        </div>
                    </div>
                </div>

                {/* Plan Benefits */}
                <div className="space-y-6">
                    <div className="glass-panel-strong p-8 rounded-3xl space-y-6 border-white/10">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Plan Benefits</h3>
                        <div className="space-y-4">
                            <BenefitItem text="Professional AI Risk Assessment" active={true} />
                            <BenefitItem text="Unlimited Data Export" active={isPro || isEnterprise} />
                            <BenefitItem text="Priority Cloud Processing" active={isPro || isEnterprise} />
                            <BenefitItem text="Custom Infrastructure Types" active={isPro || isEnterprise} />
                            <BenefitItem text="API Access (Production)" active={isPro || isEnterprise} />
                        </div>

                        {!isPro && !isEnterprise && (
                            <Button
                                onClick={handleUpgrade}
                                variant="outline"
                                className="w-full border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl"
                            >
                                View Pro Features
                            </Button>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-black" />
                            <p className="text-[10px] font-black text-black uppercase tracking-widest">Billing Support</p>
                        </div>
                        <p className="text-xs text-black/60 font-bold leading-relaxed">
                            Need help with your subscription or have questions about billing? Our team is available 24/7.
                        </p>
                        <Button className="w-full bg-black text-white hover:bg-black/80 font-black uppercase tracking-widest text-[10px] rounded-xl">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UsageCard({ title, used, limit, remaining, percent, icon: Icon }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
                <div className="p-2 bg-white/5 rounded-lg">
                    <Icon className="w-4 h-4 text-white/60" />
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Remaining</p>
                    <p className="text-lg font-black text-white tracking-tighter">{remaining}</p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{title}</p>
                <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase">
                    <span>{used} Used</span>
                    <span>{limit === Infinity ? '∞' : limit} Limit</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, percent)}%` }}
                        className={`h-full ${percent > 90 ? 'bg-rose-500' : 'bg-white'}`}
                    />
                </div>
            </div>
        </div>
    );
}

function BenefitItem({ text, active }: { text: string; active: boolean }) {
    return (
        <div className={`flex items-center gap-3 ${active ? 'text-white' : 'text-white/20'}`}>
            {active ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
                <XCircle className="w-4 h-4" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest">{text}</span>
        </div>
    );
}
