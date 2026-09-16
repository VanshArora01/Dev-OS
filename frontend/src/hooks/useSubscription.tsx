import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { getSubscriptionStatus as fetchSubStatus } from "@/lib/api";

interface SubscriptionContextType {
    subscription: any;
    isLoading: boolean;
    refreshSubscription: () => Promise<void>;
    showSubscriptionModal: (plan?: string) => void;
    hideSubscriptionModal: () => void;
    isModalOpen: boolean;
    selectedPlan: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [subscription, setSubscription] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('pro');

    const refreshSubscription = async () => {
        if (!user?.id) return;
        try {
            const status = await fetchSubStatus(user.id);
            setSubscription(status);
        } catch (error) {
            console.error("Failed to refresh subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            refreshSubscription();
        } else {
            setIsLoading(false);
        }
    }, [user?.id]);

    const showSubscriptionModal = (plan: string = 'pro') => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const hideSubscriptionModal = () => {
        setIsModalOpen(false);
    };

    return (
        <SubscriptionContext.Provider value={{
            subscription,
            isLoading,
            refreshSubscription,
            showSubscriptionModal,
            hideSubscriptionModal,
            isModalOpen,
            selectedPlan
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
