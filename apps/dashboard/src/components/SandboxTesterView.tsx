'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Key,
  ShieldCheck,
  Send,
} from 'lucide-react';

export function SandboxTesterView() {
  const [apps, setApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('user@example.com');
  const [phone, setPhone] = useState('+14155552671');
  const [loading, setLoading] = useState(false);

  // Flow State
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [simulatedReceived, setSimulatedReceived] = useState(false);
  const [loginLink, setLoginLink] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [exchangeResult, setExchangeResult] = useState<any>(null);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const res = await api.getApps();
      if (res.success && res.data.length > 0) {
        setApps(res.data);
        setSelectedAppId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  // Step 1: Initiate
  const handleInitiate = async () => {
    if (!selectedApp) return alert('Please select an application first');
    setLoading(true);
    try {
      const res = await api.initiateAuth({
        client_id: selectedApp.clientId,
        full_name: fullName,
        email: email,
        phone_number: phone,
        redirect_uri: selectedApp.redirectUris[0] || 'http://localhost:5000/auth/callback',
      });

      if (res.success) {
        setAttemptData(res.data);
        setStage(2);

        // Listen for live SSE updates
        if (res.data.sse_url) {
          const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${res.data.sse_url}`;
          const es = new EventSource(sseUrl);
          es.addEventListener('auth_update', (evt) => {
            const data = JSON.parse(evt.data);
            if (data.state === 'VERIFIED') {
              setSimulatedReceived(true);
            }
          });
        }
      }
    } catch (e: any) {
      alert(e.message || 'Initiation failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Simulate Message
  const handleSimulateMessage = async () => {
    if (!attemptData) return;
    setLoading(true);
    try {
      const res = await api.simulateMessage(phone, attemptData.challenge);
      if (res.success) {
        setSimulatedReceived(true);
        // Fetch recent logs to get the login token for continuation demonstration
        setTimeout(async () => {
          const logs = await api.getAuthLogs({ phoneNumber: phone });
          if (logs.success && logs.data.length > 0) {
            const latest = logs.data[0];
            setStage(3);
          }
        }, 500);
      }
    } catch (e: any) {
      alert('Simulation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStage(1);
    setAttemptData(null);
    setSimulatedReceived(false);
    setLoginLink('');
    setAuthCode('');
    setExchangeResult(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FlaskConical className="w-3.5 h-3.5" /> Interactive Integration Tester
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">End-to-End Auth Debugger</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Test and visually verify the complete 5-step passwordless WhatsApp authentication cycle.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1f293d] hover:bg-[#1e293b] text-slate-300 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Test Flow
        </button>
      </div>

      {/* Step Tracker Visual */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { num: 1, title: '1. Initiate Challenge' },
          { num: 2, title: '2. Send WhatsApp Msg' },
          { num: 3, title: '3. Challenge Verified' },
          { num: 4, title: '4. OAuth Code Exchange' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3.5 rounded-xl border transition-all ${
              stage >= s.num
                ? 'bg-brand-600/10 border-brand-500/50 text-brand-300'
                : 'bg-[#111827] border-[#1f293d] text-slate-500'
            }`}
          >
            <div className="text-xs font-bold uppercase">{s.title}</div>
          </div>
        ))}
      </div>

      {/* Interactive Testing Box */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 shadow-xl space-y-6">
        {/* Step 1 Form */}
        <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1f293d]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-dark-bg font-bold text-xs flex items-center justify-center">
                1
              </span>
              <span className="font-bold text-white text-sm">Step 1: Initiate Authentication</span>
            </div>
            {stage > 1 && <span className="text-xs font-semibold text-emerald-400">✓ COMPLETED</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Application</label>
              <select
                disabled={stage > 1}
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-medium focus:border-brand-500 outline-none"
              >
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Full Name</label>
              <input
                type="text"
                disabled={stage > 1}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:border-brand-500 outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                disabled={stage > 1}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:border-brand-500 outline-none"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Mobile Phone Number</label>
              <input
                type="text"
                disabled={stage > 1}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:border-brand-500 outline-none"
                placeholder="+14155552671"
              />
            </div>
          </div>

          {stage === 1 && (
            <button
              onClick={handleInitiate}
              disabled={loading || !selectedAppId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-xs transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Initiate Authentication</span>
            </button>
          )}

          {attemptData && (
            <div className="mt-3 p-3 rounded-lg bg-[#090d16] border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
              <div>
                <span className="text-slate-500">Attempt ID:</span> {attemptData.attempt_id}
              </div>
              <div>
                <span className="text-slate-500">Challenge:</span>{' '}
                <span className="text-amber-300 font-bold">{attemptData.challenge}</span>
              </div>
              <div>
                <span className="text-slate-500">WhatsApp Deep Link:</span>{' '}
                <a
                  href={attemptData.whatsapp_deep_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 underline"
                >
                  {attemptData.whatsapp_deep_link}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Message Simulation */}
        {stage >= 2 && (
          <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1f293d]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-dark-bg font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-white text-sm">Step 2: WhatsApp Inbound Message</span>
              </div>
              {stage > 2 && <span className="text-xs font-semibold text-emerald-400">✓ VERIFIED</span>}
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Simulate the user pressing SEND in WhatsApp with the pre-filled challenge{' '}
              <code className="text-amber-300 font-bold">{attemptData?.challenge}</code>.
            </p>

            {stage === 2 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSimulateMessage}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-xs transition-all shadow-lg shadow-brand-600/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simulate User Sending WhatsApp Message</span>
                </button>
                <span className="text-xs text-slate-500">or open the wa.me link with your phone</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verification & One-Time Link */}
        {stage >= 3 && (
          <div className="p-5 rounded-xl bg-[#0d131f] border border-[#1f293d]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-dark-bg font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-white text-sm">Step 3: Verification Complete & Reply Dispatched</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">✓ COMPLETE</span>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-emerald-500/20 mb-4">
              <div className="text-xs font-bold text-emerald-400 mb-1">WhatsApp Bot Outbound Message:</div>
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
{`✅ Login successful!

Click the link below to continue:
${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/continue/<ONE_TIME_LOGIN_TOKEN>`}
              </pre>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                The user clicks this link in WhatsApp, completing authentication in their browser.
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-xs"
              >
                Run Another Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
