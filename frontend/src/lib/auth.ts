import { useUser as useClerkUser } from "@clerk/clerk-react";
import { isDemoMode } from "./api";

export const DEMO_USER = {
  id: "demo-user",
  fullName: "Demo Recruiter",
  firstName: "Demo",
  lastName: "Recruiter",
  primaryEmailAddress: { emailAddress: "recruiter@demo.devos" },
  imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
};

export function useAuthUser() {
  if (isDemoMode()) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: DEMO_USER,
      isDemo: true,
    };
  }
  
  try {
    const clerk = useClerkUser();
    if (!clerk.user) {
      return {
        isLoaded: clerk.isLoaded,
        isSignedIn: false,
        user: DEMO_USER,
        isDemo: false,
      };
    }
    return {
      isLoaded: clerk.isLoaded,
      isSignedIn: clerk.isSignedIn,
      user: clerk.user,
      isDemo: false,
    };
  } catch {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: DEMO_USER,
      isDemo: true,
    };
  }
}
