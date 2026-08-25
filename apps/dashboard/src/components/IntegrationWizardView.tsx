'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, Globe, Server, ArrowRight, ShieldCheck } from 'lucide-react';

export function IntegrationWizardView() {
  const [selectedTab, setSelectedTab] = useState<'sdk' | 'nextjs' | 'react' | 'node' | 'python' | 'php' | 'curl'>('sdk');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const snippets = {
    sdk: `// 1. Install SDK
// npm install @whatsapp-auth/sdk

import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

// Configure Auth Client with your public Auth Server URL and credentials
const authClient = new WhatsAppAuthClient({
  baseUrl: process.env.AUTH_API_URL || 'https://abc123.trycloudflare.com', // Public Auth Server URL
  clientId: process.env.AUTH_CLIENT_ID || 'YOUR_CLIENT_ID',
  clientSecret: process.env.AUTH_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
});

// 2. Start Login Flow with Full Name, Email & Mobile Number
const { whatsappDeepLink, attemptId } = await authClient.initiate({
  fullName: 'John Doe',
  email: 'user@example.com',
  phoneNumber: '+14155552671',
  redirectUri: process.env.AUTH_REDIRECT_URI || 'https://myapp.example.com/auth/callback',
});

// Open whatsappDeepLink in the user's browser / device
// (The Auth Server automatically handles reverse message confirmation and continuation!)

// 3. In your Callback Route (/auth/callback)
const { user, accessToken } = await authClient.exchangeCode({
  code: req.query.code,
  redirectUri: process.env.AUTH_REDIRECT_URI || 'https://myapp.example.com/auth/callback',
});

console.log('Authenticated User:', user.fullName, user.email, user.phoneNumber);`,

    nextjs: `// .env.local
// AUTH_API_URL=https://auth.example.com
// AUTH_CLIENT_ID=wa_client_...
// AUTH_CLIENT_SECRET=wa_sec_...
// AUTH_REDIRECT_URI=https://myapp.example.com/auth/callback

// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { fullName, email, phone } = await req.json();

  const res = await fetch(\`\${process.env.AUTH_API_URL}/api/v1/auth/initiate\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.AUTH_CLIENT_ID,
      full_name: fullName,
      email: email,
      phone_number: phone,
      redirect_uri: process.env.AUTH_REDIRECT_URI,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}

// app/api/auth/callback/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const res = await fetch(\`\${process.env.AUTH_API_URL}/api/v1/auth/token\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH_CLIENT_ID,
      client_secret: process.env.AUTH_CLIENT_SECRET,
      code,
      redirect_uri: process.env.AUTH_REDIRECT_URI,
    }),
  });

  const { data } = await res.json();
  // Session established for data.user (id, full_name, email, phone_number)
  return NextResponse.redirect(new URL('/dashboard', req.url));
}`,

    react: `// React SPA Login Component
import React, { useState } from 'react';

const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL || 'https://auth.example.com';
const AUTH_REDIRECT_URI = 'https://myapp.example.com/auth/callback';

export function WhatsAppLoginButton() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    const res = await fetch(\`\${AUTH_API_URL}/api/v1/auth/initiate\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'YOUR_CLIENT_ID',
        full_name: fullName,
        email: email,
        phone_number: phone,
        redirect_uri: AUTH_REDIRECT_URI,
      }),
    });

    const data = await res.json();
    if (data.success) {
      window.location.href = data.data.whatsapp_deep_link;
    }
  };

  return (
    <button onClick={handleLogin}>Continue with WhatsApp</button>
  );
}`,

    node: `// Express.js Backend Integration
import express from 'express';
import { WhatsAppAuthClient } from '@whatsapp-auth/sdk';

const app = express();
const authClient = new WhatsAppAuthClient({
  baseUrl: process.env.AUTH_API_URL || 'https://auth.example.com',
  clientId: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
});

// 1. Initiate Login
app.post('/api/login', async (req, res) => {
  const { fullName, email, phone } = req.body;
  const result = await authClient.initiate({
    fullName,
    email,
    phoneNumber: phone,
    redirectUri: process.env.AUTH_REDIRECT_URI || 'https://myapp.example.com/auth/callback',
  });
  res.json(result);
});

// 2. OAuth Callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const authResult = await authClient.exchangeCode({
    code,
    redirectUri: process.env.AUTH_REDIRECT_URI || 'https://myapp.example.com/auth/callback',
  });
  
  // Set session cookie with authResult.user
  res.redirect('/dashboard');
});`,

    python: `# Python FastApi / Flask Integration
import requests
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse

app = FastAPI()
AUTH_API_URL = "https://auth.example.com"
AUTH_CLIENT_ID = "YOUR_CLIENT_ID"
AUTH_CLIENT_SECRET = "YOUR_CLIENT_SECRET"
AUTH_REDIRECT_URI = "https://myapp.example.com/auth/callback"

@app.post("/api/auth/start")
def start_auth(full_name: str, email: str, phone: str):
    response = requests.post(f"{AUTH_API_URL}/api/v1/auth/initiate", json={
        "client_id": AUTH_CLIENT_ID,
        "full_name": full_name,
        "email": email,
        "phone_number": phone,
        "redirect_uri": AUTH_REDIRECT_URI
    })
    return response.json()

@app.get("/auth/callback")
def auth_callback(code: str):
    response = requests.post(f"{AUTH_API_URL}/api/v1/auth/token", json={
        "grant_type": "authorization_code",
        "client_id": AUTH_CLIENT_ID,
        "client_secret": AUTH_CLIENT_SECRET,
        "code": code,
        "redirect_uri": AUTH_REDIRECT_URI
    })
    user_data = response.json().get("data", {}).get("user")
    return RedirectResponse(url="/dashboard")`,

    php: `<?php
// PHP Integration
$AUTH_API_URL = 'https://auth.example.com';
$AUTH_CLIENT_ID = 'YOUR_CLIENT_ID';
$AUTH_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
$AUTH_REDIRECT_URI = 'https://myapp.example.com/auth/callback';

// 1. Initiate Login
function initiateWhatsAppAuth($fullName, $email, $phone) {
    global $AUTH_API_URL, $AUTH_CLIENT_ID, $AUTH_REDIRECT_URI;
    
    $ch = curl_init("$AUTH_API_URL/api/v1/auth/initiate");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'client_id' => $AUTH_CLIENT_ID,
        'full_name' => $fullName,
        'email' => $email,
        'phone_number' => $phone,
        'redirect_uri' => $AUTH_REDIRECT_URI
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}`,

    curl: `# 1. Initiate Auth with Full Name, Email & Phone
curl -X POST https://auth.example.com/api/v1/auth/initiate \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "full_name": "John Doe",
    "email": "user@example.com",
    "phone_number": "+14155552671",
    "redirect_uri": "https://myapp.example.com/auth/callback"
  }'

# 2. Exchange Authorization Code (in callback)
curl -X POST https://auth.example.com/api/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "grant_type": "authorization_code",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "code": "AUTH_CODE_RECEIVED_FROM_CALLBACK",
    "redirect_uri": "https://myapp.example.com/auth/callback"
  }'`,
  };

  const tabs = [
    { id: 'sdk', label: 'TypeScript / JS SDK' },
    { id: 'nextjs', label: 'Next.js (App Router)' },
    { id: 'react', label: 'React SPA' },
    { id: 'node', label: 'Node.js Express' },
    { id: 'python', label: 'Python (FastAPI)' },
    { id: 'php', label: 'PHP' },
    { id: 'curl', label: 'cURL / REST API' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Integration & SDK Guide</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Connect your website or mobile application to your WhatsApp Auth Server using our official SDK or standard OAuth 2.0 endpoints.
        </p>
      </div>

      {/* URL Architecture Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1f293d] space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Server className="w-4 h-4" />
            <span>AUTH_API_URL</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The public URL of your <strong>WhatsApp Auth Server</strong> (e.g. <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">https://abc123.trycloudflare.com</code> or <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">http://localhost:4000</code>).
          </p>
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            Used by your client app to call initiate / token endpoints and by WhatsApp to generate one-time continuation links.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-[#1f293d] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Globe className="w-4 h-4" />
            <span>AUTH_REDIRECT_URI</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The public callback URL on <strong>your website</strong> (e.g. <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">https://standalone-example-app.vercel.app/auth/callback</code>).
          </p>
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
            The Auth Server redirects the user back here with the authorization code once WhatsApp challenge verification completes.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1f293d] pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === tab.id
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Block Container */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f293d] bg-[#0d131f]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-slate-400 text-xs font-mono ml-2">integration-{selectedTab}.example</span>
          </div>
          <button
            onClick={() => copyCode(selectedTab, snippets[selectedTab])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700/50 cursor-pointer"
          >
            {copiedKey === selectedTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto bg-[#0b0f19] leading-relaxed">
          <code>{snippets[selectedTab]}</code>
        </pre>
      </div>
    </div>
  );
}
