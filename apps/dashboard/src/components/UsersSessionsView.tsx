'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { Users, Shield, Search, Trash2, Key, Mail, User, Phone } from 'lucide-react';

export function UsersSessionsView() {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([
        api.getUsers({ search: search || undefined }),
        api.getSessions(),
      ]);
      if (u.success) setUsers(u.data);
      if (s.success) setSessions(s.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    try {
      await api.revokeSession(id);
      loadData();
    } catch (e) {
      alert('Failed to revoke session');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Users & Active Sessions</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            View verified user identities (Name, Email, Phone) and manage active application sessions.
          </p>
        </div>
        <div className="flex items-center bg-[#111827] border border-[#1f293d] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-slate-400'
            }`}
          >
            Verified Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sessions' ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-slate-400'
            }`}
          >
            Active Sessions ({sessions.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-white text-xs focus:border-brand-500 outline-none"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500 text-xs">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No verified users registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase border-b border-[#1f293d]">
                  <tr>
                    <th className="pb-3 font-semibold">User Identity</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Phone Number</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Last Login</th>
                    <th className="pb-3 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {users.map((u) => (
                    <tr key={u.id} className="text-slate-300">
                      <td className="py-3">
                        <div className="font-semibold text-white">{u.fullName || 'WhatsApp User'}</div>
                        <div className="font-mono text-[10px] text-slate-500">{u.id.slice(0, 8)}...</div>
                      </td>
                      <td className="py-3 text-slate-300">
                        {u.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{u.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not provided</span>
                        )}
                      </td>
                      <td className="py-3 font-mono font-bold text-brand-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-brand-500" />
                          <span>{u.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 shadow-xl">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No active sessions.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase border-b border-[#1f293d]">
                  <tr>
                    <th className="pb-3 font-semibold">User Identity</th>
                    <th className="pb-3 font-semibold">Application</th>
                    <th className="pb-3 font-semibold">IP Address</th>
                    <th className="pb-3 font-semibold">Expires</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {sessions.map((s) => (
                    <tr key={s.id} className="text-slate-300">
                      <td className="py-3">
                        <div className="font-semibold text-white">{s.user?.fullName || 'WhatsApp User'}</div>
                        <div className="font-mono text-brand-400 text-[11px]">{s.user?.phoneNumber}</div>
                        {s.user?.email && <div className="text-slate-500 text-[10px]">{s.user?.email}</div>}
                      </td>
                      <td className="py-3 font-medium text-slate-200">{s.application?.name}</td>
                      <td className="py-3 font-mono text-slate-400">{s.ipAddress || '127.0.0.1'}</td>
                      <td className="py-3 text-slate-400">{new Date(s.expiresAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold transition-all"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
