/**
 * Configuration for a tab on the home page.
 *
 * @remarks
 * Used to build the tab navigation bar dynamically.
 */
export type HomeTab = {
  label: string;
  path: string;
  exact?: boolean;
};

/**
 * A link displayed in the home page section links area.
 *
 * @remarks
 * Used to render quick-access links with icons and descriptions.
 */
export type HomeSectionLink = {
  label: string;
  path: string;
  icon: string;
  description: string;
};
