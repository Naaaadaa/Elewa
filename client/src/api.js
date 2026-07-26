// Thin fetch wrapper. Everything goes through the backend at /api — the
// Anthropic key is never present in this bundle.

const BASE = '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, options);
  } catch {
    const err = new Error('offline');
    err.offline = true;
    throw err;
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const err = new Error(body?.error || `Request failed (${response.status})`);
    err.status = response.status;
    err.detail = body?.detail;
    throw err;
  }

  return body;
}

const json = (path, method, payload) =>
  request(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const api = {
  health: () => request('/health'),

  createUser: (payload) => json('/users', 'POST', payload),

  cbcCatalogue: () => request('/cbc/subjects'),

  listClasses: (params) => request(`/classes?${new URLSearchParams(params)}`),
  getClass: (id) => request(`/classes/${id}`),
  createClass: (payload) => json('/classes', 'POST', payload),
  joinClass: (payload) => json('/classes/join', 'POST', payload),

  listHomework: (classId) => request(`/homework?classId=${encodeURIComponent(classId)}`),
  createHomework: (payload) => json('/homework', 'POST', payload),

  /** Sends the real File object to the backend, which forwards it to Claude vision. */
  transcribePhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/homework/photo', { method: 'POST', body: form });
  },

  listMessages: (params) => request(`/messages?${new URLSearchParams(params)}`),
  sendMessage: (payload) => json('/messages', 'POST', payload),

  insights: (classId) => request(`/insights?classId=${encodeURIComponent(classId)}`),

  agent: (action, payload) => json('/agent', 'POST', { action, payload }),
};
