const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

const app = express();
const PORT = 3000;

const allowedOrigins = ["http://localhost:5174", "http://localhost:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "captcha-id"],
    exposedHeaders: ["captcha-id"],
  }),
);
app.use(express.json());

const db = new sqlite3.Database("./users.db");
const tokens = {};
const captchas = {};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const checkUser = db.prepare("SELECT username FROM users WHERE username = ?");
  checkUser.get("admin", (err, row) => {
    if (!row) {
      const hash = crypto.createHash("sha256").update("123456").digest("hex");
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hash]);
      console.log("默认用户已创建: admin / 123456");
    }
  });
  checkUser.finalize();
});

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateCaptchaCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateCaptchaSVG(code) {
  const width = 100;
  const height = 40;
  const lines = [];

  for (let i = 0; i < 8; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = `rgb(${Math.floor(Math.random() * 150 + 50)}, ${Math.floor(Math.random() * 150 + 50)}, ${Math.floor(Math.random() * 150 + 50)})`;
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`);
  }

  const chars = [];
  const fontSize = 18;
  const spacing = 22;
  const startX = 12;
  const startY = 25;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const x = startX + i * spacing;
    const y = startY + (Math.random() - 0.5) * 6;
    const color = `rgb(${Math.floor(Math.random() * 100 + 50)}, ${Math.floor(Math.random() * 100 + 50)}, ${Math.floor(Math.random() * 100 + 50)})`;
    const rotate = (Math.random() - 0.5) * 0.3;
    chars.push(
      `<text x="${x}" y="${y}" font-size="${fontSize + Math.random() * 4}" fill="${color}" transform="rotate(${rotate} ${x} ${y})" font-family="Arial, sans-serif" font-weight="bold">${char}</text>`,
    );
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#f0f0f0"/>
      ${lines.join("")}
      ${chars.join("")}
    </svg>
  `.trim();
}

app.get("/api/captcha", (req, res) => {
  const captchaId = crypto.randomBytes(16).toString("hex");
  const code = generateCaptchaCode();
  captchas[captchaId] = { code: code.toLowerCase(), expiresAt: Date.now() + 300000 };

  const svg = generateCaptchaSVG(code);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("captcha-id", captchaId);
  res.send(svg);
});

app.post("/api/login", (req, res) => {
  const { username, password, captcha, captchaId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "请输入用户名和密码" });
  }

  if (!captcha || !captchaId) {
    return res.status(400).json({ success: false, message: "请输入验证码" });
  }

  const captchaData = captchas[captchaId];
  if (!captchaData) {
    return res.json({ success: false, message: "验证码已过期，请刷新" });
  }

  if (captchaData.expiresAt < Date.now()) {
    delete captchas[captchaId];
    return res.json({ success: false, message: "验证码已过期，请刷新" });
  }

  if (captcha.toLowerCase() !== captchaData.code) {
    delete captchas[captchaId];
    return res.json({ success: false, message: "验证码错误" });
  }

  delete captchas[captchaId];

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");

  stmt.get(username, hash, (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: "服务器错误" });
    }

    if (row) {
      const token = generateToken();
      tokens[token] = { username: row.username, expiresAt: Date.now() + 86400000 };
      res.json({
        success: true,
        message: "登录成功",
        username: row.username,
        token: token,
      });
    } else {
      res.json({ success: false, message: "用户名或密码错误" });
    }
  });
  stmt.finalize();
});

app.post("/api/register", (req, res) => {
  const { username, password, captcha, captchaId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "请输入用户名和密码" });
  }

  if (!captcha || !captchaId) {
    return res.status(400).json({ success: false, message: "请输入验证码" });
  }

  const captchaData = captchas[captchaId];
  if (!captchaData) {
    return res.json({ success: false, message: "验证码已过期，请刷新" });
  }

  if (captchaData.expiresAt < Date.now()) {
    delete captchas[captchaId];
    return res.json({ success: false, message: "验证码已过期，请刷新" });
  }

  if (captcha.toLowerCase() !== captchaData.code) {
    delete captchas[captchaId];
    return res.json({ success: false, message: "验证码错误" });
  }

  delete captchas[captchaId];

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ success: false, message: "用户名至少3位，密码至少6位" });
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");

  stmt.run(username, hash, function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.json({ success: false, message: "用户名已存在" });
      }
      return res.status(500).json({ success: false, message: "注册失败" });
    }
    res.json({ success: true, message: "注册成功" });
  });
  stmt.finalize();
});

app.post("/api/verify-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.json({ success: false, message: "token为空" });
  }

  const tokenData = tokens[token];

  if (!tokenData) {
    return res.json({ success: false, message: "无效的token" });
  }

  if (tokenData.expiresAt < Date.now()) {
    delete tokens[token];
    return res.json({ success: false, message: "token已过期" });
  }

  tokenData.expiresAt = Date.now() + 86400000;
  res.json({ success: true, username: tokenData.username });
});

app.post("/api/logout", (req, res) => {
  const { token } = req.body;
  if (token && tokens[token]) {
    delete tokens[token];
  }
  res.json({ success: true, message: "退出成功" });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log("默认登录账号: admin / 123456");
});
