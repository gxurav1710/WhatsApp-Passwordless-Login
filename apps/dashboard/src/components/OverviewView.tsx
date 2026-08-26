'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { useWhatsAppStatus } from '../context/WhatsAppStatusContext';
import {
  AppWindow,
  Users,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  FlaskConical,
} from 'lucide-react';
import { TabId } from './Navigation';
import { QRCodeSVG } from 'qrcode.react';

interface OverviewProps {
  setActiveTab: (tab: TabId) => void;
}

export function OverviewView({ setActiveTab }: OverviewProps) {
  const [overview, setOverview] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const {
    isConnected,
    phoneNumber,
    qrCode: qrString,
  } = useWhatsAppStatus();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ov, hl, lg] = await Promise.all([
        api.getOverview().catch(() => ({ success: false })),
        api.getHealth().catch(() => null),
        api.getAuthLogs({}).catch(() => ({ success: false })),
      ]);
      if (ov?.success) setOverview(ov.data);
      if (hl) setHealth(hl);
      if (lg?.success) setRecentLogs(lg.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  };

  const isDataUrl = qrString && typeof qrString === 'string' && qrString.startsWith('data:image');

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner / Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Monitor real-time WhatsApp authentication metrics, active sessions, and system health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('sandbox')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-white hover:bg-[#1e293b] text-sm font-medium transition-all"
          >
            <FlaskConical className="w-4 h-4 text-brand-400" />
            <span>Interactive Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg text-sm font-bold shadow-lg shadow-brand-600/20 transition-all"
          >
            <span>+ New Application</span>
          </button>
        </div>
      </div>

      {/* Live QR Pairing Banner on Overview */}
      {qrString && !isConnected && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/60 via-[#111827] to-[#111827] border border-brand-500/40 flex items-center justify-between shadow-2xl">
          <div className="space-y-2 pr-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse"></span>
              <h3 className="text-lg font-bold text-white">Scan to Connect WhatsApp Account</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              WhatsApp Web is open and awaiting pairing. Open WhatsApp on your phone (<strong className="text-white">Settings → Linked Devices → Link a Device</strong>) and scan the QR code on the right (or in the opened Chrome window).
            </p>
            <div className="pt-1 flex items-center gap-4">
              <button
                onClick={() => setActiveTab('whatsapp')}
                className="text-xs font-bold text-brand-400 hover:text-brand-300 underline flex items-center gap-1"
              >
                <span>Open Full WhatsApp Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-2xl border-4 border-brand-500/30 flex-shrink-0">
            {isDataUrl ? (
              <img src={qrString} alt="WhatsApp QR Code" className="w-36 h-36 block" />
            ) : (
              <QRCodeSVG value={qrString} size={144} level="H" includeMargin={false} />
            )}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applications</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <AppWindow className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{overview?.totalApplications ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Configured apps</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{overview?.totalUsers ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Unique phone identities</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{overview?.activeSessions ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Unexpired tokens</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{overview?.successRatePercentage ?? 100}%</div>
          <div className="text-xs text-slate-500 mt-1">{overview?.recentAttemptsCount ?? 0} total attempts</div>
        </div>
      </div>

      {/* Services Health Bar */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d]">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Core Services Health Status
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-[#0d131f] border border-[#1f293d] flex items-center justify-between">
            <div className="text-sm font-medium text-white">Auth API Core</div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> HEALTHY
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d131f] border border-[#1f293d] flex items-center justify-between">
            <div className="text-sm font-medium text-white">PostgreSQL DB</div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> CONNECTED
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d131f] border border-[#1f293d] flex items-center justify-between">
            <div className="text-sm font-medium text-white">WhatsApp Worker</div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> RUNNING
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d131f] border border-[#1f293d] flex items-center justify-between">
            <div className="text-sm font-medium text-white">WhatsApp Link</div>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold ${
                isConnected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              {isConnected ? (phoneNumber ? `CONNECTED (${phoneNumber})` : 'CONNECTED') : 'AWAITING PAIRING'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Recent Authentication Attempts</h3>
          <button
            onClick={() => setActiveTab('logs')}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View all logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No authentication attempts logged yet. Test your flow using the Sandbox Tester!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-[#1f293d]">
                <tr>
                  <th className="pb-3 font-semibold">Phone Number</th>
                  <th className="pb-3 font-semibold">Application</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Initiated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {recentLogs.map((log) => (
                  <tr key={log.id} className="text-slate-300">
                    <td className="py-3 font-mono font-medium text-white">{log.phoneNumber}</td>
                    <td className="py-3">{log.application?.name || 'Default App'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.state === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.state === 'VERIFIED'
                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                            : log.state === 'INITIATED'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {log.state}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
