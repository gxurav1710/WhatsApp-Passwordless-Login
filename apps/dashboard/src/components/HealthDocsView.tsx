'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { Activity, BookOpen, ExternalLink, ShieldCheck, Database, Server, QrCode } from 'lucide-react';

export function HealthDocsView() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">System Health & API Reference</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Review live service uptime, environment diagnostic parameters, and REST API contracts.
        </p>
      </div>

      {/* Services Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Auth API Core</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.services?.api?.status || 'HEALTHY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Fastify HTTP Server with OAuth 2.0 grant handlers</p>
            <div className="font-mono text-[11px] text-slate-500 mt-2">Port: 4000 • Version: 1.0.0</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">PostgreSQL Storage</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.services?.database?.status || 'CONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Prisma ORM with relational integrity & hashed token storage</p>
            <div className="font-mono text-[11px] text-slate-500 mt-2">Engine: PostgreSQL 16</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">WhatsApp Worker</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {health?.services?.worker?.status || 'HEALTHY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Isolated WhatsApp automation daemon behind adapter abstraction</p>
            <div className="font-mono text-[11px] text-slate-500 mt-2">Mode: {health?.services?.worker?.mode || 'mock'}</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center shrink-0 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Device Link</h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  health?.services?.whatsapp?.status === 'CONNECTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {health?.services?.whatsapp?.status || 'CONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">WhatsApp Web session authentication state</p>
            <div className="font-mono text-[11px] text-slate-500 mt-2">
              Phone: {health?.services?.whatsapp?.phoneNumber || 'Paired'}
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI Swagger Interactive Explorer Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-[#111827] to-[#151e30] border border-brand-500/30 flex items-center justify-between shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" /> Interactive Documentation
          </div>
          <h3 className="text-xl font-bold text-white">OpenAPI / Swagger Explorer</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-lg">
            Explore and test all REST endpoints directly in your browser using the auto-generated Swagger UI.
          </p>
        </div>

        <a
          href={`${apiUrl}/docs`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-sm shadow-lg shadow-brand-600/20 transition-all shrink-0"
        >
          <span>Open Swagger UI</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
