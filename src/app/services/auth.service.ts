import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { Participant } from '../models/participant.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/auth`; }

  private guestSubject = new BehaviorSubject<Participant | null>(null);
  public guest$ = this.guestSubject.asObservable();

  private localUserSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.localUserSubject.asObservable();

  /**
   * Login
   * Se comunica con auth.php. Recibe el usuario sin contraseña y el token criptográfico.
   * Almacena el token de sesión (`authToken`) y los datos del usuario (`localUser`) en `localStorage`.
   */
  async login(email: string, password: string) {
    this.guestSubject.next(null);

    const response: any = await this.http.post(`${this.apiUrl}/login`, { email, password }).toPromise();
    
    if (response && response.user && response.token) {
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        standId: response.user.standId,
        createdAt: response.user.createdAt ? new Date(response.user.createdAt) : new Date()
      };
      // Guardar el estado en memoria para que los componentes lo escuchen
      this.localUserSubject.next(user);
      
      // Persistencia local
      localStorage.setItem('localUser', JSON.stringify(user));
      localStorage.setItem('authToken', response.token); // Almacenar el token DB
      
      return { user: response.user };
    }
    throw new Error('Credenciales inválidas');
  }

  async guestLogin(email: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/guest-login`, { correo: email }).toPromise();
      if (response && response.found) {
        this.guestSubject.next(response.participant);
        this.localUserSubject.next(null);
        localStorage.removeItem('localUser');
        localStorage.removeItem('authToken');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Logout
   * Llama al endpoint de logout para borrar el token en MySQL (sessions).
   * Luego elimina el estado del usuario de la memoria y del localStorage.
   */
  async logout() {
    try {
      await this.http.post(`${this.apiUrl}/logout`, {}).toPromise();
    } catch (e) {
      // Ignorar errores de red en logout, forzamos la salida local.
    }
    this.guestSubject.next(null);
    this.localUserSubject.next(null);
    localStorage.removeItem('localUser');
    localStorage.removeItem('authToken');
  }

  /**
   * getUser
   * Retorna síncronamente el usuario actual en memoria. Utilizado extensivamente por 
   * componentes y Guards para validar permisos rápidos.
   */
  getCurrentUser() {
    return this.localUserSubject.getValue();
  }

  /**
   * restoreLocalSession
   * Lee del `localStorage` cuando la app arranca (desde main.ts o app.component).
   * Si existe el `localUser`, lo rehidrata a la variable de BehaviourSubject para mantener
   * la sesión activa ante recargas del navegador.
   // NOTA: Para un sistema 100% estricto, esto debería llamar a un `/me` en la API con el token.
   // Sin embargo, como el token se valida por cada llamada API con el interceptor, este approach 
   // es suficientemente robusto y permite una carga instantánea.
   */
  restoreLocalSession() {
    const stored = localStorage.getItem('localUser');
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        this.localUserSubject.next(user);
      } catch {
        localStorage.removeItem('localUser');
        localStorage.removeItem('authToken');
      }
    }
  }
}
