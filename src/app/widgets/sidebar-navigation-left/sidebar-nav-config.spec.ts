import { SIDEBAR_NAV_CONFIG } from './sidebar-nav-config';
import type { NavGroup, NavItem } from './sidebar-nav-config';

const flatItems = (groups: readonly NavGroup[]): readonly NavItem[] =>
  groups.flatMap((group) => group.items);

describe('SIDEBAR_NAV_CONFIG', () => {
  it('defines learning, tools, admin and account groups', () => {
    expect(SIDEBAR_NAV_CONFIG.map((group) => group.id)).toEqual([
      'learning',
      'tools',
      'admin',
      'account',
    ]);
  });

  it('learning items have no role restriction (accessible to all roles)', () => {
    const learning = SIDEBAR_NAV_CONFIG.find((g) => g.id === 'learning');
    expect(learning?.items.length).toBeGreaterThan(0);
    for (const item of learning?.items ?? []) {
      expect(item.roles).toBeUndefined();
    }
  });

  it('account items have no role restriction (accessible to all roles)', () => {
    const account = SIDEBAR_NAV_CONFIG.find((g) => g.id === 'account');
    expect(account?.items.length).toBeGreaterThan(0);
    for (const item of account?.items ?? []) {
      expect(item.roles).toBeUndefined();
    }
  });

  it('tools items are restricted to ROLE_AUTHOR / ROLE_ADMIN', () => {
    const tools = SIDEBAR_NAV_CONFIG.find((g) => g.id === 'tools');
    expect(tools?.items.length).toBeGreaterThan(0);
    for (const item of tools?.items ?? []) {
      expect(item.roles).toEqual(['ROLE_AUTHOR', 'ROLE_ADMIN']);
    }
  });

  it('admin items are restricted to ROLE_ADMIN', () => {
    const admin = SIDEBAR_NAV_CONFIG.find((g) => g.id === 'admin');
    expect(admin?.items.length).toBeGreaterThan(0);
    for (const item of admin?.items ?? []) {
      expect(item.roles).toEqual(['ROLE_ADMIN']);
    }
  });

  it('does not contain removed scenario-builder entry', () => {
    const items = flatItems(SIDEBAR_NAV_CONFIG);
    expect(items.find((item) => item.path === '/tools/scenario-builder')).toBeUndefined();
  });

  it('all items have label, path and icon', () => {
    for (const item of flatItems(SIDEBAR_NAV_CONFIG)) {
      expect(item.label).toBeTruthy();
      expect(item.path.startsWith('/')).toBe(true);
      expect(item.icon).toBeTruthy();
    }
  });
});
