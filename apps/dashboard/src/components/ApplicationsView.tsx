'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import {
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Key,
  Globe,
  Server,
  ArrowRight,
  Info,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export function ApplicationsView() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [authServerUrl, setAuthServerUrl] = useState('http://localhost:4000');
  const [redirectUri, setRedirectUri] = useState('http://localhost:5000/auth/callback');
  const [status, setStatus] = useState('DEVELOPMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await api.getApps();
      if (res.success) setApps(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let cleanAuthServer = authServerUrl.trim();
      if (!cleanAuthServer.startsWith('http://') && !cleanAuthServer.startsWith('https://')) {
        cleanAuthServer = `http://${cleanAuthServer}`;
      }

      let cleanRedirect = redirectUri.trim();
      if (!cleanRedirect.startsWith('http://') && !cleanRedirect.startsWith('https://')) {
        cleanRedirect = `http://${cleanRedirect}`;
      }

      const res = await api.createApp({
        name: name.trim(),
        auth_server_url: cleanAuthServer,
        redirect_uris: [cleanRedirect],
        status,
      });

      if (res.success) {
        setShowCreateModal(false);
        setName('');
        setAuthServerUrl('http://localhost:4000');
        setRedirectUri('http://localhost:5000/auth/callback');
        setStatus('DEVELOPMENT');
        setShowSecretModal(res.data);
        loadApps();
      } else {
        const errorMsg =
          res.error?.message ||
          (typeof res.error === 'string'
            ? res.error
            : typeof res.error === 'object'
            ? Object.entries(res.error)
                .map(([k, v]: any) => `${k}: ${v?._errors?.join(', ') || JSON.stringify(v)}`)
                .join('; ')
            : 'Failed to create application.');
        setFormError(errorMsg);
      }
    } catch (e: any) {
      setFormError(e.message || 'Network error while creating application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRotateSecret = async (id: string) => {
    if (!confirm('Are you sure you want to rotate the Client Secret? The previous secret will immediately stop working.')) {
      return;
    }

    try {
      const res = await api.rotateSecret(id);
      if (res.success) {
        setShowSecretModal(res.data);
      } else {
        alert(res.error || 'Failed to rotate secret');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to rotate secret');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application? All associated sessions will be terminated.')) {
      return;
    }
    try {
      const res = await api.deleteApp(id);
      if (res.success) {
        loadApps();
      } else {
        alert(res.error || 'Failed to delete application');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete application');
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Applications</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage your OAuth 2.0 client applications, server endpoints, and callback redirect URIs.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm shadow-lg shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading applications...</div>
      ) : apps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1f293d]">
          <Key className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Applications Registered</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Create an application to generate OAuth credentials and integrate WhatsApp authentication into your website or mobile app.
          </p>
          <button
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-dark-bg font-bold text-sm cursor-pointer hover:bg-brand-500 transition-all"
          >
            Create Your First Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{app.name}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {app.id}</div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      app.status === 'PRODUCTION'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : app.status === 'DEVELOPMENT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="space-y-3 bg-[#0d131f] p-4 rounded-xl border border-[#1f293d] mb-4">
                  {/* Client ID */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                      <span>CLIENT ID</span>
                      <button
                        onClick={() => copyText(`cid_${app.id}`, app.clientId)}
                        className="text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === `cid_${app.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedField === `cid_${app.id}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-white bg-[#090d16] p-2 rounded border border-slate-800 break-all select-all">
                      {app.clientId}
                    </div>
                  </div>

                  {/* Auth Server URL */}
                  <div>
                    <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-cyan-400" />
                      <span>AUTH SERVER URL</span>
                    </div>
                    <div className="font-mono text-xs text-cyan-300 bg-[#090d16] p-2 rounded border border-slate-800 break-all">
                      {app.authServerUrl || 'http://localhost:4000'}
                    </div>
                  </div>

                  {/* Redirect URL */}
                  <div>
                    <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-brand-400" />
                      <span>REDIRECT URL</span>
                    </div>
                    <div className="space-y-1">
                      {app.redirectUris.map((uri: string, idx: number) => (
                        <div key={idx} className="font-mono text-xs text-emerald-300 bg-[#090d16] p-2 rounded border border-slate-800 break-all">
                          {uri}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* URL Flow Explanation */}
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                    <p className="mb-1 text-slate-300">
                      💡 <strong>Auth Server URL</strong> is where the WhatsApp continuation link connects.
                    </p>
                    <p className="text-slate-300">
                      ↪ <strong>Redirect URL</strong> is where the user returns with the authorization code.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1f293d]">
                <button
                  onClick={() => handleRotateSecret(app.id)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate Secret</span>
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8">
            <h3 className="text-xl font-bold text-white mb-1">Create Application</h3>
            <p className="text-slate-400 text-xs mb-4">
              Register a new client application to obtain API credentials and configure endpoints.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-5">
              {/* 1. Application Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  placeholder="e.g. My Website"
                />
              </div>

              {/* 2. Auth Server URL */}
              <div className="bg-[#090d16] p-4 rounded-xl border border-[#1f293d]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-cyan-400 uppercase">
                    1. Auth Server URL
                  </label>
                  <span className="text-[11px] text-cyan-300/70 font-mono">Public Endpoint</span>
                </div>
                <input
                  type="text"
                  required
                  value={authServerUrl}
                  onChange={(e) => setAuthServerUrl(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-lg px-3.5 py-2 text-cyan-300 text-xs font-mono focus:border-cyan-500 outline-none mb-2"
                  placeholder="https://abc123.trycloudflare.com"
                />
                <div className="text-[11.5px] text-slate-400 space-y-1.5 leading-relaxed bg-[#111827]/80 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-300">
                    ℹ️ <strong>Enter the public URL of your WhatsApp Auth Server.</strong>
                  </p>
                  <p>
                    For local testing, your Auth Server may be running on port 4000: <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">http://localhost:4000</code>
                  </p>
                  <p>
                    If your website is hosted online but your Auth Server is running on your computer, expose port 4000 using a tunnel (such as Cloudflare Tunnel) and enter the public HTTPS URL here.
                  </p>
                  <div className="font-mono text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="text-slate-500">Local Auth Server:</span> http://localhost:4000<br />
                    <span className="text-slate-500">Public tunnel:</span> https://abc123.trycloudflare.com<br />
                    <span className="text-cyan-400 font-semibold">Use:</span> https://abc123.trycloudflare.com
                  </div>
                </div>
              </div>

              {/* 3. Redirect URL */}
              <div className="bg-[#090d16] p-4 rounded-xl border border-[#1f293d]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-emerald-400 uppercase">
                    2. Redirect URL
                  </label>
                  <span className="text-[11px] text-emerald-300/70 font-mono">Website Callback</span>
                </div>
                <input
                  type="text"
                  required
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-lg px-3.5 py-2 text-emerald-300 text-xs font-mono focus:border-emerald-500 outline-none mb-2"
                  placeholder="https://standalone-example-app.vercel.app/auth/callback"
                />
                <div className="text-[11.5px] text-slate-400 space-y-1.5 leading-relaxed bg-[#111827]/80 p-3 rounded-lg border border-slate-800">
                  <p className="text-slate-300">
                    ℹ️ <strong>Enter the public callback URL of your website.</strong>
                  </p>
                  <p>
                    After WhatsApp authentication completes, the Auth Server will redirect the user back to this URL with the authorization code.
                  </p>
                  <div className="font-mono text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="text-slate-500">Website:</span> https://standalone-example-app.vercel.app<br />
                    <span className="text-slate-500">Callback:</span> /auth/callback<br />
                    <span className="text-emerald-400 font-semibold">Enter:</span> https://standalone-example-app.vercel.app/auth/callback
                  </div>
                </div>
              </div>

              {/* 4. Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Environment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl px-4 py-2 text-white text-sm focus:border-brand-500 outline-none"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Application...</span>
                    </>
                  ) : (
                    <span>Create Application</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Display Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111827] border border-brand-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Application Created Successfully</h3>
                <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Save your Client Secret now. It will NEVER be displayed again.
                </p>
              </div>
            </div>

            <div className="bg-[#0d131f] border border-[#1f293d] rounded-xl p-4 space-y-3 mb-6">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold mb-1">
                  <span>Client ID</span>
                  <button
                    onClick={() => copyText('new_cid', showSecretModal.clientId)}
                    className="text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'new_cid' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'new_cid' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-brand-300 font-bold select-all bg-[#090d16] p-2 rounded border border-slate-800 break-all">
                  {showSecretModal.clientId}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold mb-1">
                  <span>Client Secret</span>
                  <button
                    onClick={() => copyText('new_sec', showSecretModal.clientSecret)}
                    className="text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'new_sec' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'new_sec' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-amber-300 bg-[#090d16] p-2.5 rounded border border-slate-800 break-all select-all">
                  {showSecretModal.clientSecret}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400">Auth Server URL:</span>
                  <div className="text-cyan-300 font-mono truncate">{showSecretModal.authServerUrl || 'http://localhost:4000'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Redirect URL:</span>
                  <div className="text-emerald-300 font-mono truncate">{showSecretModal.redirectUris?.[0]}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-[#111827] p-2.5 rounded-lg border border-slate-800/80">
                Your <strong>Auth Server URL</strong> is used to generate the secure WhatsApp continuation link. Your <strong>Redirect URL</strong> is where the user returns after authentication.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSecretModal(null)}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm cursor-pointer"
              >
                I have securely saved my secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
