import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Modo 100% local — backend PHP/MySQL via XAMPP
// Firebase no se inicializa porque todos los servicios usan HttpClient directamente
const providers = [
  { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  provideIonicAngular(),
  provideRouter(routes, withPreloading(PreloadAllModules), withHashLocation()),
  provideHttpClient(withInterceptors([authInterceptor])),
];

bootstrapApplication(AppComponent, { providers });