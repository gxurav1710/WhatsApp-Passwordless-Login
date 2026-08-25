'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { useWhatsAppStatus } from '../context/WhatsAppStatusContext';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Sparkles,
  Copy,
  Check,
  LogOut,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface SetupWizardProps {
  onComplete: () => void;
  onNavigateToSandbox: () => void;
}

export function SetupWizard({ onComplete, onNavigateToSandbox }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState('My First Web App');
  const [authServerUrl, setAuthServerUrl] = useState('http://localhost:4000');
  const [redirectUri, setRedirectUri] = useState('http://localhost:5000/auth/callback');
  const [createdApp, setCreatedApp] = useState<any>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);

  const {
    data: waStatus,
    isConnected,
    phoneNumber,
    qrCode: qrString,
    pairing,
    loggingOut,
    startPairing,
    logout,
  } = useWhatsAppStatus();

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateApp = async () => {
    setLoading(true);
    setCreateError(null);
    try {
      const cleanName = appName.trim();
      let cleanAuthServer = authServerUrl.trim();
      if (!cleanAuthServer.startsWith('http://') && !cleanAuthServer.startsWith('https://')) {
        cleanAuthServer = `http://${cleanAuthServer}`;
      }

      let cleanUri = redirectUri.trim();
      if (!cleanUri.startsWith('http://') && !cleanUri.startsWith('https://')) {
        cleanUri = `http://${cleanUri}`;
      }

      const res = await api.createApp({
        name: cleanName,
        auth_server_url: cleanAuthServer,
        redirect_uris: [cleanUri],
        status: 'DEVELOPMENT',
      });

      if (res.success) {
        setCreatedApp(res.data);
        setStep(4);
      } else {
        const msg = res.error?.message || (res.error ? JSON.stringify(res.error) : 'Failed to create application.');
        setCreateError(msg);
      }
    } catch (e: any) {
      setCreateError(e.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const isDataUrl = qrString && typeof qrString === 'string' && qrString.startsWith('data:image');

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Wizard Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> First-Run Onboarding
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">System Setup Wizard</h2>
        <p className="text-slate-400 text-sm mt-1">
          Follow this guided checklist to configure your self-hosted WhatsApp authentication server and create your first application.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { num: 1, title: 'System & DB' },
          { num: 2, title: 'WhatsApp Link' },
          { num: 3, title: 'Create App' },
          { num: 4, title: 'Ready to Test' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              step === s.num
                ? 'bg-brand-600/10 border-brand-500 text-brand-300'
                : step > s.num
                ? 'bg-[#111827] border-slate-700 text-emerald-400'
                : 'bg-[#111827]/40 border-[#1f293d] text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/10">
                {step > s.num ? '✓' : s.num}
              </span>
              <span className="font-semibold text-xs uppercase tracking-wider">Step {s.num}</span>
            </div>
            <div className="font-medium text-sm text-white">{s.title}</div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-8 shadow-xl">
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Step 1: System & Database Health</h3>
            <p className="text-slate-400 text-sm mb-6">
              Checking local connectivity to the Auth Core API and PostgreSQL database.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d131f] border border-[#1f293d]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white text-sm">Auth API Core</div>
                    <div className="text-xs text-slate-400">Fastify Server listening on port 4000</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HEALTHY
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d131f] border border-[#1f293d]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white text-sm">Database (PostgreSQL)</div>
                    <div className="text-xs text-slate-400">Prisma schema synchronized with tables</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  CONNECTED
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm transition-all"
              >
                <span>Continue to WhatsApp Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Step 2: WhatsApp Worker Pairing</h3>
            <p className="text-slate-400 text-sm mb-6">
              Connect your WhatsApp account to send authentication reply links to your users.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1f293d] flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Mode</div>
                  <div className="text-lg font-bold text-brand-400 mb-1">
                    {waStatus?.adapterMode === 'mock' ? 'Mock Simulator Mode' : 'Real WhatsApp (Baileys WebSocket)'}
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {isConnected
                      ? 'WhatsApp is paired and active! Authentication challenge codes and login links will be handled by this number.'
                      : 'Scan the live QR code with your phone (WhatsApp → Settings → Linked Devices → Link a Device).'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    ></span>
                    <span className="text-sm font-semibold text-white">
                      Status: {isConnected ? (phoneNumber ? `CONNECTED (${phoneNumber})` : 'CONNECTED') : 'AWAITING PAIRING'}
                    </span>
                  </div>

                  {isConnected && (
                    <button
                      onClick={logout}
                      disabled={loggingOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{loggingOut ? 'Disconnecting...' : 'Logout / Disconnect Device'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#0d131f] border border-[#1f293d] min-h-[220px]">
                {isConnected ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-2 font-bold text-2xl">
                      ✓
                    </div>
                    <div className="font-bold text-white text-sm">WhatsApp Linked Successfully!</div>
                    <div className="text-xs text-brand-400 font-mono mt-1">{phoneNumber}</div>
                    <div className="text-[11px] text-slate-400 mt-2">Ready to verify incoming challenges</div>
                  </div>
                ) : qrString ? (
                  <div className="text-center">
                    <div className="p-2.5 bg-white rounded-xl shadow-xl inline-block mb-2 border-2 border-brand-500/30">
                      {isDataUrl ? (
                        <img src={qrString} alt="WhatsApp QR Code" className="w-40 h-40" />
                      ) : (
                        <QRCodeSVG value={qrString} size={160} level="H" includeMargin={false} />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Auto-refreshes on expiry (~{secondsRemaining}s)
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs space-y-3">
                    <QrCode className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
                    <div>WhatsApp is standing by...</div>
                    <button
                      onClick={() => startPairing(true)}
                      disabled={pairing}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-xs transition-all shadow-md"
                    >
                      {pairing ? 'Opening Chrome...' : 'Open WhatsApp Web Window'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm transition-all"
              >
                <span>Continue to Create Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Step 3: Create Your First Application</h3>
            <p className="text-slate-400 text-sm mb-6">
              Register your website or backend app to generate OAuth 2.0 Client Credentials.
            </p>

            {createError && (
              <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  placeholder="e.g. My Next.js Web App"
                />
              </div>

              <div className="bg-[#090d16] p-4 rounded-xl border border-[#1f293d]">
                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  1. Auth Server URL
                </label>
                <input
                  type="text"
                  value={authServerUrl}
                  onChange={(e) => setAuthServerUrl(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl px-3.5 py-2 text-cyan-300 text-xs focus:border-cyan-500 outline-none font-mono mb-1.5"
                  placeholder="https://abc123.trycloudflare.com"
                />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Public URL where your WhatsApp Auth Server can be reached (e.g. <code className="text-cyan-300">http://localhost:4000</code> or Cloudflare Tunnel).
                </div>
              </div>

              <div className="bg-[#090d16] p-4 rounded-xl border border-[#1f293d]">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  2. Redirect URL
                </label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl px-3.5 py-2 text-emerald-300 text-xs focus:border-emerald-500 outline-none font-mono mb-1.5"
                  placeholder="https://standalone-example-app.vercel.app/auth/callback"
                />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Public callback URL of your website where users return after authentication.
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleCreateApp}
                disabled={loading || !appName.trim() || !redirectUri.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-dark-bg font-bold text-sm transition-all cursor-pointer"
              >
                {loading ? 'Creating...' : 'Create Application & Generate Credentials'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && createdApp && (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold text-2xl">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Application Created!</h3>
              <p className="text-slate-400 text-sm">
                Save your credentials. The Client Secret is only displayed once.
              </p>
            </div>

            <div className="bg-[#0d131f] border border-[#1f293d] rounded-xl p-5 space-y-4 mb-8">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Application Name</span>
                <div className="text-white text-sm font-semibold mt-0.5">
                  {createdApp.name}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Client ID</span>
                <div className="font-mono text-sm text-brand-300 font-bold mt-0.5 select-all">
                  {createdApp.clientId}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Client Secret</span>
                  <button
                    onClick={() => copyToClipboard(createdApp.clientSecret)}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'Copied!' : 'Copy Secret'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#090d16] border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                  {createdApp.clientSecret}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Auth Server URL:</span>
                  <div className="text-cyan-300 font-mono truncate">{createdApp.authServerUrl || 'http://localhost:4000'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Redirect URL:</span>
                  <div className="text-emerald-300 font-mono truncate">{createdApp.redirectUris?.[0]}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={onComplete}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
              >
                Go to Dashboard
              </button>
              <button
                onClick={onNavigateToSandbox}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm shadow-lg shadow-brand-600/25 transition-all"
              >
                <span>Launch Interactive Sandbox Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
