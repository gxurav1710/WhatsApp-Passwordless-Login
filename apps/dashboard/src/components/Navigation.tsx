'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  AppWindow,
  QrCode,
  FlaskConical,
  Code2,
  Users,
  ScrollText,
  Activity,
  Sparkles,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'wizard'
  | 'apps'
  | 'whatsapp'
  | 'sandbox'
  | 'integration'
  | 'users'
  | 'logs'
  | 'health';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  systemStatus?: string;
}

export function Navigation({ activeTab, setActiveTab, systemStatus }: NavigationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'wizard', label: 'Setup Wizard', icon: Sparkles, badge: 'Get Started' },
    { id: 'apps', label: 'Applications', icon: AppWindow },
    { id: 'whatsapp', label: 'WhatsApp Connection', icon: QrCode },
    { id: 'sandbox', label: 'Live Sandbox & Test', icon: FlaskConical },
    { id: 'integration', label: 'Integration & SDK', icon: Code2 },
    { id: 'users', label: 'Users & Sessions', icon: Users },
    { id: 'logs', label: 'Auth & Audit Logs', icon: ScrollText },
    { id: 'health', label: 'System Health & Docs', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-[#0d131f] border-r border-[#1f293d] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-[#1f293d] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-dark-bg font-bold shadow-lg shadow-brand-600/20">
            <span className="text-xl">💬</span>
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">WhatsApp Auth</h1>
            <span className="text-xs text-brand-400 font-medium">Self-Hosted v1.0</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabId)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151d2c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer Badge */}
      <div className="p-4 border-t border-[#1f293d] bg-[#090d16]/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">System State</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-emerald-400" suppressHydrationWarning>
              {mounted ? systemStatus || 'Online' : 'Online'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
