import { ref, computed, onMounted, onUnmounted } from "vue";
import type { NavItem, NavigationState } from "../types/navigation";
import { fetchNavigationData } from "../data/navigationData";

const CACHE_KEY = "navigation_data_v2";
const CACHE_TTL = 3600000;

export function useNavigation() {
  const items = ref<NavItem[]>([]);
  const activeId = ref<string | null>(null);
  const expandedIds = ref<Set<string>>(new Set());
  const isCollapsed = ref(false);
  const isLoading = ref(true);

  const state = computed<NavigationState>(() => ({
    items: items.value,
    activeId: activeId.value,
    expandedIds: expandedIds.value,
    isCollapsed: isCollapsed.value,
  }));

  async function loadNavigation() {
    isLoading.value = true;
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
      const now = Date.now();

      if (cachedData && cachedTime && now - parseInt(cachedTime) < CACHE_TTL) {
        items.value = JSON.parse(cachedData);
      } else {
        const data = await fetchNavigationData();
        items.value = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(`${CACHE_KEY}_time`, String(now));
      }

      const currentPath = window.location.pathname;
      setActiveByPath(currentPath);

      // 如果没有匹配到任何导航项，默认高亮第一个导航项（首页）
      if (!activeId.value && items.value.length > 0) {
        activeId.value = items.value[0].id;
      }
    } catch (error) {
      console.error("Failed to load navigation:", error);
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        items.value = JSON.parse(cachedData);
      }
    } finally {
      isLoading.value = false;
    }
  }

  function setActive(id: string | null) {
    activeId.value = id;
  }

  function setActiveByPath(path: string) {
    function findItem(items: NavItem[]): string | null {
      for (const item of items) {
        if (item.href === path) {
          return item.id;
        }
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    }
    const foundId = findItem(items.value);
    if (foundId) {
      activeId.value = foundId;
      expandParent(foundId);
    } else {
      // 路径匹配失败时，默认高亮第一个导航项
      if (items.value.length > 0) {
        activeId.value = items.value[0].id;
      }
    }
  }

  function toggleExpanded(id: string) {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id);
    } else {
      expandedIds.value.add(id);
    }
    expandedIds.value = new Set(expandedIds.value);
  }

  function setExpanded(id: string, value: boolean) {
    if (value) {
      expandedIds.value.add(id);
    } else {
      expandedIds.value.delete(id);
    }
    expandedIds.value = new Set(expandedIds.value);
  }

  function expandParent(childId: string) {
    function findParent(items: NavItem[], targetId: string): string | null {
      for (const item of items) {
        if (item.children?.some((child) => child.id === targetId || findParent(child.children || [], targetId))) {
          return item.id;
        }
      }
      return null;
    }
    const parentId = findParent(items.value, childId);
    if (parentId) {
      expandedIds.value.add(parentId);
      expandedIds.value = new Set(expandedIds.value);
      expandParent(parentId);
    }
  }

  function toggleCollapsed() {
    isCollapsed.value = !isCollapsed.value;
    localStorage.setItem("navCollapsed", String(isCollapsed.value));

    if (!isCollapsed.value) {
      expandedIds.value.clear();
      expandedIds.value = new Set(expandedIds.value);
    }
  }

  function setCollapsed(value: boolean) {
    isCollapsed.value = value;
    localStorage.setItem("navCollapsed", String(value));
  }

  function findItemById(items: NavItem[], id: string): NavItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  function navigateTo(href: string) {
    if (activeId.value) {
      setActive(findItemById(items.value, activeId.value)?.id || null);
    }
    window.location.href = href;
  }

  function setDefaultActive() {
    if (!activeId.value && items.value.length > 0) {
      activeId.value = items.value[0].id;
    }
  }

  function clearNavigationCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(`${CACHE_KEY}_time`);
  }

  function reloadNavigation() {
    clearNavigationCache();
    loadNavigation();
  }

  onMounted(() => {
    const saved = localStorage.getItem("navCollapsed");
    if (saved !== null) {
      isCollapsed.value = saved === "true";
    }
    loadNavigation();
    window.addEventListener("popstate", () => {
      setActiveByPath(window.location.pathname);
    });
  });

  onUnmounted(() => {
    window.removeEventListener("popstate", () => {
      setActiveByPath(window.location.pathname);
    });
  });

  return {
    state,
    items,
    activeId,
    expandedIds,
    isCollapsed,
    isLoading,
    setActive,
    setActiveByPath,
    toggleExpanded,
    setExpanded,
    toggleCollapsed,
    setCollapsed,
    navigateTo,
    loadNavigation,
    clearNavigationCache,
    reloadNavigation,
  };
}
