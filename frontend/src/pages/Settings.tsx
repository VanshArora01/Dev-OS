import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Smartphone, Globe, HardDrive, Loader2, CheckCircle2, XCircle, Github } from 'lucide-react';
import { disconnectGoogleDrive, getGoogleDriveConnectUrl, getGoogleDriveStatus, disconnectGithub, getGithubConnectUrl, getGithubStatus } from '@/lib/api';
import { isElectronApp } from '@/lib/electronAuth';
import { BentoCard } from '@/components/ui/bento-card';
import { ListRow } from '@/components/ui/list-row';
import { IconChip } from '@/components/ui/icon-chip';
import { useOnboarding } from '@/context/OnboardingContext';

export default function Settings() {
  const { user } = useUser();
  const { startTour, resetTours } = useOnboarding();
  const [searchParams, setSearchParams] = useSearchParams();
  const [driveStatus, setDriveStatus] = useState<{
    connected: boolean;
    accountEmail?: string | null;
    status?: string;
  } | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveActionLoading, setDriveActionLoading] = useState(false);
  const [driveMessage, setDriveMessage] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<{
    connected: boolean;
    username?: string | null;
    avatarUrl?: string | null;
    repositoryCount?: number | null;
    status?: string;
    needsInstall?: boolean;
  } | null>(null);
  const [githubLoading, setGithubLoading] = useState(true);
  const [githubActionLoading, setGithubActionLoading] = useState(false);
  const [githubMessage, setGithubMessage] = useState<string | null>(null);

  const sections = [
    {
      title: 'Account Information',
      items: [
        { label: 'Display Name', value: user?.fullName || 'Not set', icon: User },
        { label: 'Primary Email', value: user?.primaryEmailAddress?.emailAddress || 'Not set', icon: Mail },
      ]
    },
    {
      title: 'Platform Preferences',
      items: [
        { label: 'Theme', value: 'Light / Dark (system)', icon: Shield },
        { label: 'UI Font', value: 'Inter + Space Grotesk', icon: Smartphone },
        { label: 'Language', value: 'English (US)', icon: Globe },
      ]
    }
  ];

  const loadDriveStatus = async () => {
    if (!user?.id) return;
    setDriveLoading(true);
    try {
      const status = await getGoogleDriveStatus(user.id);
      setDriveStatus(status);
    } catch (error: any) {
      setDriveMessage(error.message || 'Failed to load Google Drive status.');
    } finally {
      setDriveLoading(false);
    }
  };

  const loadGithubStatus = async () => {
    if (!user?.id) return;
    setGithubLoading(true);
    try {
      const status = await getGithubStatus(user.id);
      setGithubStatus(status);
    } catch (error: any) {
      setGithubMessage(error.message || 'Failed to load GitHub status.');
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    loadDriveStatus();
    loadGithubStatus();
  }, [user?.id]);

  useEffect(() => {
    const connected = searchParams.get('drive_connected');
    const error = searchParams.get('drive_error');
    if (connected) {
      setDriveMessage('Google Drive connected successfully.');
      setSearchParams({}, { replace: true });
      loadDriveStatus();
    }
    if (error) {
      setDriveMessage(decodeURIComponent(error));
      setSearchParams({}, { replace: true });
    }
    const githubConnected = searchParams.get('github_connected');
    const githubError = searchParams.get('github_error');
    const githubNeedsInstall = searchParams.get('github_needs_install');
    if (githubConnected) {
      setGithubMessage(githubNeedsInstall
        ? 'GitHub authorized. Install the DevOS GitHub App if repositories do not appear.'
        : 'GitHub connected successfully.');
      setSearchParams({}, { replace: true });
      loadGithubStatus();
    }
    if (githubError) {
      setGithubMessage(decodeURIComponent(githubError));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleConnectDrive = async () => {
    if (!user?.id) return;
    setDriveActionLoading(true);
    try {
      const { connectUrl } = await getGoogleDriveConnectUrl(user.id);
      window.location.href = connectUrl;
    } catch (error: any) {
      setDriveMessage(error.message || 'Failed to start Google Drive connection.');
      setDriveActionLoading(false);
    }
  };

  const handleConnectGithub = async () => {
    if (!user?.id) return;
    setGithubActionLoading(true);
    try {
      const { connectUrl } = await getGithubConnectUrl(user.id);
      if (isElectronApp() && window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(connectUrl);
        for (let i = 0; i < 45; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const status = await getGithubStatus(user.id);
          if (status.connected) {
            setGithubStatus(status);
            setGithubMessage('GitHub connected successfully.');
            break;
          }
        }
        setGithubActionLoading(false);
        await loadGithubStatus();
        return;
      }
      window.location.href = connectUrl;
    } catch (error: any) {
      setGithubMessage(error.message || 'Failed to start GitHub connection.');
      setGithubActionLoading(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!user?.id) return;
    setGithubActionLoading(true);
    try {
      await disconnectGithub(user.id);
      setGithubMessage('GitHub disconnected.');
      await loadGithubStatus();
    } catch (error: any) {
      setGithubMessage(error.message || 'Failed to disconnect GitHub.');
    } finally {
      setGithubActionLoading(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (!user?.id) return;
    setDriveActionLoading(true);
    try {
      await disconnectGoogleDrive(user.id);
      setDriveMessage('Google Drive disconnected.');
      await loadDriveStatus();
    } catch (error: any) {
      setDriveMessage(error.message || 'Failed to disconnect Google Drive.');
    } finally {
      setDriveActionLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div>
        <p className="eyebrow mb-1">Settings</p>
        <h1 className="page-title">Workspace settings</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Manage your DevOS account and integrations
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Integrations</h2>
        <div data-tour="settings-drive-card">
          <BentoCard variant={driveStatus?.connected ? "filled" : "neutral"} accent="violet">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">Google Drive & Gmail</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Neural AI file access & email automation
                  </p>
                  {driveLoading ? (
                    <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking connection...
                    </div>
                  ) : driveStatus?.connected ? (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Connected
                      </div>
                      <p className="text-sm text-slate-500">{driveStatus.accountEmail}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {driveStatus?.connected ? (
                  <>
                    <button
                      onClick={handleConnectDrive}
                      disabled={driveActionLoading}
                      className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white text-sm font-semibold hover:bg-slate-200 disabled:opacity-50"
                    >
                      Reconnect
                    </button>
                    <button
                      onClick={handleDisconnectDrive}
                      disabled={driveActionLoading}
                      className="px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm font-semibold disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectDrive}
                    disabled={driveActionLoading || driveLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {driveActionLoading ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
            {driveMessage && (
              <p className="mt-4 text-sm text-slate-500 border-t border-slate-100 dark:border-white/[0.06] pt-4">{driveMessage}</p>
            )}
          </BentoCard>
        </div>

        <div data-tour="settings-github-card">
          <BentoCard variant={githubStatus?.connected ? "filled" : "neutral"} accent="indigo">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-white">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">GitHub</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Codebase, commits, PRs, and Neural intelligence
                  </p>
                  {githubLoading ? (
                    <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking connection...
                    </div>
                  ) : githubStatus?.connected ? (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Connected
                      </div>
                      <p className="text-sm text-slate-500">
                        {githubStatus.username}
                        {typeof githubStatus.repositoryCount === 'number' ? ` · ${githubStatus.repositoryCount} repos` : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-3 text-slate-400 text-sm">
                      <XCircle className="w-4 h-4" />
                      Not connected
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {githubStatus?.connected ? (
                  <>
                    <button
                      onClick={handleConnectGithub}
                      disabled={githubActionLoading}
                      className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-white text-sm font-semibold hover:bg-slate-200 disabled:opacity-50"
                    >
                      Reconnect
                    </button>
                    <button
                      onClick={handleDisconnectGithub}
                      disabled={githubActionLoading}
                      className="px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm font-semibold disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnectGithub}
                    disabled={githubActionLoading || githubLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {githubActionLoading ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
            {githubMessage && (
              <p className="mt-4 text-sm text-slate-500 border-t border-slate-100 dark:border-white/[0.06] pt-4">{githubMessage}</p>
            )}
          </BentoCard>
        </div>
      </motion.div>

        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="space-y-3"
          >
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">{section.title}</h2>
            <div className="grid grid-cols-1 gap-3">
              {section.items.map((item) => (
                <BentoCard key={item.label}>
                  <ListRow
                    leading={<IconChip icon={item.icon} accent="violet" size="sm" />}
                    title={item.value}
                    subtitle={item.label}
                  />
                </BentoCard>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Product Walkthrough Restart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]"
        >
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Product Walkthrough</h2>
          <BentoCard variant="neutral">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">Replay Onboarding Tour</p>
                <p className="text-xs text-slate-400 mt-1">
                  Restart the interactive guided tour for DevOS features and workspace controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetTours();
                  startTour('dashboard', true);
                }}
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md"
              >
                Restart Walkthrough
              </button>
            </div>
          </BentoCard>
        </motion.div>
    </div>
  );
}
