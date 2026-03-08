import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonList, IonListHeader, 
  IonItem, IonIcon, IonLabel, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, podiumOutline } from 'ionicons/icons';
import { ReportService } from '../services/report.service';
import { StandService } from '../services/stand.service';
import { Stand } from '../models/stand.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonList, IonListHeader, 
    IonItem, IonIcon, IonLabel, IonBadge,
    CommonModule
  ]
})
export class ReportsPage implements OnInit {
  private reportService = inject(ReportService);
  private standService = inject(StandService);

  visitsPerStand: { standId: string, standName?: string, count: number }[] = [];
  mostVisitedStand: { standId: string, standName?: string, count: number } | null = null;
  stands$: Observable<Stand[]> = this.standService.getStands();
  
  allStands: Stand[] = [];

  constructor() {
    addIcons({ trophyOutline, podiumOutline });
  }

  ngOnInit() {
    this.stands$.subscribe(async (stands) => {
      this.allStands = stands;
      await this.loadReports();
    });
  }

  async loadReports() {
    const counts = await this.reportService.getVisitsPerStand();
    this.visitsPerStand = counts.map(c => {
      const stand = this.allStands.find(s => s.id === c.standId);
      return {
        ...c,
        standName: stand ? stand.nombre : c.standId
      };
    });

    const mostVisited = await this.reportService.getMostVisitedStand();
    if (mostVisited) {
      const stand = this.allStands.find(s => s.id === mostVisited.standId);
      this.mostVisitedStand = {
        ...mostVisited,
        standName: stand ? stand.nombre : mostVisited.standId
      };
    }
  }
}

