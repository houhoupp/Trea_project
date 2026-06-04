<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { userApi } from "../api/user";

const APP_CONFIG = window.__APP_CONFIG__ || { API_BASE_URL: "/api", CAPTCHA_URL: "/captcha" };

const router = useRouter();

const form = ref({
  username: "",
  password: "",
  confirmPassword: "",
  captcha: "",
});

const captchaId = ref("");
const captchaImage = ref("");
const isLoading = ref(false);
const errors = ref({
  username: "",
  password: "",
  confirmPassword: "",
  captcha: "",
});

async function fetchCaptcha() {
  try {
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}${APP_CONFIG.CAPTCHA_URL}`, {
      method: "GET",
    });

    const blob = await response.blob();
    captchaId.value = response.headers.get("captcha-id");
    captchaImage.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error("获取验证码失败:", error);
  }
}

function validateForm() {
  errors.value = { username: "", password: "", confirmPassword: "", captcha: "" };
  let isValid = true;

  if (!form.value.username.trim()) {
    errors.value.username = "请输入用户名";
    isValid = false;
  } else if (form.value.username.length < 3) {
    errors.value.username = "用户名至少3位";
    isValid = false;
  }

  if (!form.value.password) {
    errors.value.password = "请输入密码";
    isValid = false;
  } else if (form.value.password.length < 6) {
    errors.value.password = "密码长度至少6位";
    isValid = false;
  }

  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = "请确认密码";
    isValid = false;
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = "两次输入的密码不一致";
    isValid = false;
  }

  if (!form.value.captcha) {
    errors.value.captcha = "请输入验证码";
    isValid = false;
  }

  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    const result = await userApi.register(form.value.username, form.value.password, form.value.captcha, captchaId.value);

    if (result.success) {
      alert("注册成功！请登录");
      router.push("/login");
    } else {
      errors.value.username = result.message;
      fetchCaptcha();
    }
  } catch (error) {
    errors.value.captcha = "网络错误，请检查服务器是否运行";
    fetchCaptcha();
  }

  isLoading.value = false;
}

fetchCaptcha();
</script>

<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-header">
        <h1>用户注册</h1>
        <p>创建您的账号</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <div class="input-wrapper">
            <span class="icon">👤</span>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="请输入用户名（至少3位）"
              class="form-input"
              :class="{ error: errors.username }"
            />
          </div>
          <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <div class="input-wrapper">
            <span class="icon">🔒</span>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              class="form-input"
              :class="{ error: errors.password }"
            />
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <div class="input-wrapper">
            <span class="icon">🔒</span>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              class="form-input"
              :class="{ error: errors.confirmPassword }"
            />
          </div>
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>

        <div class="form-group captcha-group">
          <label for="captcha">验证码</label>
          <div class="captcha-wrapper">
            <div class="input-wrapper captcha-input">
              <input
                id="captcha"
                v-model="form.captcha"
                type="text"
                placeholder="请输入验证码"
                class="form-input"
                :class="{ error: errors.captcha }"
                maxlength="4"
              />
            </div>
            <div class="captcha-action">
              <img :src="captchaImage" alt="验证码" class="captcha-image" @click="fetchCaptcha" title="点击刷新" />
              <span class="refresh-text" @click="fetchCaptcha">换一张</span>
            </div>
          </div>
          <span v-if="errors.captcha" class="error-message">{{ errors.captcha }}</span>
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loading">⏳</span>
          {{ isLoading ? "注册中..." : "注册" }}
        </button>
      </form>

      <div class="login-footer">
        <span>已有账号?</span>
        <router-link to="/login" class="register-link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

$secondary-color: #764ba2;

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  padding: $spacing-xl;
}

.login-wrapper {
  background: $bg-color-page;
  border-radius: $radius-lg;
  @include box-shadow(lg);
  padding: $spacing-xxl;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: $spacing-xxl;

  h1 {
    margin: 0 0 $spacing-xs 0;
    color: $text-color-primary;
    font-size: 1.8rem;
  }

  p {
    margin: 0;
    color: $text-color-regular;
    font-size: 0.9rem;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.form-group {
  display: flex;
  flex-direction: column;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: $text-color-primary;
    margin-bottom: $spacing-xs;
  }
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: $bg-color-base;
  border-radius: $radius-md;
  padding: 0 $spacing-lg;
  border: 2px solid transparent;
  @include transition(all);

  &:focus-within {
    border-color: $primary-color;
    background: $bg-color-page;
  }

  &.error {
    border-color: $danger-color;
    background: rgba($danger-color, 0.05);
  }
}

.icon {
  font-size: 1.2rem;
  margin-right: $spacing-md;
  color: $text-color-secondary;
}

.form-input {
  flex: 1;
  padding: $spacing-md 0;
  border: none;
  background: transparent;
  font-size: $font-size-base;
  outline: none;

  &::placeholder {
    color: $text-color-placeholder;
  }
}

.captcha-group {
  position: relative;
}

.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  width: 100%;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.captcha-image {
  width: 90px;
  height: 38px;
  border-radius: $radius-sm;
  cursor: pointer;
  @include transition(transform);
  object-fit: cover;

  &:hover {
    transform: scale(1.02);
  }
}

.refresh-text {
  font-size: 0.65rem;
  color: $primary-color;
  cursor: pointer;
  margin-top: $spacing-xs;

  &:hover {
    text-decoration: underline;
  }
}

.error-message {
  font-size: 0.75rem;
  color: $danger-color;
  margin-top: $spacing-xs;
}

.login-btn {
  padding: $spacing-md;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  color: $bg-color-page;
  border: none;
  border-radius: $radius-md;
  font-size: $font-size-base;
  font-weight: 600;
  cursor: pointer;
  @include transition(transform, box-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    @include box-shadow(md);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  text-align: center;
  margin-top: $spacing-xl;
  padding-top: $spacing-xl;
  border-top: 1px solid $border-color-light;
  font-size: 0.85rem;
  color: $text-color-regular;
}

.register-link {
  color: $primary-color;
  text-decoration: none;
  margin-left: $spacing-xs;

  &:hover {
    text-decoration: underline;
  }
}
</style>
