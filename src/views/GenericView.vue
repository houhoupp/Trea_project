<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getNavItemById } from "../data/navigationData";
import { useUserStore } from "../stores/user";

const route = useRoute();
const navItem = ref(null);
const isLoading = ref(true);
const userStore = useUserStore();

onMounted(() => {
  const item = getNavItemById(route.name || "");
  navItem.value = item;
  setTimeout(() => {
    isLoading.value = false;
  }, 300);
});

function goBack() {
  window.history.back();
}
</script>

<template>
  <el-watermark :width="130" :height="40" fontSize="50px" :content="userStore.username">
    <div class="generic-container">
      <div class="page-header">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>返回</span>
        </button>

        <div v-if="isLoading" class="header-loading">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <transition name="fade">
          <div v-if="!isLoading && navItem" class="header-content">
            <span class="page-icon">{{ navItem.icon }}</span>
            <h1 class="page-title">{{ navItem.label }}</h1>
          </div>
        </transition>
      </div>

      <div class="page-content">
        <transition name="slide-up">
          <div v-if="!isLoading && navItem" class="content-card">
            <div class="card-icon">{{ navItem.icon }}</div>
            <h2>{{ navItem.label }}</h2>
            <p>欢迎访问「{{ navItem.label }}」页面</p>
            <div class="card-info">
              <span class="info-label">页面路径:</span>
              <code class="info-value">{{ route.path }}</code>
            </div>
            <div class="card-actions">
              <button class="action-btn primary" @click="goBack">返回首页</button>
            </div>
          </div>
        </transition>

        <div v-if="!isLoading && !navItem" class="content-card error">
          <div class="card-icon">⚠️</div>
          <h2>页面信息未找到</h2>
          <p>无法获取当前页面的详细信息</p>
          <div class="card-actions">
            <button class="action-btn primary" @click="goBack">返回首页</button>
          </div>
        </div>
      </div>
    </div>
  </el-watermark>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

$secondary-color: #764ba2;
$accent-color: #f093fb;

.generic-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 50%, $accent-color 100%);
  padding: $spacing-xl;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $spacing-xl;
  margin-bottom: $spacing-xxl;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-lg;
  background: rgba($bg-color-page, 0.2);
  border: none;
  border-radius: $radius-md;
  color: $bg-color-page;
  cursor: pointer;
  @include transition(all);
  font-size: $font-size-sm;

  &:hover {
    background: rgba($bg-color-page, 0.3);
    transform: translateX(-2px);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.header-loading {
  flex: 1;
  display: flex;
  justify-content: center;
}

.loading-dots {
  display: flex;
  gap: $spacing-sm;

  span {
    width: 8px;
    height: 8px;
    background: $bg-color-page;
    border-radius: 50%;
    animation: dotPulse 1.4s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}

.page-icon {
  font-size: $font-size-xxl;
}

.page-title {
  margin: 0;
  color: $bg-color-page;
  font-size: 1.8rem;
  font-weight: 600;
}

.page-content {
  display: flex;
  justify-content: center;
}

.content-card {
  background: $bg-color-page;
  border-radius: $radius-xl;
  padding: $spacing-xxl;
  text-align: center;
  @include box-shadow(lg);
  max-width: 500px;
  width: 100%;

  &.error {
    background: rgba($danger-color, 0.05);

    h2 {
      color: $danger-color;
    }
  }
}

.card-icon {
  font-size: 4rem;
  margin-bottom: $spacing-xl;
}

.content-card h2 {
  margin: 0 0 $spacing-xs 0;
  color: $text-color-primary;
  font-size: 1.5rem;
}

.content-card p {
  margin: 0 0 $spacing-xl 0;
  color: $text-color-regular;
  font-size: $font-size-base;
}

.card-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xxl;
  padding: $spacing-md $spacing-lg;
  background: $bg-color-base;
  border-radius: $radius-md;
}

.info-label {
  font-size: $font-size-sm;
  color: $text-color-regular;
}

.info-value {
  font-family: monospace;
  font-size: $font-size-sm;
  color: $primary-color;
  background: $bg-color-page;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: $spacing-md;
}

.action-btn {
  padding: $spacing-md $spacing-xl;
  border: none;
  border-radius: $radius-xl;
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;
  @include transition(all);

  &.primary {
    background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
    color: $bg-color-page;

    &:hover {
      transform: translateY(-2px);
      @include box-shadow(md);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  @include transition(opacity);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  @include transition(all);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@include media-query($breakpoint-md) {
  .generic-container {
    padding: $spacing-lg;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .content-card {
    padding: $spacing-xxl $spacing-xl;
  }

  .card-icon {
    font-size: 3rem;
  }
}
</style>
