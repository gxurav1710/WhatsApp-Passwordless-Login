const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const clean = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
      clean.append(k, String(v));
    }
  }
  const s = clean.toString();
  return s ? `?${s}` : '';
}

async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    try {
      const data = await res.json();
      return data;
    } catch {
      return { success: res.ok, status: res.status };
    }
  } catch (err: any) {
    console.warn(`[API Client] Network request to ${url} failed:`, err.message);
    return {
      success: false,
      error: { message: err.message || 'Cannot reach Auth API server' },
      networkError: true,
    };
  }
}

export const api = {
  async getHealth() {
    return safeFetch(`${API_BASE}/api/v1/admin/health`);
  },

  async getOverview() {
    return safeFetch(`${API_BASE}/api/v1/admin/overview`);
  },

  async getApps() {
    return safeFetch(`${API_BASE}/api/v1/admin/apps`);
  },

  async createApp(data: { name: string; auth_server_url?: string; redirect_uris: string[]; webhook_url?: string; status?: string }) {
    return safeFetch(`${API_BASE}/api/v1/admin/apps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApp(id: string, data: any) {
    return safeFetch(`${API_BASE}/api/v1/admin/apps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async rotateSecret(id: string) {
    return safeFetch(`${API_BASE}/api/v1/admin/apps/${id}/rotate-secret`, {
      method: 'POST',
    });
  },

  async deleteApp(id: string) {
    return safeFetch(`${API_BASE}/api/v1/admin/apps/${id}`, {
      method: 'DELETE',
    });
  },

  async getWhatsAppStatus() {
    return safeFetch(`${API_BASE}/api/v1/admin/whatsapp/status`);
  },

  async startPairing(visual: boolean = true) {
    return safeFetch(`${API_BASE}/api/v1/admin/whatsapp/start-pairing`, {
      method: 'POST',
      body: JSON.stringify({ visual }),
    });
  },

  async logoutWhatsApp() {
    return safeFetch(`${API_BASE}/api/v1/admin/whatsapp/logout`, {
      method: 'POST',
    });
  },

  async reconnectWhatsApp() {
    return safeFetch(`${API_BASE}/api/v1/admin/whatsapp/reconnect`, {
      method: 'POST',
    });
  },

  async getAuthLogs(params?: { phoneNumber?: string; state?: string }) {
    return safeFetch(`${API_BASE}/api/v1/admin/logs/auth${buildQueryString(params)}`);
  },

  async getUsers(params?: { search?: string }) {
    return safeFetch(`${API_BASE}/api/v1/admin/users${buildQueryString(params)}`);
  },

  async getSessions() {
    return safeFetch(`${API_BASE}/api/v1/admin/sessions`);
  },

  async revokeSession(id: string) {
    return safeFetch(`${API_BASE}/api/v1/admin/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  async simulateMessage(phoneNumber: string, messageBody: string) {
    return safeFetch(`${API_BASE}/api/v1/admin/test/simulate`, {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, message_body: messageBody }),
    });
  },

  async initiateAuth(data: { client_id: string; phone_number: string; full_name?: string; email?: string; redirect_uri: string }) {
    return safeFetch(`${API_BASE}/api/v1/auth/initiate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
