import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visit } from '../models/visit.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/visits`; }

  async registerVisit(participantId: string, standId: string): Promise<{
    success: boolean;
    message: string;
    participantNombre?: string;
    recommendation?: any;
  }> {
    const response: any = await this.http.post(this.apiUrl, { participantId, standId }).toPromise();
    return response;
  }

  registerOfflineVisit(participantId: string, standId: string) {
    const queue = this.getOfflineQueue();
    const exists = queue.find(v => v.participantId === participantId && v.standId === standId);
    if (!exists) {
      queue.push({ participantId, standId, timestamp: Date.now() });
      localStorage.setItem('offline_visits_queue', JSON.stringify(queue));
    }
  }

  getOfflineQueue(): { participantId: string, standId: string, timestamp: number }[] {
    const data = localStorage.getItem('offline_visits_queue');
    return data ? JSON.parse(data) : [];
  }

  async syncOfflineVisits(): Promise<number> {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;
    
    let syncedCount = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        await this.http.post(this.apiUrl, { 
          participantId: item.participantId, 
          standId: item.standId,
          isOfflineSync: true 
        }).toPromise();
        syncedCount++;
      } catch (err: any) {
        if (err.status === 0) {
          remainingQueue.push(item);
        }
      }
    }

    localStorage.setItem('offline_visits_queue', JSON.stringify(remainingQueue));
    return syncedCount;
  }

  getVisitsByStand(standId: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}?standId=${standId}`);
  }

  getAllVisits(): Observable<Visit[]> {
    return this.http.get<Visit[]>(this.apiUrl);
  }

  async getParticipantVisits(participantId: string): Promise<Visit[]> {
    const visits: any = await this.http.get(`${this.apiUrl}?participantId=${participantId}`).toPromise();
    return visits as Visit[];
  }
}
