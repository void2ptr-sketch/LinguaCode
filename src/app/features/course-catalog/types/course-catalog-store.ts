import type { CourseIndexEntry } from '../../../entities/course/model';

/** Состояние каталога курсов (поиск, пагинация, прогресс). */
export type CourseCatalogState = {
  // Course catalog data
  items: readonly CourseIndexEntry[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  progressByCourseId: Readonly<Record<string, number>>;
  completedCourseIds: ReadonlySet<string>;

  // Tab control
  selectedTabIndex: number;

  // Course filter (programs tab)
  selectedCourseId: string;
  /** When true, auto-sync from learningSession is suppressed until tab changes. */
  filterDismissedUntilTabChange: boolean;
};

export const initialState: CourseCatalogState = {
  // Course catalog data
  items: [],
  totalItems: 0,
  pageIndex: 0,
  pageSize: 10,
  loading: false,
  error: null,
  progressByCourseId: {},
  completedCourseIds: new Set(),

  // Tab control
  selectedTabIndex: 0,

  // Course filter (programs tab)
  selectedCourseId: '',
  filterDismissedUntilTabChange: false,
};
