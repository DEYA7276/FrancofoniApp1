import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

/**
 * Admin Guard
 * Protege las rutas exclusivas de administración (como el panel principal).
 * Verifica no solo que el usuario exista, sino que también coincida su `role` 
 * con la cadena `'admin'`.
 * Si no es admin (ej. role='staff'), lo devuelve a la vista general (`/dashboard`).
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/dashboard']);
    })
  );
};
