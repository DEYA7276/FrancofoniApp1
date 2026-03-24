import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BackendModeService } from '../services/backend-mode.service';

/**
 * Auth Interceptor
 * 
 * Este interceptor captura automáticamente TODAS las peticiones HTTP (get, post, etc.)
 * que la aplicación de Angular trate de hacer.
 * 
 * Si la petición va dirigida hacia nuestro API Backend:
 * Busca el 'authToken' en localStorage y añade un Header HTTP "Authorization: Bearer <token>".
 * Esto es necesario porque ahora los midlewares de PHP exigen este Token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const modeService = inject(BackendModeService);
  const token = localStorage.getItem('authToken');
  const isApiUrl = req.url.startsWith(modeService.localApiUrl);

  if (token && isApiUrl) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // Si no hay token o no es nuestra API (ej. descargar imagen externa), 
  // se manda la petición original.
  return next(req);
};
