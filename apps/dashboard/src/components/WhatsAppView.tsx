import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  MonitorPlay,
  LogOut,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWhatsAppStatus } from '../context/WhatsAppStatusContext';

export function WhatsAppView() {
  const {
    data: waStatus,
    isConnected,
    phoneNumber,
    pairing,
    loggingOut,
    startPairing,
    logout,
    refresh,
  } = useWhatsAppStatus();

  const [secondsRemaining, setSecondsRemaining] = useState(25);

  useEffect(() => {
    if (!waStatus?.qrCode || isConnected) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 25));
    }, 1000);

    return () => clearInterval(timer);
  }, [waStatus?.qrCode, isConnected]);

  const qrString = waStatus?.qrCode;
  const isDataUrl = qrString && qrString.startsWith('data:');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp Connection</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the official WhatsApp account used to send passwordless verification messages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>

          {!isConnected ? (
            <button
              onClick={() => startPairing(false)}
              disabled={pairing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg text-sm font-bold shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50"
            >
              <QrCode className={`w-4 h-4 ${pairing ? 'animate-spin' : ''}`} />
              <span>{pairing ? 'Generating QR...' : 'Generate New QR Code'}</span>
            </button>
          ) : (
            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? 'Logging out...' : 'Logout / Disconnect Device'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Connection Card */}
      <div className="grid grid-cols-5 gap-6">
        {/* Connection Details */}
        <div className="col-span-3 p-6 rounded-2xl bg-[#111827] border border-[#1f293d] space-y-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span className="text-lg font-bold text-white uppercase tracking-wide">
                {isConnected ? 'CONNECTED' : (waStatus?.status || 'AWAITING PAIRING')}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {isConnected
                ? `WhatsApp session is active on ${phoneNumber || 'paired device'} and listening for incoming authentication challenge messages.`
                : 'Scan the live QR code on the right with WhatsApp (Settings → Linked Devices → Link a Device) to link the bot account.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#0d131f] border border-[#1f293d]">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Connected Phone
              </div>
              <div className="font-mono text-sm font-bold text-brand-400">
                {phoneNumber || 'Not Paired'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0d131f] border border-[#1f293d]">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Adapter Mode
              </div>
              <div className="font-mono text-sm font-bold text-indigo-400">
                {waStatus?.adapterMode === 'mock' ? 'Mock Simulator' : 'Real WhatsApp (Baileys WebSocket)'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Authentication Bot Phone Identity:</strong>
              {isConnected
                ? `The connected number (${phoneNumber}) is the source of truth for all generated wa.me login links and incoming challenge verifications.`
                : 'When disconnected, authentication initiation is safely paused until an account is paired.'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d131f] border border-[#1f293d] space-y-2">
            <div className="text-xs font-bold text-slate-300">How WhatsApp Pairing Works:</div>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>On your phone (Account A), open WhatsApp.</li>
              <li>Go to <strong className="text-white">Settings → Linked Devices → Link a Device</strong>.</li>
              <li>Point your camera at the QR code on this screen.</li>
              <li>Your device pairs instantly via pure WebSocket protocol!</li>
            </ol>
          </div>
        </div>

        {/* Live QR Code Box */}
        <div className="col-span-2 p-6 rounded-2xl bg-[#111827] border border-[#1f293d] flex flex-col items-center justify-center text-center relative overflow-hidden">
          {isConnected ? (
            <div className="py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold text-3xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Device Connected</h3>
              <div className="text-xs font-mono text-brand-400 font-bold mb-2">{phoneNumber}</div>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Your WhatsApp account is active and ready to deliver passwordless login links.
              </p>
              <button
                onClick={logout}
                disabled={loggingOut}
                className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs transition-all"
              >
                {loggingOut ? 'Disconnecting...' : 'Logout Device'}
              </button>
            </div>
          ) : qrString ? (
            <div>
              <div className="p-3.5 bg-white rounded-2xl shadow-2xl inline-block mb-3 border-4 border-brand-500/30">
                {isDataUrl ? (
                  <img src={qrString} alt="WhatsApp QR Code" className="w-48 h-48 block" />
                ) : (
                  <QRCodeSVG value={qrString} size={192} level="H" includeMargin={false} />
                )}
              </div>

              <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Scan QR with WhatsApp</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d131f] border border-[#1f293d] text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span>Auto-refreshes on expiry (~{secondsRemaining}s)</span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-0.5">WhatsApp Not Linked</div>
                <div className="text-slate-500 text-[11px] max-w-xs">
                  Click the button below to generate a fresh QR code for pairing.
                </div>
              </div>
              <button
                onClick={() => startPairing(false)}
                disabled={pairing}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-dark-bg font-bold text-xs transition-all shadow-md mt-2"
              >
                {pairing ? 'Generating QR...' : 'Generate Pairing QR'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
