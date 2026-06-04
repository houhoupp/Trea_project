import { request } from './index';

export const userApi = {
  async login(username, password, captcha, captchaId) {
    try {
      const data = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, captcha, captchaId }),
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || '登录失败',
        error,
      };
    }
  },

  async register(username, password, captcha, captchaId) {
    try {
      const data = await request('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, captcha, captchaId }),
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || '注册失败',
        error,
      };
    }
  },

  async verifyToken(token) {
    try {
      const data = await request('/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || 'Token验证失败',
        error,
      };
    }
  },

  async logout(token) {
    try {
      const data = await request('/logout', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.message || '退出失败',
        error,
      };
    }
  },
};

export default userApi;