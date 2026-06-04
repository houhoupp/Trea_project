import type { NavItem } from "../types/navigation";

export const navigationData: NavItem[] = [
  {
    id: "home",
    label: "首页",
    icon: "🏠",
    href: "/home",
  },
  {
    id: "rouge",
    label: "肉鸽射击",
    icon: "⚔️",
    href: "/rouge",
    // badge: "NEW",
    // badgeType: "danger",
  },

  {
    id: "services",
    label: "服务套餐",
    icon: "🎯",
    children: [
      {
        id: "services-basic",
        label: "基础套餐",
        icon: "⭐",
        href: "/services/basic",
        badge: "热门",
        badgeType: "primary",
      },
      {
        id: "services-pro",
        label: "专业套餐",
        icon: "🌟",
        href: "/services/pro",
        badge: "推荐",
        badgeType: "success",
      },
      {
        id: "services-enterprise",
        label: "企业套餐",
        icon: "👑",
        href: "/services/enterprise",
        badge: "定制",
        badgeType: "warning",
      },
    ],
  },
  {
    id: "pricing",
    label: "价格区间",
    icon: "💰",
    children: [
      {
        id: "pricing-budget",
        label: "经济型",
        icon: "💵",
        href: "/pricing/budget",
        badge: "< ¥100",
        badgeType: "primary",
      },
      {
        id: "pricing-standard",
        label: "标准型",
        icon: "💴",
        href: "/pricing/standard",
        badge: "¥100-500",
        badgeType: "primary",
      },
      {
        id: "pricing-premium",
        label: "高端型",
        icon: "💎",
        href: "/pricing/premium",
        badge: "¥500+",
        badgeType: "danger",
      },
    ],
  },
  {
    id: "products",
    label: "产品中心",
    icon: "📦",
    children: [
      {
        id: "products-software",
        label: "软件服务",
        icon: "💻",
        children: [
          { id: "products-saas", label: "SaaS平台", icon: "☁️", href: "/products/saas" },
          { id: "products-crm", label: "CRM系统", icon: "📊", href: "/products/crm" },
          { id: "products-erp", label: "ERP系统", icon: "🏢", href: "/products/erp" },
        ],
      },
      {
        id: "products-hardware",
        label: "硬件设备",
        icon: "🖥️",
        children: [
          { id: "products-server", label: "服务器", icon: "🔧", href: "/products/server" },
          { id: "products-network", label: "网络设备", icon: "🔗", href: "/products/network" },
        ],
      },
      {
        id: "products-consulting",
        label: "咨询服务",
        icon: "🤝",
        href: "/products/consulting",
      },
    ],
  },
  {
    id: "support",
    label: "客户支持",
    icon: "🛠️",
    children: [
      {
        id: "support-help",
        label: "帮助中心",
        icon: "❓",
        href: "/support/help",
      },
      {
        id: "support-docs",
        label: "文档中心",
        icon: "📚",
        href: "/support/docs",
      },
      {
        id: "support-contact",
        label: "联系我们",
        icon: "📞",
        href: "/support/contact",
        badge: "24/7",
        badgeType: "success",
      },
    ],
  },
  {
    id: "about",
    label: "关于我们",
    icon: "👋",
    href: "/about",
  },
];

export async function fetchNavigationData(): Promise<NavItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(navigationData);
    }, 300);
  });
}

export function getNavItemById(id: string): NavItem | undefined {
  function findItem(items: NavItem[]): NavItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children);
        if (found) return found;
      }
    }
    return undefined;
  }
  return findItem(navigationData);
}

export function getNavItemsWithHref(): NavItem[] {
  const result: NavItem[] = [];
  function collect(items: NavItem[]) {
    for (const item of items) {
      if (item.href) {
        result.push(item);
      }
      if (item.children) {
        collect(item.children);
      }
    }
  }
  collect(navigationData);
  return result;
}
