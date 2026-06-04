<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useNavigation } from "../composables/useNavigation";
import NavSubmenu from "./NavSubmenu.vue";
import { ElMenu, ElButton } from "element-plus";
import { Menu, ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const APP_CONFIG = window.__APP_CONFIG__.TITLE;

const { items, activeId, expandedIds, isCollapsed, isLoading, toggleExpanded, toggleCollapsed } = useNavigation();

const isMobileMenuOpen = ref(false);
const showMobileMenu = ref(false);
const touchStartX = ref(0);
const touchEndX = ref(0);
const navContainerRef = ref(null);

const defaultActive = computed(() => activeId.value || "");
const defaultOpeneds = computed(() => Array.from(expandedIds.value));

const activeIds = computed(() => {
  if (!activeId.value) return [];

  function findParentIds(items, targetId, parentIds = []) {
    for (const item of items) {
      if (item.id === targetId) {
        return [...parentIds, item.id];
      }
      if (item.children) {
        const result = findParentIds(item.children, targetId, [...parentIds, item.id]);
        if (result.length > 0) {
          return result;
        }
      }
    }
    return [];
  }

  return findParentIds(items.value, activeId.value);
});

function isItemActive(item) {
  return activeIds.value.includes(item.id);
}

function isItemExpanded(item) {
  return expandedIds.value.has(item.id);
}

function handleSelect(item) {
  isMobileMenuOpen.value = false;
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

function handleOverlayClick() {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = "";
}

function handleResize() {
  const isMobile = window.innerWidth <= 768;
  showMobileMenu.value = isMobile;

  if (!isMobile && isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
    document.body.style.overflow = "";
  }
}

function handleTouchStart(event) {
  touchStartX.value = event.touches[0].clientX;
}

function handleTouchEnd(event) {
  touchEndX.value = event.changedTouches[0].clientX;
  handleSwipe();
}

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX.value - touchEndX.value;

  if (diff > swipeThreshold && !isMobileMenuOpen.value) {
    toggleMobileMenu();
  } else if (diff < -swipeThreshold && isMobileMenuOpen.value) {
    toggleMobileMenu();
  }
}

function handleMenuOpen(index) {
  toggleExpanded(index);
}

function handleMenuClose(index) {
  toggleExpanded(index);
}

watch(isMobileMenuOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
});

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleGlobalKeydown);
  document.body.style.overflow = "";
});

function handleGlobalKeydown(event) {
  const target = event.target;
  const isInNav = target.closest(".side-nav");

  if (!isInNav && event.key === "Escape" && isMobileMenuOpen.value) {
    toggleMobileMenu();
  }

  if (!isInNav && event.key === "/" && event.ctrlKey) {
    event.preventDefault();
    navContainerRef.value?.focus();
  }

  if (!isInNav && event.key === "b" && event.ctrlKey) {
    event.preventDefault();
    toggleCollapsed();
  }
}
</script>

<template>
  <nav
    ref="navContainerRef"
    class="side-nav"
    :class="{
      'is-collapsed': isCollapsed,
      'is-mobile': showMobileMenu,
      'is-mobile-open': isMobileMenuOpen,
    }"
    role="navigation"
    aria-label="主导航"
    tabindex="-1"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <ElButton
      v-if="showMobileMenu"
      class="mobile-menu-toggle"
      :icon="Menu"
      :aria-expanded="isMobileMenuOpen"
      :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
      @click="toggleMobileMenu"
    />

    <div v-if="showMobileMenu" class="nav-overlay" :class="{ 'is-visible': isMobileMenuOpen }" @click="handleOverlayClick"></div>

    <div
      class="nav-container"
      :class="{
        'is-open': isMobileMenuOpen,
        'is-collapsed': isCollapsed,
      }"
    >
      <div class="nav-header" :class="{ 'is-collapsed': isCollapsed }">
        <div class="nav-logo" @click="showMobileMenu && toggleMobileMenu()">
          <span class="logo-icon" role="img" :aria-label="APP_CONFIG">🎮</span>
          <transition name="fade">
            <span v-if="!isCollapsed" class="logo-text">{{ APP_CONFIG }}</span>
          </transition>
        </div>
      </div>

      <div v-if="isLoading" class="nav-loading" role="status">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span class="loading-text">加载中...</span>
      </div>

      <transition name="fade" mode="out-in">
        <ElMenu
          v-if="!isLoading"
          class="nav-main el-menu-custom"
          mode="vertical"
          :default-openeds="defaultOpeneds"
          :collapse="isCollapsed"
          :unique-opened="false"
          @open="handleMenuOpen"
          @close="handleMenuClose"
          @select="handleSelect"
        >
          <NavSubmenu
            :items="items"
            :active-ids="activeIds"
            :expanded-ids="expandedIds"
            :is-collapsed="isCollapsed"
            :level="1"
            @toggle="toggleExpanded"
            @select="handleSelect"
          />
        </ElMenu>
      </transition>

      <!-- <div class="nav-footer" :class="{ 'is-collapsed': isCollapsed }">
        <ElButton
          class="nav-toggle"
          :icon="isCollapsed ? ArrowRight : ArrowLeft"
          :aria-expanded="!isCollapsed"
          :aria-label="isCollapsed ? '展开导航' : '收起导航'"
          @click="toggleCollapsed"
        >
          <span v-if="!isCollapsed" class="toggle-text">收起</span>
        </ElButton>

        <div v-if="showMobileMenu" class="mobile-footer">
          <div class="nav-divider" role="separator"></div>
          <div class="nav-version">v1.0.0</div>
        </div>
      </div> -->
    </div>
  </nav>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

.side-nav {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: $nav-width-expanded;
  background-color: $bg-color-page;
  box-shadow: $shadow-md;
  z-index: $z-index-sticky;
  display: flex;
  flex-direction: column;
  @include transition(width);

  &.is-collapsed {
    width: $nav-width-collapsed;
  }

  &.is-mobile {
    width: 0;
    overflow: hidden;
    background: none;
    box-shadow: none;
  }

  &.is-mobile-open {
    width: 100%;
  }

  &:focus-visible {
    outline: none;
  }
}

.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: $spacing-md;
  left: $spacing-md;
  z-index: $z-index-modal;
  padding: $spacing-md;
  background: $bg-color-page;
  border: none;
  border-radius: $radius-md;
  @include box-shadow(sm);
  cursor: pointer;
  color: $text-color-primary;
  @include transition(all);

  &:hover {
    transform: scale(1.05);
    @include box-shadow(md);
  }

  &:active {
    transform: scale(0.95);
  }
}

.nav-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: $z-index-sticky;
  opacity: 0;
  visibility: hidden;
  @include transition(all);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  &.is-visible {
    opacity: 1;
    visibility: visible;
  }
}

.nav-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  @include transition(all);
  -webkit-overflow-scrolling: touch;
}

.nav-header {
  padding: $spacing-xl $spacing-lg;
  border-bottom: 1px solid $border-color-dark;
  @include transition(padding);
  flex-shrink: 0;

  &.is-collapsed {
    padding: $spacing-md $spacing-sm;
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  @include transition(gap);

  &:hover .logo-icon {
    transform: scale(1.1);
  }
}

.logo-icon {
  font-size: $font-size-xxl;
  @include transition(transform);
}

.logo-text {
  font-size: $font-size-lg;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 0 20px;
}

.nav-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: $spacing-xxl * 1.5 $spacing-xl;
  gap: $spacing-lg;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid $border-color-light;
  border-top-color: $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: $font-size-base;
  color: $text-color-secondary;
}

.nav-main {
  list-style: none;
  margin: 0;
  padding: $spacing-sm;
  flex: 1;
  position: relative;
  border: none;
}

.nav-footer {
  padding: $spacing-sm;
  border-top: 1px solid $border-color-dark;
  background-color: #fafafa;
  @include transition(padding);
  flex-shrink: 0;

  &.is-collapsed {
    padding: $spacing-xs $spacing-xs;
  }
}

.nav-toggle {
  width: 100%;
  height: $nav-item-height - 4px;
  justify-content: center;
  align-items: center;
  border-radius: $radius-md;
  background: transparent;
  border: none;
  color: $text-color-secondary;
  @include transition(all);

  &:hover {
    background: $primary-light-9;
    color: $primary-color;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
}

.toggle-text {
  font-size: $font-size-xs;
  font-weight: 500;
  margin-left: $spacing-xs;
  @include transition(all);
}

.nav-footer.is-collapsed {
  .nav-toggle {
    border-radius: $radius-md;
    background: $primary-light-9;
    color: $primary-color;

    &:hover {
      background: $primary-color;
      color: $bg-color-page;
      @include box-shadow(md);
    }
  }
}

.nav-divider {
  height: 1px;
  background-color: $border-color-light;
  margin: $spacing-sm 0;
}

.nav-version {
  font-size: 11px;
  color: $text-color-placeholder;
  text-align: center;
  padding-bottom: $spacing-sm;
}

.el-menu-custom {
  border: none;
  background: transparent;
  padding: $spacing-xs 0;

  .el-menu-item,
  .el-sub-menu__title {
    margin: $spacing-xs $spacing-sm;
    border-radius: $radius-md;
    height: $nav-item-height;
    line-height: $nav-item-height;
    padding: 0 $spacing-md;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    @include transition(all);
  }

  .el-menu-item {
    &:hover {
      background: $primary-light-9;
      transform: translateX(4px);
    }

    &.is-active {
      background: linear-gradient(135deg, $primary-color 0%, #8b99f0 100%);
      color: $bg-color-page;
      @include box-shadow(md);
    }
  }

  .el-sub-menu__title {
    &:hover {
      background: $primary-light-9;
      transform: translateX(4px);
    }
  }
}

.side-nav.is-collapsed {
  .el-menu-custom {
    padding: $spacing-sm $spacing-xs;

    .el-menu-item,
    .el-sub-menu__title {
      margin: $spacing-sm $spacing-sm;
      border-radius: $radius-lg;
      height: $nav-item-height + 4px;
      justify-content: center;
      padding: 0;

      &:hover {
        transform: scale(1.05);
        background: $primary-light-9;
      }
    }

    .el-menu-item.is-active {
      @include box-shadow(lg);
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

@include media-query($breakpoint-md) {
  .side-nav {
    width: 0;
    overflow: hidden;
    background: none;
    box-shadow: none;

    &.is-mobile {
      width: 100%;
    }
  }

  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: $spacing-sm;
    left: $spacing-sm;
  }

  .nav-container {
    position: fixed;
    left: -($nav-width-expanded + 40px);
    top: 0;
    bottom: 0;
    width: $nav-width-expanded + 40px;
    max-width: 92vw;
    background: $bg-color-page;
    @include box-shadow(lg);
    @include transition(left);
    z-index: $z-index-modal;

    &.is-open {
      left: 0;
    }
  }

  .nav-overlay {
    display: block;
  }

  .side-nav.is-collapsed {
    .nav-container {
      width: $nav-width-collapsed;
      left: -$nav-width-collapsed;

      &.is-open {
        left: 0;
      }
    }
  }

  .nav-header {
    padding: $spacing-xxl $spacing-xl $spacing-xl;
  }

  .nav-main {
    padding: $spacing-md $spacing-sm;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
}

@include media-query($breakpoint-sm) {
  .nav-container {
    width: 100%;
    max-width: 100vw;
    left: -100%;
    @include box-shadow(xl);

    &.is-open {
      left: 0;
    }
  }

  .mobile-menu-toggle {
    top: $spacing-xs;
    left: $spacing-xs;
    padding: $spacing-sm;
    width: $nav-item-height;
    height: $nav-item-height;
    border-radius: $radius-lg;
  }

  .nav-header {
    padding: $spacing-xl $spacing-lg $spacing-md;
  }

  .nav-main {
    padding: $spacing-sm;
    max-height: calc(100vh - 110px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .side-nav,
  .nav-container,
  .nav-header,
  .nav-footer,
  .nav-logo,
  .logo-icon,
  .mobile-menu-toggle,
  .nav-overlay,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
    animation: none;
  }
}
</style>
