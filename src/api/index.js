const APP_CONFIG = window.__APP_CONFIG__ || { API_BASE_URL: "/api" };
const BASE_URL = APP_CONFIG.API_BASE_URL;

const request = async (url, options = {}) => {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
    ...options,
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "请求失败");
      console.log(data, 111);
      error.response = data;
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.response) {
      error.response = { success: false, message: "网络错误，请检查网络连接" };
    }
    throw error;
  }
};

export { request, BASE_URL };
