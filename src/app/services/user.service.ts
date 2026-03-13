import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/users`; }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  async createUserAdmin(email: string, password: string, role: 'admin'|'supervisor'|'usuario', standId?: string) {
    return this.http.post(this.apiUrl, { email, password, role, standId: standId || '' }).toPromise();
  }

  updateUser(id: string, data: Partial<User>) {
    return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
  }

  deleteUser(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
  }
}
