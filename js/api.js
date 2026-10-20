/**
 * ONCE — 1-of-1 Vintage & Archive Store
 * API Client Layer (api.js)
 * Connects frontend to Node.js REST API
 */

(function () {
  // Determine API Base URL
  const isFileProtocol = window.location.protocol === 'file:';
  const API_BASE = isFileProtocol ? 'http://localhost:3000' : '';

  // Persistent Client Session ID for 15-minute Cart Hold
  const CLIENT_KEY = 'once_client_session_id';
  let clientId = localStorage.getItem(CLIENT_KEY);
  if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { localStorage.setItem(CLIENT_KEY, clientId); } catch (e) {}
  }

  // Base HTTP Request Wrapper
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      'X-Client-Id': clientId,
      ...(options.headers || {})
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[API] Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // API Methods
  const api = {
    getClientId() {
      return clientId;
    },

    getBaseUrl() {
      return API_BASE;
    },

    async checkHealth() {
      try {
        return await request('/api/health');
      } catch (e) {
        return null;
      }
    },

    // Settings (Shipping fee, Free shipping threshold, PromptPay info)
    async getSettings() {
      return await request('/api/settings');
    },

    async updateSettings(settings) {
      return await request('/api/settings', {
        method: 'PUT',
        body: settings
      });
    },

    // Products
    async getProducts(params = {}) {
      const q = new URLSearchParams();
      if (params.q) q.set('q', params.q);
      if (params.category && params.category !== 'ทั้งหมด') q.set('category', params.category);
      if (params.size && params.size !== 'ทั้งหมด') q.set('size', params.size);
      if (params.brand && params.brand !== 'ทั้งหมด') q.set('brand', params.brand);
      if (params.minPrice) q.set('minPrice', params.minPrice);
      if (params.maxPrice) q.set('maxPrice', params.maxPrice);
      if (params.sort) q.set('sort', params.sort);
      if (params.onlyAvail) q.set('onlyAvail', 'true');
      q.set('clientId', clientId);

      const qs = q.toString();
      return await request(`/api/products${qs ? '?' + qs : ''}`);
    },

    async getProduct(id) {
      return await request(`/api/products/${id}`);
    },

    async createProduct(productData) {
      return await request('/api/products', {
        method: 'POST',
        body: productData
      });
    },

    async updateProduct(id, productData) {
      return await request(`/api/products/${id}`, {
        method: 'PUT',
        body: productData
      });
    },

    async deleteProduct(id) {
      return await request(`/api/products/${id}`, {
        method: 'DELETE'
      });
    },

    // 15-Minute Cart Hold
    async holdCartItem(productId) {
      return await request('/api/cart/hold', {
        method: 'POST',
        body: { productId, clientId }
      });
    },

    async releaseCartItem(productId) {
      return await request('/api/cart/release', {
        method: 'POST',
        body: { productId, clientId }
      });
    },

    // Authentication
    async login(email, password) {
      return await request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
    },

    async register(userData) {
      return await request('/api/auth/register', {
        method: 'POST',
        body: userData
      });
    },

    // Orders & Checkout
    async getOrders(userId = null, role = 'customer') {
      const q = new URLSearchParams();
      if (userId) q.set('userId', userId);
      if (role) q.set('role', role);
      const qs = q.toString();
      return await request(`/api/orders${qs ? '?' + qs : ''}`);
    },

    async getOrder(id) {
      return await request(`/api/orders/${id}`);
    },

    async checkout(orderPayload) {
      return await request('/api/orders/checkout', {
        method: 'POST',
        body: { ...orderPayload, clientId }
      });
    },

    async updateOrderStatus(id, status, note = '', trackingNo = '') {
      return await request(`/api/orders/${id}/status`, {
        method: 'PUT',
        body: { status, note, trackingNo }
      });
    },

    async verifySlip(id, action, reason = '') {
      return await request(`/api/orders/${id}/verify-slip`, {
        method: 'POST',
        body: { action, reason }
      });
    },

    // Chat Messages
    async getMessages() {
      return await request('/api/messages');
    },

    async sendMessage(sender, senderName, text) {
      return await request('/api/messages', {
        method: 'POST',
        body: { sender, senderName, text }
      });
    },

    // Dashboard & Reports
    async getDashboardStats() {
      return await request('/api/dashboard/stats');
    },

    async getDailySales() {
      return await request('/api/dashboard/daily-sales');
    },

    getExportCsvUrl() {
      return `${API_BASE}/api/dashboard/export-csv`;
    }
  };

  // Expose to window
  window.api = api;
})();
