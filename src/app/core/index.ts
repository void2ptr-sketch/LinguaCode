// Barrel exports for core infrastructure

// ===== Layout =====
export { HeaderComponent } from './layout/header/header.component';
export { FooterComponent } from './layout/footer/footer.component';
export { MainLayoutComponent } from './layout/main-layout/main-layout.component';

// ===== Security =====
export { sanitizePlainText, sanitizeMarkdownText, sanitizeTheme, isAllowedFontSize } from './security/input-sanitize.utils';
