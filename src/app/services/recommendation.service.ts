import { Injectable, inject } from '@angular/core';
import { Stand } from '../models/stand.model';
import { ReportService } from './report.service';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private reportService = inject(ReportService);

  getSmartSuggestion(allStands: Stand[], visitedIds: string[]): Stand | null {
    // 1. Filter pending stands
    const pendingStands = allStands.filter(s => !visitedIds.includes(s.id || ''));
    
    if (pendingStands.length === 0) return null;

    // 2. Intelligent choice: Random among pending to keep it dynamic
    const randomIndex = Math.floor(Math.random() * pendingStands.length);
    return pendingStands[randomIndex];
  }
}
