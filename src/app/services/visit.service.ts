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
    
    // Check if total visits < 5
    const qTotal = query(visitsRef, where('participantId', '==', participantId));
    const totalVisitsSnap = await getDocs(qTotal);
    if (totalVisitsSnap.size >= 5) {
      return { success: false, message: 'El participante ya alcanzó el máximo de 5 visitas.' };
    }

    // Check last visit to prevent repeating stand sequentially
    // We order them by time or just check all and find the latest. Real apps use orderBy('fecha', 'desc') 
    // but requires index. We'll sort in memory since size is max 5.
    const allVisits = totalVisitsSnap.docs.map(d => d.data() as Visit);
    allVisits.sort((a, b) => {
      const timeA = a.fecha instanceof Timestamp ? a.fecha.toMillis() : new Date(a.fecha).getTime();
      const timeB = b.fecha instanceof Timestamp ? b.fecha.toMillis() : new Date(b.fecha).getTime();
      return timeB - timeA; // descending
    });

    if (allVisits.length > 0) {
      const lastVisit = allVisits[0];
      if (lastVisit.standId === standId) {
         // Optionally, "permitir después de tiempo": could check if time difference is > X minutes.
         // Let's say 10 minutes.
         const now = Date.now();
         const lastTime = lastVisit.fecha instanceof Timestamp ? lastVisit.fecha.toMillis() : new Date(lastVisit.fecha).getTime();
         const diffMinutes = (now - lastTime) / 60000;
         if (diffMinutes < 10) {
           return { success: false, message: 'No se puede repetir el stand seguidamente tan rápido (espera 10 min).' };
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
}
