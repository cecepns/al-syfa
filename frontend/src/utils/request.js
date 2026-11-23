import { api } from './api';

/**
 * Reusable HTTP Request Helpers
 */
export const request = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memuat data';
      throw new Error(msg);
    }
  },

  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Gagal menyimpan data';
      throw new Error(msg);
    }
  },

  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Gagal memperbarui data';
      throw new Error(msg);
    }
  },

  del: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Gagal menghapus data';
      throw new Error(msg);
    }
  },

  upload: async (url, formData) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Gagal mengunggah file';
      throw new Error(msg);
    }
  },
};
