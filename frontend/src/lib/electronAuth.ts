import type { useClerk } from "@clerk/clerk-react";

type ClerkInstance = ReturnType<typeof useClerk>;

export function isElectronApp(): boolean {
  return typeof window !== "undefined" && "electronAPI" in window;
}

function getOAuthRedirectUrl(
  clerk: ClerkInstance,
  mode: "sign-in" | "sign-up"
): string | null {
  if (mode === "sign-in") {
    const verification = clerk.client?.signIn?.firstFactorVerification;
    return verification?.externalVerificationRedirectURL?.toString() ?? null;
  }

  const externalAccount = clerk.client?.signUp?.verifications?.externalAccount;
  return externalAccount?.externalVerificationRedirectURL?.toString() ?? null;
}

async function completeOAuthFromCallback(clerk: ClerkInstance, callbackUrl: string) {
  if (!clerk.client) {
    throw new Error("Clerk client is not ready.");
  }

  const url = new URL(callbackUrl);
  const rotatingTokenNonce = url.searchParams.get("rotating_token_nonce") ?? undefined;

  if (rotatingTokenNonce) {
    await clerk.client.signIn.reload({ rotatingTokenNonce });
    const signIn = clerk.client.signIn;

    if (signIn.status === "complete" && signIn.createdSessionId) {
      await clerk.setActive({ session: signIn.createdSessionId });
      return;
    }

    await clerk.client.signUp.reload({ rotatingTokenNonce });
    const signUp = clerk.client.signUp;

    if (signUp.status === "complete" && signUp.createdSessionId) {
      await clerk.setActive({ session: signUp.createdSessionId });
      return;
    }
  }

  const hashPath = window.location.hash.split("?")[0] || "#/";
  const query = url.search;
  window.history.replaceState(null, "", `${window.location.pathname}${hashPath}${query}`);

  await clerk.handleRedirectCallback({
    reloadResource: "signIn",
  });

  const sessionId =
    clerk.client.signIn.createdSessionId || clerk.client.signUp.createdSessionId;

  if (sessionId) {
    await clerk.setActive({ session: sessionId });
    return;
  }

  throw new Error("Authentication did not complete. Please try again.");
}

export async function startElectronGoogleAuth(
  clerk: ClerkInstance,
  mode: "sign-in" | "sign-up"
) {
  if (!isElectronApp() || !window.electronAPI?.startOAuthCallback) {
    throw new Error("Electron authentication is only available in the desktop app.");
  }

  if (!clerk.loaded || !clerk.client) {
    throw new Error("Clerk is still loading. Please wait a moment and try again.");
  }

  let callbackUrl: string | undefined;

  try {
    const started = await window.electronAPI.startOAuthCallback();
    callbackUrl = started.callbackUrl;

    if (mode === "sign-in") {
      await clerk.client.signIn.create({
        strategy: "oauth_google",
        redirectUrl: callbackUrl,
        actionCompleteRedirectUrl: callbackUrl,
      });
    } else {
      await clerk.client.signUp.create({
        strategy: "oauth_google",
        redirectUrl: callbackUrl,
        actionCompleteRedirectUrl: callbackUrl,
      });
    }

    const oauthUrl = getOAuthRedirectUrl(clerk, mode);
    if (!oauthUrl) {
      throw new Error("Could not start Google authentication.");
    }

    await window.electronAPI.openExternal(oauthUrl);

    const { callbackUrl: resultUrl } = await window.electronAPI.waitForOAuthCallback();
    await completeOAuthFromCallback(clerk, resultUrl);
  } catch (error) {
    await window.electronAPI.cancelOAuth?.();
    throw error;
  }
}
