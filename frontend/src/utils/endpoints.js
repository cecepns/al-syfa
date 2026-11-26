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
    UPDATE_SCHEDULE: (id) => `/users/${id}/work-schedule`,
    DELETE: (id) => `/users/${id}`,
  },

  CUSTOMERS: {
    LIST: "/customers",
    TRANSACTED: "/customers/transacted",
    DETAIL: (id) => `/customers/${id}`,
    PURCHASE_HISTORY: (id) => `/customers/${id}/purchase-history`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
    UPDATE_STATUS: (id) => `/customers/${id}/status`,
    SETTLE_BALANCE: (id) => `/customers/${id}/settle-balance`,
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
    UPDATE_PRICING: (id) => `/products/${id}/pricing`,
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
    SCHEDULE: "/attendances/schedule",
    CLOCK_IN: "/attendances/clock-in",
    CLOCK_OUT: "/attendances/clock-out",
    ADMIN_UPDATE: (id) => `/attendances/${id}`,
    ADMIN_RECORD: "/attendances/admin-record",
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
    PAYMENT_STATUS: (id) => `/orders/${id}/payment-status`,
    DELETE: (id) => `/orders/${id}`,
  },

  TARGETS: {
    LIST: "/targets",
    MY_PROGRESS: "/targets/my-progress",
    CREATE: "/targets",
    BATCH: "/targets/batch",
    CITIES: "/targets/cities",
    CREATE_CITY: "/targets/cities",
  },

  DEPOSITS: {
    LIST: "/deposits",
    SALES_SUMMARY: "/deposits/sales-summary",
    CREATE: "/deposits",
    UPDATE_STATUS: (id) => `/deposits/${id}/status`,
    DELETE: (id) => `/deposits/${id}`,
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

  BRANCHES: {
    LIST: "/branches",
    CREATE: "/branches",
    BATCH: "/branches/batch",
    SYNC: "/branches/sync",
    UPDATE: (id) => `/branches/${id}`,
    RENAME: "/branches/rename",
    DELETE: (id) => `/branches/${id}`,
    DELETE_BY_NAME: (name) => `/branches/by-name/${encodeURIComponent(name)}`,
  },

  OWNER: {
    ANALYTICS: "/owner/analytics",
    PRODUCTS: "/owner/products",
    UPDATE_HPP: (id) => `/owner/products/${id}/hpp`,
    UPDATE_PRICING: (id) => `/products/${id}/pricing`,
    UPDATE_CASH_CAPITAL: "/owner/capital/cash",
    CITY_TARGETS: "/targets/cities",
    CREATE_CITY_TARGET: "/targets/cities",
  },
};
