<script setup>
import { useRouter } from "vue-router";
import { ElMenuItem, ElSubMenu, ElBadge } from "element-plus";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  level: {
    type: Number,
    default: 1,
  },
});

const router = useRouter();

const currentLevel = (props.level || 1) + 1;

function hasChildren(item) {
  return item.children && item.children.length > 0;
}

function hasHref(item) {
  return !!item.href;
}

function handleClick(item) {
  if (hasHref(item) && item.href) {
    router.push(item.href).catch((err) => {
      console.warn("Navigation failed:", err);
    });
  }
}
</script>

<template>
  <template v-for="item in items" :key="item.id">
    <!-- Element Plus 原生 ElSubMenu 组件 -->
    <ElSubMenu v-if="hasChildren(item)" :index="item.id">
      <template #title>
        <span class="nav-icon" role="img" aria-hidden="true">{{ item.icon }}</span>
        <!-- 仅在一级菜单且收起时隐藏文字，二级/三级菜单始终显示 -->
        <span v-if="!(level === 1 && isCollapsed)" class="nav-label">{{ item.label }}</span>
        <ElBadge v-if="item.badge && !(level === 1 && isCollapsed)" :value="item.badge" :type="item.badgeType || 'info'" />
      </template>
      <!-- 递归渲染子菜单 -->
      <NavSubmenu :items="item.children" :is-collapsed="isCollapsed" :level="currentLevel" />
    </ElSubMenu>

    <!-- Element Plus 原生 ElMenuItem 组件 -->
    <ElMenuItem v-else :index="item.id" :route="item.href ? { path: item.href } : undefined" @click="handleClick(item)">
      <span class="nav-icon" role="img" aria-hidden="true">{{ item.icon }}</span>
      <!-- 仅在一级菜单且收起时隐藏文字，二级/三级菜单始终显示 -->
      <span v-if="!(level === 1 && isCollapsed)" class="nav-label">{{ item.label }}</span>
      <ElBadge v-if="item.badge && !(level === 1 && isCollapsed)" :value="item.badge" :type="item.badgeType || 'info'" />
    </ElMenuItem>
  </template>
</template>

<style lang="scss" scoped>
@use "../assets/scss/variables.scss" as *;
@use "../assets/scss/mixins.scss" as *;

.el-menu-item {
  .el-badge {
    display: flex;
  }
}
.nav-icon {
  font-size: $font-size-lg;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  color: $text-color-secondary;
  @include transition(all);
}

.nav-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: $font-size-base;
  font-weight: 500;
  color: $text-color-regular;
  @include transition(all);
  margin-left: 10px;
}

// 确保嵌套子菜单中的图标也能正确显示
:deep(.el-menu--popup) {
  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-base;
  }

  .nav-label {
    font-size: $font-size-base;
    color: $text-color-regular;
    line-height: 1.5;
  }
}
</style>
