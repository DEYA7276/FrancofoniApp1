import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Visit } from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private firestore = inject(Firestore);

  async registerVisit(participantId: string, standId: string): Promise<{ success: boolean; message: string }> {
    const visitsRef = collection(this.firestore, 'visits');
    
    // Get all visits for this participant to check limits
    const qTotal = query(visitsRef, where('participantId', '==', participantId));
    const totalVisitsSnap = await getDocs(qTotal);
    const totalVisits = totalVisitsSnap.size;

    // Check last visit for repeating stand or cooldown logic
    const allVisits = totalVisitsSnap.docs.map(d => d.data() as Visit);
    allVisits.sort((a, b) => {
      const timeA = a.fecha instanceof Timestamp ? a.fecha.toMillis() : new Date(a.fecha).getTime();
      const timeB = b.fecha instanceof Timestamp ? b.fecha.toMillis() : new Date(b.fecha).getTime();
      return timeB - timeA; // descending
    });

    if (allVisits.length > 0) {
      const lastVisit = allVisits[0];
      
      // Rule: cannot repeat the same stand immediately
      if (lastVisit.standId === standId) {
        return { success: false, message: 'No se puede repetir el mismo stand consecutivamente.' };
      }

      // Rule: Every 5 stands, must wait 5 minutes
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

    // Save visit
    const visit: Visit = {
      participantId,
      standId,
      fecha: new Date().toISOString()
    };

    await addDoc(visitsRef, visit);
    return { success: true, message: 'Visita registrada con éxito.' };
  }

  getVisitsByStand(standId: string): Observable<Visit[]> {
    const q = query(collection(this.firestore, 'visits'), where('standId', '==', standId));
    return collectionData(q, { idField: 'id' }) as Observable<Visit[]>;
  }

  getAllVisits(): Observable<Visit[]> {
    const q = collection(this.firestore, 'visits');
    return collectionData(q, { idField: 'id' }) as Observable<Visit[]>;
  }

  async getParticipantVisits(participantId: string): Promise<Visit[]> {
    const visitsRef = collection(this.firestore, 'visits');
    const q = query(visitsRef, where('participantId', '==', participantId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit));
  }
}
