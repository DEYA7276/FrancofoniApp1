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

  async getStandRatings(): Promise<{ standId: string, avgRating: number }[]> {
    const surveysRef = collection(this.firestore, 'surveys');
    const snapshot = await getDocs(surveysRef);
    
    const ratingMap = new Map<string, { total: number, count: number }>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      const standId = data.standId;
      // Calculate average of p1..p5 for this survey
      const p1 = parseInt(data.p1) || 0;
      const p2 = parseInt(data.p2) || 0;
      const p3 = parseInt(data.p3) || 0;
      const p4 = parseInt(data.p4) || 0;
      const p5 = parseInt(data.p5) || 0;
      const surveyAvg = (p1 + p2 + p3 + p4 + p5) / 5;

      if (!ratingMap.has(standId)) {
        ratingMap.set(standId, { total: 0, count: 0 });
      }
      const current = ratingMap.get(standId)!;
      current.total += surveyAvg;
      current.count += 1;
    });

    return Array.from(ratingMap.entries()).map(([standId, data]) => ({
      standId,
      avgRating: Number((data.total / data.count).toFixed(2))
    }));
  }

  async getVisitorPeaks(): Promise<{ time: string, count: number }[]> {
    const visitsRef = collection(this.firestore, 'visits');
    const snapshot = await getDocs(visitsRef);
    
    const peakMap = new Map<string, number>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as any;
      const fecha = data.fecha;
      let date: Date;
      
      if (fecha?.seconds) {
        date = new Date(fecha.seconds * 1000);
      } else {
        date = new Date(fecha);
      }

      // Group by hour for "peaks"
      const hourStr = `${date.getHours()}:00`;
      peakMap.set(hourStr, (peakMap.get(hourStr) || 0) + 1);
    });

    // Sort by hour
    const sorted = Array.from(peakMap.entries()).sort((a, b) => {
      const hA = parseInt(a[0]);
      const hB = parseInt(b[0]);
      return hA - hB;
    });

    return sorted.map(([time, count]) => ({ time, count }));
  }
}
