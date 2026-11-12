import type { UserRole } from '../../entities/auth/services/role.service';

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[]; // undefined = всем
};

export type NavGroup = {
  id: string;
  label?: string;
  items: readonly NavItem[];
};

export const SIDEBAR_NAV_CONFIG: readonly NavGroup[] = [
  {
    id: 'learning',
    items: [
      { label: 'Карта', path: '/journey', icon: 'map' },
      { label: 'Практика', path: '/cards/select', icon: 'style' },
      { label: 'Обучение', path: '/home', icon: 'school' },
      { label: 'Каталог курсов', path: '/courses', icon: 'menu_book' },
    ],
  },
  {
    id: 'tools',
    items: [
      {
        label: 'Проводник контента',
        path: '/tools/content',
        icon: 'account_tree',
        roles: ['ROLE_AUTHOR', 'ROLE_ADMIN'],
      },
      {
        label: 'Языковые пары',
        path: '/tools/language-pairs',
        icon: 'swap_horiz',
        roles: ['ROLE_AUTHOR', 'ROLE_ADMIN'],
      },
      {
        label: 'Карточки',
        path: '/tools/cards',
        icon: 'style',
        roles: ['ROLE_AUTHOR', 'ROLE_ADMIN'],
      },
    ],
  },
  {
    id: 'account',
    items: [{ label: 'Профиль', path: '/user', icon: 'person_outline' }],
  },
];
