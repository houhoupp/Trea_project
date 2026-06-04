// src/types/navigation.ts

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string; // 可选，因为父级菜单通常没有链接
  badge?: string; // 可选
  badgeType?: "primary" | "success" | "warning" | "danger" | "info"; // Element Plus 支持的 Badge 类型
  children?: NavItem[]; // 递归定义，允许嵌套子菜单
}
