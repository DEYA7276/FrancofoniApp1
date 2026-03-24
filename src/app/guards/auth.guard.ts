import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

/**
 * Auth Guard
 * Intercepta la navegación del usuario de Ionic antes de cargar una página.
 * Escucha el BehaviorSubject del AuthService (`user$`) que representa al usuario actual.
 * Si el usuario existe en memoria, permite el acceso (`return true`).
 * Si es `null` o no hay nadie logueado, redirige automáticamente al `/login`.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
