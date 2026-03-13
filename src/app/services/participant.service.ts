import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/participants`; }

  getParticipants(): Observable<Participant[]> {
    return this.http.get<Participant[]>(this.apiUrl);
  }

  getParticipantById(id: string): Observable<Participant> {
    return this.http.get<Participant>(`${this.apiUrl}/${id}`);
  }

  async addParticipant(participant: Participant): Promise<string> {
    const response: any = await this.http.post(this.apiUrl, participant).toPromise();
    return response.id;
  }

  updateParticipant(id: string, data: Partial<Participant>) {
    return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
  }

  deleteParticipant(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
  }
}
