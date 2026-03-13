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

  async login(email: string, password: string) {
    this.guestSubject.next(null);

    const response: any = await this.http.post(`${this.apiUrl}/login`, { email, password }).toPromise();
    
    if (response && response.user) {
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
        standId: response.user.standId,
        createdAt: response.user.createdAt ? new Date(response.user.createdAt) : new Date()
      };
      this.localUserSubject.next(user);
      localStorage.setItem('localUser', JSON.stringify(user));
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
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async logout() {
    this.guestSubject.next(null);
    this.localUserSubject.next(null);
    localStorage.removeItem('localUser');
  }

  getCurrentUser() {
    return this.localUserSubject.getValue();
  }

  restoreLocalSession() {
    const stored = localStorage.getItem('localUser');
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        this.localUserSubject.next(user);
      } catch {
        localStorage.removeItem('localUser');
      }
    }
  }
}
