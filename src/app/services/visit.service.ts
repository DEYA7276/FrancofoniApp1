import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Visit } from '../models/visit.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private apiUrl = `${environment.localApiUrl}/visits`;

  async registerVisit(participantId: string, standId: string): Promise<{ success: boolean; message: string; recommendation?: any }> {
    if (environment.useLocalBackend) {
      const response: any = await this.http.post(this.apiUrl, { participantId, standId }).toPromise();
      return response;
    }

    // Original Firestore logic
    const visitsRef = collection(this.firestore, 'visits');
    
    const qTotal = query(visitsRef, where('participantId', '==', participantId));
    const totalVisitsSnap = await getDocs(qTotal);
    const totalVisits = totalVisitsSnap.size;

    const allVisits = totalVisitsSnap.docs.map(d => d.data() as Visit);
    allVisits.sort((a, b) => {
      const timeA = a.fecha instanceof Timestamp ? a.fecha.toMillis() : new Date(a.fecha).getTime();
      const timeB = b.fecha instanceof Timestamp ? b.fecha.toMillis() : new Date(b.fecha).getTime();
      return timeB - timeA;
    });

    if (allVisits.length > 0) {
      const lastVisit = allVisits[0];
      
      if (lastVisit.standId === standId) {
        return { success: false, message: 'No se puede repetir el mismo stand consecutivamente.' };
      }

      if (totalVisits % 5 === 0) {
        const now = Date.now();
        const lastTime = lastVisit.fecha instanceof Timestamp ? lastVisit.fecha.toMillis() : new Date(lastVisit.fecha).getTime();
        const diffMinutes = (now - lastTime) / 60000;
        
        if (diffMinutes < 5) {
          const waitMinutes = Math.ceil(5 - diffMinutes);
          return { success: false, message: `Has completado un ciclo de 5 stands. Debes esperar ${waitMinutes} minuto(s) para continuar.` };
        }
      }
    }

    const visit: Visit = {
      participantId,
      standId,
      fecha: new Date().toISOString()
    };

    await addDoc(visitsRef, visit);
    return { success: true, message: 'Visita registrada con éxito.' };
  }

  getVisitsByStand(standId: string): Observable<Visit[]> {
    if (environment.useLocalBackend) {
      return this.http.get<Visit[]>(`${this.apiUrl}?standId=${standId}`);
    }
    const q = query(collection(this.firestore, 'visits'), where('standId', '==', standId));
    return collectionData(q, { idField: 'id' }) as Observable<Visit[]>;
  }

  getAllVisits(): Observable<Visit[]> {
    if (environment.useLocalBackend) {
      return this.http.get<Visit[]>(this.apiUrl);
    }
    const q = collection(this.firestore, 'visits');
    return collectionData(q, { idField: 'id' }) as Observable<Visit[]>;
  }

  async getParticipantVisits(participantId: string): Promise<Visit[]> {
    if (environment.useLocalBackend) {
      const visits: any = await this.http.get(`${this.apiUrl}?participantId=${participantId}`).toPromise();
      return visits as Visit[];
    }
    const visitsRef = collection(this.firestore, 'visits');
    const q = query(visitsRef, where('participantId', '==', participantId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit));
  }
}
