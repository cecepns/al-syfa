/**
 * Centralized API Endpoints Definition
 * Rule: No hardcoded endpoints in components or pages
 */

/**
 * Helper: Resolve full storage / upload image URL using configured API base URL
 */
export const getStorageUrl = (path) => {
  if (!path) return '';
  // If already a data URI, full HTTP/HTTPS URL, or blob, return directly
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kingcreativestudio.my.id/al-syfa/api';
  // Strip trailing /api or /api/ to resolve backend root domain
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  return `${baseUrl}${cleanPath}`;
};

export const API_ENDPOINTS = {
  STORAGE: {
    FILE: (path) => getStorageUrl(path),
    URL: (path) => getStorageUrl(path),
  },

  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },

  WILAYAH: {
    PROVINCES: "/wilayah/provinces",
    REGENCIES: (provinceCode) => `/wilayah/regencies/${provinceCode}`,
    DISTRICTS: (regencyCode) => `/wilayah/districts/${regencyCode}`,
    VILLAGES: (districtCode) => `/wilayah/villages/${districtCode}`,
  },

  USERS: {
    LIST: "/users",
    DETAIL: (id) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },

  CUSTOMERS: {
    LIST: "/customers",
    DETAIL: (id) => `/customers/${id}`,
    PURCHASE_HISTORY: (id) => `/customers/${id}/purchase-history`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
  },

  ROUTES: {
    LIST: "/routes",
    DETAIL: (id) => `/routes/${id}`,
    SALES_TODAY: (salesId) => `/routes/sales/${salesId}/today`,
    CREATE: "/routes",
    UPDATE: (id) => `/routes/${id}`,
    DELETE: (id) => `/routes/${id}`,
  },

  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  VAN_STOCKS: {
    LIST: "/van-stocks",
    CURRENT: (salesId) => `/van-stocks/current/${salesId}`,
    ALLOCATE: "/van-stocks/allocate",
    RETURN: "/van-stocks/return",
  },

  VISITS: {
    LIST: "/visits",
    CHECK_IN: "/visits/check-in",
    CHECK_OUT: "/visits/check-out",
  },

  TRACKING: {
    PING: "/tracking/ping",
    SALES_LOCATIONS: "/tracking/sales-locations",
  },

  ATTENDANCES: {
    LIST: "/attendances",
    TODAY: "/attendances/today",
    CLOCK_IN: "/attendances/clock-in",
    CLOCK_OUT: "/attendances/clock-out",
  },

  PROMOTIONS: {
    LIST: "/promotions",
    DETAIL: (id) => `/promotions/${id}`,
    CREATE: "/promotions",
    UPDATE: (id) => `/promotions/${id}`,
    DELETE: (id) => `/promotions/${id}`,
  },

  ORDERS: {
    LIST: "/orders",
    DETAIL: (id) => `/orders/${id}`,
    CREATE: "/orders",
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    RETAIL_STATUS: (id) => `/orders/${id}/retail-status`,
    DELETE: (id) => `/orders/${id}`,
  },

  ALLOWANCES: {
    DAILY: "/allowances/daily",
    MONTHLY: "/allowances/monthly",
    CLAIM: "/allowances/claim",
    UPDATE_STATUS: (id) => `/allowances/${id}/status`,
    BATCH_PAY: "/allowances/batch-pay",
  },

  PAYMENTS: {
    LIST: "/payments",
    CREATE: "/payments",
    ACCOUNTING_SUMMARY: "/accounting/summary",
  },

  DASHBOARD: {
    STATS: "/dashboard/stats",
    SALES_PERFORMANCE: "/reports/sales-performance",
  },

  OWNER: {
    ANALYTICS: "/owner/analytics",
  },
};
