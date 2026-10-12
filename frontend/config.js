window.DARBOT_CONFIG = Object.assign({
  API_BASE: (window.DARBOT_BACKEND_URL || '') + '/api',
  PUBLIC_API_BASE: (window.DARBOT_BACKEND_URL || '') + '/api/public',
  ADMIN_API_BASE: (window.DARBOT_BACKEND_URL || '') + '/api/admin',
  CACHE_TTL_MS: 300000,
  DEFAULT_TIMEOUT_MS: 15000
}, window.DARBOT_CONFIG || {});

window.DARBOT_API_BASE = window.DARBOT_CONFIG.API_BASE;
window.DARBOT_CACHE_TTL_MS = window.DARBOT_CONFIG.CACHE_TTL_MS;
