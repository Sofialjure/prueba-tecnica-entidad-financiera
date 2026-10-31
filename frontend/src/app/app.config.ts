import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { errorInterceptor } from './core/http/error.interceptor';

// Colombian formats: $ 1.799.200,00 and dd/MM/yyyy
registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' },
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
  ],
};
