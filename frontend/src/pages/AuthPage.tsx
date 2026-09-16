import React, { useState } from "react";
import { SignInButton, SignUpButton, useClerk, ClerkLoaded } from "@clerk/clerk-react";
import { Zap, ShieldCheck, Loader2 } from "lucide-react";
import AnoAI from "@/components/ui/animated-shader-background";
import { isElectronApp, startElectronGoogleAuth } from "@/lib/electronAuth";

function ElectronAuthButtons() {
  const clerk = useClerk();
  const [loadingMode, setLoadingMode] = useState<"sign-in" | "sign-up" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (mode: "sign-in" | "sign-up") => {
    setLoadingMode(mode);
    setError(null);

    try {
      await startElectronGoogleAuth(clerk, mode);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => handleAuth("sign-in")}
        disabled={!!loadingMode}
        className="h-16 w-full rounded-2xl bg-indigo-600 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:bg-indigo-500 shadow-[0_20px_60px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 disabled:opacity-60 disabled:hover:scale-100"
      >
        {loadingMode === "sign-in" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Opening browser…
          </>
        ) : (
          <>
            Log In
            <Zap size={14} fill="currentColor" />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleAuth("sign-up")}
        disabled={!!loadingMode}
        className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-60"
      >
        {loadingMode === "sign-up" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Opening browser…
          </span>
        ) : (
          "Sign Up"
        )}
      </button>

      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
        Google sign-in opens in your default browser
      </p>

      {error && (
        <p className="text-xs text-red-400/90 font-medium">{error}</p>
      )}
    </div>
  );
}

export default function AuthPage() {
  const isDesktop = isElectronApp();

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <AnoAI />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-md w-full px-8 text-center">
        {/* Glow Logo */}
        <div className="mx-auto mb-8 w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.4)] relative">
           <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H11C15.4183 4 19 7.58172 19 12C19 16.4183 15.4183 20 11 20H4V4Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
           </svg>
           <div className="absolute -inset-1 bg-white/10 blur-xl rounded-full" />
        </div>

        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
          AUTHENTICATE <span className="text-indigo-500 text-2xl">SYSTEM</span>
        </h1>
        <p className="text-white/40 text-sm font-bold uppercase tracking-[0.4em] mb-12">
          Identity Verification Required
        </p>

        {isDesktop ? (
          <ClerkLoaded>
            <ElectronAuthButtons />
          </ClerkLoaded>
        ) : (
          <div className="flex flex-col gap-4">
            <SignInButton mode="modal">
              <button className="h-16 w-full rounded-2xl bg-indigo-600 px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] hover:bg-indigo-500 shadow-[0_20px_60px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3">
                Log In
                <Zap size={14} fill="currentColor" />
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="h-16 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-10 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 opacity-30 text-[9px] font-black tracking-widest uppercase italic">
          <ShieldCheck size={12} />
          Secured via Clerk Neural Network
        </div>
      </div>

      {/* Aesthetic Frame */}
      <div className="absolute inset-0 border border-white/5 pointer-events-none m-6 rounded-[3rem]" />
    </div>
  );
}
