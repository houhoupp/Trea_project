<script setup>
import { ref, onMounted } from "vue";
import GomokuGame from "../components/GomokuGame.vue";
import SideNavigation from "../components/SideNavigation.vue";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const showWelcome = ref(false);
const floatingHearts = ref([]);

onMounted(() => {
  if (userStore.isLoggedIn) {
    setTimeout(() => {
      showWelcome.value = true;
      createHearts();
    }, 500);
  }
});

function createHearts() {
  for (let i = 0; i < 10; i++) {
    const heart = {
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    };
    floatingHearts.value.push(heart);
  }

  setTimeout(() => {
    floatingHearts.value = [];
  }, 4000);
}

function logout() {
  userStore.logout();
  window.location.href = "/login";
}
</script>

<template>
  <div class="app-layout">
    <SideNavigation />

    <main class="home-container">
      <div v-if="userStore.isLoggedIn" class="welcome-section">
        <div class="welcome-card" :class="{ show: showWelcome }">
          <div class="welcome-content">
            <h1 class="welcome-title">
              <span class="greeting">👋</span>
              欢迎回来, {{ userStore.username }}!
            </h1>
            <p class="welcome-subtitle">今天也要元气满满哦！</p>
            <button class="logout-btn" @click="logout">退出登录</button>
          </div>

          <div class="hearts-container">
            <span
              v-for="heart in floatingHearts"
              :key="heart.id"
              class="floating-heart"
              :style="{
                left: heart.left + '%',
                animationDelay: heart.delay + 's',
                animationDuration: heart.duration + 's',
              }"
              >❤️</span
            >
          </div>
        </div>
      </div>

      <div class="game-section">
        <div class="section-header">
          <h2 class="section-title">🎮 五子棋游戏</h2>
          <div class="title-decoration"></div>
        </div>
        <GomokuGame />
      </div>

      <div class="features-section">
        <h3 class="features-title">✨ 功能特性</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔐</div>
            <h4>安全登录</h4>
            <p>用户密码加密存储，安全可靠</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h4>五子连珠</h4>
            <p>经典棋盘游戏，双人对战</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h4>精美界面</h4>
            <p>现代化设计，流畅体验</p>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">15×15</div>
          <div class="stat-label">棋盘大小</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">2</div>
          <div class="stat-label">玩家人数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">5</div>
          <div class="stat-label">连珠获胜</div>
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

$secondary-color: #764ba2;
$accent-color: #f093fb;

.app-layout {
  display: flex;
  min-height: 100vh;
}

.home-container {
  flex: 1;
  min-height: 100vh;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 50%, $accent-color 100%);
  padding: $spacing-xl;
  margin-left: 240px;
  @include transition(margin-left);

  &.collapsed {
    margin-left: 60px;
  }
}

@include media-query($breakpoint-md) {
  .home-container {
    margin-left: 0;
    padding: $spacing-lg;
  }
}

.welcome-section {
  margin-bottom: $spacing-xxl;
}

.welcome-card {
  background: $bg-color-page;
  border-radius: $radius-xl;
  padding: $spacing-xxl;
  @include box-shadow(lg);
  opacity: 0;
  transform: translateY(-20px);
  @include transition(all);

  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-content {
  text-align: center;
  position: relative;
  z-index: 10;
}

.welcome-title {
  font-size: 2rem;
  color: $text-color-primary;
  margin: 0 0 $spacing-sm 0;
  animation: bounceIn 0.6s ease;
}

.greeting {
  font-size: 2.5rem;
  margin-right: $spacing-sm;
  animation: wave 1s ease-in-out infinite;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-20deg);
  }
  75% {
    transform: rotate(20deg);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.welcome-subtitle {
  font-size: 1.1rem;
  color: $text-color-regular;
  margin: 0 0 $spacing-xl 0;
}

.logout-btn {
  padding: $spacing-sm $spacing-xl;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: $bg-color-page;
  border: none;
  border-radius: $radius-xl;
  font-size: 0.9rem;
  cursor: pointer;
  @include transition(transform, box-shadow);

  &:hover {
    transform: translateY(-2px);
    @include box-shadow(md);
  }
}

.hearts-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-heart {
  position: absolute;
  bottom: -50px;
  font-size: $font-size-xl;
  opacity: 0;
  animation: floatUp 2s ease-out forwards;
}

@keyframes floatUp {
  0% {
    bottom: -50px;
    opacity: 1;
    transform: translateX(0) rotate(0deg);
  }
  50% {
    opacity: 1;
  }
  100% {
    bottom: 120%;
    opacity: 0;
    transform: translateX(30px) rotate(180deg);
  }
}

.game-section {
  margin-bottom: $spacing-xl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.section-title {
  font-size: 1.8rem;
  color: $bg-color-page;
  margin: 0 0 $spacing-sm 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.title-decoration {
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  margin: 0 auto;
  border-radius: $radius-sm;
}

.features-section {
  background: $bg-color-page;
  border-radius: $radius-xl;
  padding: $spacing-xxl;
  margin-bottom: $spacing-xl;
  @include box-shadow(md);
}

.features-title {
  text-align: center;
  font-size: 1.5rem;
  color: $text-color-primary;
  margin: 0 0 $spacing-xl 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $spacing-xl;
}

.feature-card {
  text-align: center;
  padding: $spacing-xl;
  background: $bg-color-base;
  border-radius: $radius-lg;
  @include transition(transform, box-shadow);

  &:hover {
    transform: translateY(-5px);
    @include box-shadow(md);
  }
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: $spacing-md;
}

.feature-card h4 {
  margin: 0 0 $spacing-sm 0;
  color: $text-color-primary;
  font-size: 1.1rem;
}

.feature-card p {
  margin: 0;
  color: $text-color-regular;
  font-size: 0.9rem;
}

.stats-section {
  display: flex;
  justify-content: center;
  gap: $spacing-xxl;
  padding: $spacing-xl;
}

.stat-item {
  text-align: center;
  background: rgba($bg-color-page, 0.2);
  backdrop-filter: blur(10px);
  padding: $spacing-xl;
  border-radius: $radius-lg;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: $bg-color-page;
  margin-bottom: $spacing-xs;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba($bg-color-page, 0.8);
}

@include media-query($breakpoint-sm) {
  .stats-section {
    flex-direction: column;
    gap: $spacing-lg;
  }

  .welcome-title {
    font-size: 1.5rem;
  }
}
</style>
