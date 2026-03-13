import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stand } from '../models/stand.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class StandService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/stands`; }

  getStands(): Observable<Stand[]> {
    return this.http.get<Stand[]>(this.apiUrl);
  }

  getStandById(id: string): Observable<Stand> {
    return this.http.get<Stand>(`${this.apiUrl}/${id}`);
  }

  getStandsByUsuarioId(usuarioId: string): Observable<Stand[]> {
    return this.http.get<Stand[]>(`${this.apiUrl}?usuarioId=${usuarioId}`);
  }

  async addStand(stand: Stand): Promise<{ id: string }> {
    const response: any = await this.http.post(this.apiUrl, stand).toPromise();
    return { id: response.id };
  }

  updateStand(id: string, data: Partial<Stand>) {
    return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
  }

  deleteStand(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
  }

  async initializeStands() {
    const response: any = await this.http.post(`${this.apiUrl}/initialize`, {}).toPromise();
    return response?.initialized ?? false;
  }
}
