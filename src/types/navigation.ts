export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: string;
  badgeType?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  children?: NavItem[];
  isActive?: boolean;
  isExpanded?: boolean;
}

export interface NavigationState {
  items: NavItem[];
  activeId: string | null;
  expandedIds: Set<string>;
  isCollapsed: boolean;
}

export type NavAction =
  | { type: 'SET_ITEMS'; payload: NavItem[] }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'TOGGLE_EXPANDED'; payload: string }
  | { type: 'SET_EXPANDED'; payload: string; value: boolean }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'SET_COLLAPSED'; payload: boolean };
