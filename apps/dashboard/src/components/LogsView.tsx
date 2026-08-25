'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { ScrollText, Search, Filter, RefreshCw } from 'lucide-react';

export function LogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, [stateFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuthLogs({
        phoneNumber: phoneSearch || undefined,
        state: stateFilter || undefined,
      });
      if (res.success) setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Authentication Logs</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Trace the full lifecycle of every passwordless authentication attempt.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1f293d] hover:bg-[#1e293b] text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search phone number..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
            className="w-full bg-[#0d131f] border border-[#1f293d] rounded-xl pl-10 pr-4 py-2 text-white text-xs focus:border-brand-500 outline-none"
          />
        </div>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-[#0d131f] border border-[#1f293d] rounded-xl px-4 py-2 text-white text-xs font-medium focus:border-brand-500 outline-none"
        >
          <option value="">All States</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="LOGIN_LINK_CONSUMED">LOGIN_LINK_CONSUMED</option>
          <option value="INITIATED">INITIATED</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-xs">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No matching authentication attempts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase border-b border-[#1f293d]">
                <tr>
                  <th className="pb-3 font-semibold">Attempt ID</th>
                  <th className="pb-3 font-semibold">Phone Number</th>
                  <th className="pb-3 font-semibold">Application</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                  <th className="pb-3 font-semibold">Created At</th>
                  <th className="pb-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {logs.map((log) => (
                  <tr key={log.id} className="text-slate-300">
                    <td className="py-3 font-mono text-slate-400">{log.id.slice(0, 8)}...</td>
                    <td className="py-3 font-mono font-bold text-white">{log.phoneNumber}</td>
                    <td className="py-3">{log.application?.name || 'App'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    <td className="py-3 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedAttempt(log)}
                        className="text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Attempt Lifecycle Trace</h3>

            <div className="bg-[#0d131f] p-4 rounded-xl space-y-2 text-xs font-mono text-slate-300">
              <div><span className="text-slate-500">Attempt ID:</span> {selectedAttempt.id}</div>
              <div><span className="text-slate-500">Phone:</span> {selectedAttempt.phoneNumber}</div>
              <div><span className="text-slate-500">State:</span> <span className="text-brand-400 font-bold">{selectedAttempt.state}</span></div>
              <div><span className="text-slate-500">Redirect URI:</span> {selectedAttempt.redirectUri}</div>
              <div><span className="text-slate-500">Initiated At:</span> {new Date(selectedAttempt.createdAt).toLocaleString()}</div>
              <div><span className="text-slate-500">Expires At:</span> {new Date(selectedAttempt.expiresAt).toLocaleString()}</div>
              <div><span className="text-slate-500">Verified At:</span> {selectedAttempt.verifiedAt ? new Date(selectedAttempt.verifiedAt).toLocaleString() : 'Not verified'}</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
