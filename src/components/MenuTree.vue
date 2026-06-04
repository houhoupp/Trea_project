<template>
  <template v-for="item in menuList" :key="item.id">
    <!-- 情况1：有子菜单 (el-sub-menu) -->
    <el-sub-menu v-if="item.children && item.children.length" :index="item.id">
      <template #title>
        <!-- 图标 -->
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </template>
      <!-- 递归调用自身，传入子级数据 -->
      <MenuTree :menuList="item.children" />
    </el-sub-menu>

    <!-- 情况2：没有子菜单，是叶子节点 (el-menu-item) -->
    <el-menu-item v-else :index="item.href">
      <span class="menu-icon">{{ item.icon }}</span>
      <template #title>
        <span>{{ item.label }}</span>
      </template>
      <!-- 徽标 Badge 渲染 -->
      <template v-if="item.badge" #title>
        <el-badge :value="item.badge" :type="item.badgeType || 'primary'" class="menu-badge">
          <span>{{ item.label }}</span>
        </el-badge>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import type { NavItem } from "../types/navigation";

defineProps<{
  menuList: NavItem[];
}>();
</script>

<style scoped>
.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}
/* 调整徽标在菜单中的位置 */
.menu-badge :deep(.el-badge__content) {
  right: 20px;
  transform: translateY(-50%) scale(0.8);
}
</style>
