// Barrel exports for core infrastructure

// ===== Layout =====
export { HeaderComponent } from '../widgets/header/header.component';
export { FooterComponent } from '../widgets/footer/footer.component';
export { MainLayoutComponent } from '../widgets/main-layout/main-layout.component';

// ===== Security =====
export { sanitizePlainText, sanitizeMarkdownText, sanitizeTheme, isAllowedFontSize } from '../shared/security/input-sanitize.utils';
