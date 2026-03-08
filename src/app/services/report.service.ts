import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Visit } from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private firestore = inject(Firestore);

  async getVisitsPerStand(): Promise<{ standId: string, count: number }[]> {
    const visitsRef = collection(this.firestore, 'visits');
    const snapshot = await getDocs(visitsRef);
    
    const countMap = new Map<string, number>();
    snapshot.docs.forEach(doc => {
      const data = doc.data() as Visit;
      countMap.set(data.standId, (countMap.get(data.standId) || 0) + 1);
    });

    return Array.from(countMap.entries()).map(([standId, count]) => ({ standId, count }));
  }

  async getMostVisitedStand(): Promise<{ standId: string, count: number } | null> {
    const counts = await this.getVisitsPerStand();
    if (counts.length === 0) return null;
    return counts.reduce((prev, current) => (prev.count > current.count) ? prev : current);
  }
}
