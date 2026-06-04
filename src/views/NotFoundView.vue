<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});

function goHome() {
  router.push("/home");
}

function goBack() {
  window.history.back();
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content" :class="{ visible: isVisible }">
      <div class="error-code">404</div>
      <div class="error-icon">🔍</div>
      <h1>页面未找到</h1>
      <p>抱歉，您访问的页面不存在或已被移动</p>

      <div class="error-actions">
        <button class="action-btn primary" @click="goHome">返回首页</button>
        <button class="action-btn secondary" @click="goBack">返回上一页</button>
      </div>

      <div class="error-suggestions">
        <p>您可以尝试：</p>
        <ul>
          <li>检查网址是否正确</li>
          <li>通过导航菜单浏览站点</li>
          <li>搜索您需要的内容</li>
        </ul>
      </div>
    </div>

    <div class="floating-elements">
      <span class="float-element float-1">📄</span>
      <span class="float-element float-2">🔗</span>
      <span class="float-element float-3">📁</span>
      <span class="float-element float-4">🌐</span>
      <span class="float-element float-5">📱</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

$secondary-color: #764ba2;
$accent-color: #f093fb;

.not-found-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 50%, $accent-color 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: $spacing-xl;
}

.not-found-content {
  text-align: center;
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  @include transition(all, 0.6s);
}

.not-found-content.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  color: rgba($bg-color-page, 0.1);
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
}

.error-icon {
  font-size: 5rem;
  margin-bottom: $spacing-lg;
  position: relative;
  z-index: 1;
}

.not-found-content h1 {
  color: $bg-color-page;
  font-size: 2.5rem;
  margin: 0 0 $spacing-sm 0;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.not-found-content p {
  color: rgba($bg-color-page, 0.8);
  font-size: 1.1rem;
  margin: 0 0 $spacing-xl 0;
  position: relative;
  z-index: 1;
}

.error-actions {
  display: flex;
  gap: $spacing-lg;
  justify-content: center;
  position: relative;
  z-index: 1;
  margin-bottom: $spacing-xxl;
}

.action-btn {
  padding: $spacing-md $spacing-xl;
  border: none;
  border-radius: $radius-xl;
  font-size: $font-size-base;
  font-weight: 600;
  cursor: pointer;
  @include transition(all, 0.3s);
}

.action-btn.primary {
  background: $bg-color-page;
  color: $primary-color;
}

.action-btn.primary:hover {
  transform: translateY(-3px);
  @include box-shadow(lg);
  filter: drop-shadow(0 8px 25px rgba(255, 255, 255, 0.3));
}

.action-btn.secondary {
  background: rgba($bg-color-page, 0.2);
  color: $bg-color-page;
  border: 2px solid rgba($bg-color-page, 0.3);
}

.action-btn.secondary:hover {
  background: rgba($bg-color-page, 0.3);
  transform: translateY(-3px);
}

.error-suggestions {
  background: rgba($bg-color-page, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: $spacing-lg $spacing-xl;
  border-radius: $radius-lg;
  position: relative;
  z-index: 1;
}

.error-suggestions p {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-sm;
}

.error-suggestions ul {
  margin: 0;
  padding-left: $spacing-lg;
  text-align: left;
}

.error-suggestions li {
  color: rgba($bg-color-page, 0.9);
  font-size: $font-size-sm;
  margin-bottom: $spacing-xs;
}

.error-suggestions li:last-child {
  margin-bottom: 0;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.float-element {
  position: absolute;
  font-size: 2rem;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.float-1 {
  top: 15%;
  left: 10%;
  animation-delay: 0s;
}

.float-2 {
  top: 30%;
  right: 15%;
  animation-delay: 1s;
}

.float-3 {
  bottom: 40%;
  left: 20%;
  animation-delay: 2s;
}

.float-4 {
  bottom: 25%;
  right: 25%;
  animation-delay: 3s;
}

.float-5 {
  top: 50%;
  left: 60%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

@include media-query($breakpoint-md) {
  .error-code {
    font-size: 5rem;
    top: 10%;
  }

  .not-found-content h1 {
    font-size: 1.8rem;
  }

  .not-found-content p {
    font-size: 1rem;
  }

  .error-actions {
    flex-direction: column;
    gap: $spacing-md;
  }

  .action-btn {
    width: 100%;
    max-width: 280px;
  }

  .error-suggestions {
    padding: $spacing-md $spacing-lg;
  }
}
</style>
