import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useSubscription } from "@/hooks/useSubscription";
import { subscribeToPlan } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, CreditCard, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const SubscriptionModal: React.FC = () => {
    const { user } = useUser();
    const { isModalOpen, hideSubscriptionModal, selectedPlan, refreshSubscription } = useSubscription();
    const [step, setStep] = useState<'confirm' | 'paying' | 'success'>('confirm');
    const [txnId, setTxnId] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            setStep('confirm');
        }
    }, [isModalOpen]);

    const handleSubscribe = async () => {
        if (!user?.id) return;

        setStep('paying');
        try {
            const result = await subscribeToPlan(user.id, selectedPlan);
            setTxnId(result.payment.transactionId);
            await refreshSubscription();
            setStep('success');
        } catch (error: any) {
            toast.error(error.message || "Subscription failed");
            setStep('confirm');
        }
    };

    const planLabel = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
    const price = selectedPlan === 'pro' ? '₹4,999' : selectedPlan === 'enterprise' ? 'Custom' : '₹0';

    return (
        <Dialog open={isModalOpen} onOpenChange={hideSubscriptionModal}>
            <DialogContent className="sm:max-w-[450px] bg-[#0A0A0B] border-white/10 text-white rounded-3xl overflow-hidden p-0">
                {step === 'confirm' && (
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-blue-400" />
                            </div>
                            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Confirm Upgrade</DialogTitle>
                            <DialogDescription className="text-white/40 font-medium pt-1">
                                You are upgrading to the <span className="text-white font-bold">{planLabel}</span> plan for {price}/month.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Plan Highlights</p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-white/70">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> {selectedPlan === 'pro' ? '10' : 'Unlimited'} Workspaces
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-white/70">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Full AI Strategy Reports
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-white/70">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Export PDF Capability
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <DialogFooter className="mt-6 flex-col sm:flex-col gap-3">
                            <Button
                                onClick={handleSubscribe}
                                className="w-full bg-white text-black hover:bg-zinc-200 font-black tracking-widest uppercase text-xs h-12 rounded-xl"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Proceed to Payment
                            </Button>
                            <Button
                                onClick={hideSubscriptionModal}
                                variant="ghost"
                                className="w-full text-white/40 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'paying' && (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black italic tracking-tighter uppercase">Processing Payment</h3>
                            <p className="text-sm text-white/40 font-medium">Securing your climate intelligence subscription...</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="p-8">
                        <div className="mb-8 flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Plan Activated!</h3>
                                <p className="text-sm text-white/40 font-medium">Welcome to ClimX-X <span className="text-white font-bold">{planLabel}</span></p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 mb-8">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/30 uppercase font-black tracking-widest">Transaction ID</span>
                                <span className="text-white/70 font-mono tracking-tighter">{txnId}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/30 uppercase font-black tracking-widest">Amount</span>
                                <span className="text-white font-bold">{price}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/30 uppercase font-black tracking-widest">Status</span>
                                <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black">SUCCESS</Badge>
                            </div>
                        </div>

                        <Button
                            onClick={hideSubscriptionModal}
                            className="w-full bg-blue-600 text-white hover:bg-blue-500 font-black tracking-widest uppercase text-xs h-12 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
