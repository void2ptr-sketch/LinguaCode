import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import {
  applyColorSchemeToDocument,
  readStoredColorScheme,
} from './app/core/theme/app-color-scheme.utils';

applyColorSchemeToDocument(readStoredColorScheme());

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
