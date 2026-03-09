import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonList, IonListHeader, 
  IonItem, IonIcon, IonLabel, IonBadge, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, podiumOutline } from 'ionicons/icons';
import { ReportService } from '../services/report.service';
import { StandService } from '../services/stand.service';
import { Stand } from '../models/stand.model';
import { Observable } from 'rxjs';
import { Chart, registerables } from 'chart.js/auto';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonList, IonListHeader, 
    IonItem, IonIcon, IonLabel, IonBadge, IonGrid, IonRow, IonCol,
    CommonModule
  ]
})
export class ReportsPage implements OnInit, AfterViewInit {
  private reportService = inject(ReportService);
  private standService = inject(StandService);

  @ViewChild('ratingsChart') ratingsChartCanvas!: ElementRef;
  @ViewChild('peaksChart') peaksChartCanvas!: ElementRef;

  ratingsChart: any;
  peaksChart: any;

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

  ngAfterViewInit() {
    // We'll create charts after data is loaded and view is ready
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

    await this.createRatingsChart();
    await this.createPeaksChart();
  }

  async createRatingsChart() {
    const ratings = await this.reportService.getStandRatings();
    const labels = ratings.map(r => {
      const stand = this.allStands.find(s => s.id === r.standId);
      return stand ? stand.nombre : r.standId;
    });
    const data = ratings.map(r => r.avgRating);

    if (this.ratingsChart) this.ratingsChart.destroy();

    this.ratingsChart = new Chart(this.ratingsChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Calificación Promedio',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 5 }
        }
      }
    });
  }

  async createPeaksChart() {
    const peaks = await this.reportService.getVisitorPeaks();
    const labels = peaks.map(p => p.time);
    const data = peaks.map(p => p.count);

    if (this.peaksChart) this.peaksChart.destroy();

    this.peaksChart = new Chart(this.peaksChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visitantes por Hora',
          data: data,
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { 
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
}

