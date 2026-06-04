/**
 * 运行时配置文件（放在 public/ 目录下，浏览器直接加载）
 * 修改此文件后刷新页面即可生效，无需重新构建
 */
window.__APP_CONFIG__ = {
  // 后端 API 基础地址（开发环境用 Vite 代理：/api）
  API_BASE_URL: "/api",

  // 后端服务器完整地址（停用代理时使用）
  BACKEND_URL: "http://localhost:3000",

  TITLE: "五子棋游戏",

  // 验证码接口路径
  CAPTCHA_URL: "/captcha",
};
