import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonList, IonListHeader, 
  IonItem, IonIcon, IonLabel, IonBadge, IonGrid, IonRow, IonCol, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, podiumOutline, flame, wineOutline, documentText } from 'ionicons/icons';
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
    IonItem, IonIcon, IonLabel, IonBadge, IonGrid, IonRow, IonCol, IonButton,
    CommonModule
  ]
})
export class ReportsPage implements OnInit, AfterViewInit {
  private reportService = inject(ReportService);
  private standService = inject(StandService);

  @ViewChild('ratingsChart') ratingsChartCanvas!: ElementRef;
  @ViewChild('globalFlowChart') globalFlowChartCanvas!: ElementRef;
  @ViewChild('standFlowChart') standFlowChartCanvas!: ElementRef;

  ratingsChart: any;
  globalFlowChart: any;
  standFlowChart: any;

  visitsPerStand: { standId: string, standName?: string, count: number }[] = [];
  mostVisitedStand: { standId: string, standName?: string, count: number } | null = null;
  highestRatedStand: { standName: string, avgRating: number } | null = null;
  teacherSummaryCards: { standName: string, avgRating: number, totalVisits: number, rank?: number }[] = [];
  stands$: Observable<Stand[]> = this.standService.getStands();
  
  allStands: Stand[] = [];

  frenchQuotes = [
    "Un platillo sin queso es como un día sin sol.",
    "El descubrimiento de un nuevo plato es más útil para el ser humano que el descubrimiento de una estrella.",
    "No se puede cocinar bien si no se pone en ello el corazón.",
    "La gastronomía es el arte de usar la comida para crear felicidad.",
    "El buen vino es la excelente camaradería",
    "Comer es una necesidad, pero comer de forma inteligente es un arte."
  ];
  currentQuote = this.frenchQuotes[0];

  constructor() {
    addIcons({ trophyOutline, podiumOutline, flame, wineOutline, documentText });
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
    this.visitsPerStand = counts.map((c: any) => {
      const stand = this.allStands.find(s => s.id === c.standId);
      return {
        ...c,
        standName: stand ? stand.nombre : c.standId
      };
    });

    const ratings = await this.reportService.getStandRatings();
    
    // Create Teacher Summary Cards (ranking by rating, then visits)
    this.teacherSummaryCards = this.allStands.map(s => {
      const v = counts.find((c: any) => c.standId === s.id)?.count || 0;
      const r = ratings.find((x: any) => x.standId === s.id)?.avgRating || 0;
      return { standName: s.nombre, avgRating: r, totalVisits: v };
    }).sort((a: any, b: any) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.totalVisits - a.totalVisits;
    });
    
    // Assign ranks
    this.teacherSummaryCards = this.teacherSummaryCards.map((c: any, index: number) => ({ ...c, rank: index + 1 }));

    // Calcular estadísticas para el Panel del Sommelier
    if (this.visitsPerStand.length > 0) {
      this.mostVisitedStand = [...this.visitsPerStand].sort((a, b) => b.count - a.count)[0];
    }
    if (this.teacherSummaryCards.length > 0 && this.teacherSummaryCards[0].avgRating > 0) {
      this.highestRatedStand = this.teacherSummaryCards[0];
    }
    
    // Frase aleatoria cada vez que entra
    this.currentQuote = this.frenchQuotes[Math.floor(Math.random() * this.frenchQuotes.length)];

    // Requerimiento: Gráficas de 15 minutos en lugar de la anterior de horas
    await this.createRatingsChart();
    await this.createGlobalFlowChart();
    await this.createStandFlowChart();
  }

  async createRatingsChart() {
    const ratings = await this.reportService.getStandRatings();
    const labels = ratings.map((r: any) => {
      const stand = this.allStands.find(s => s.id === r.standId);
      return stand ? stand.nombre : r.standId;
    });
    const data = ratings.map((r: any) => r.avgRating);

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

  async createGlobalFlowChart() {
    const flows = await this.reportService.getGlobalFlow15Min();
    const labels = flows.map((f: any) => f.time);
    const data = flows.map((f: any) => f.count);

    if (this.globalFlowChart) this.globalFlowChart.destroy();
    if (!this.globalFlowChartCanvas) return;

    this.globalFlowChart = new Chart(this.globalFlowChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Visitantes Totales (Intervalos 15 min)',
          data: data,
          fill: true,
          backgroundColor: 'rgba(114, 47, 55, 0.15)', // Vino tinto aguado
          borderColor: '#722F37', // Vino de Burdeos
          tension: 0.4, // Curva fluida como líquido
          pointBackgroundColor: '#fff',
          pointBorderColor: '#722F37',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  async createStandFlowChart() {
    const standFlows = await this.reportService.getStandFlows15Min();
    
    // gather all unique times
    const allTimes = new Set<string>();
    standFlows.forEach((sf: any) => sf.flows.forEach((f: any) => allTimes.add(f.time)));
    const labels = Array.from(allTimes).sort((a, b) => a.localeCompare(b));

    const datasets = standFlows.map((sf: any, i: number) => {
      const stand = this.allStands.find(s => s.id === sf.standId);
      const name = stand ? stand.nombre : sf.standId;
      
      const data = labels.map((l: string) => {
        const flow = sf.flows.find((f: any) => f.time === l);
        return flow ? flow.count : 0;
      });

      // Generar colores basados en vinos (Tinto, Rosé, Blanco, Dorado)
      const culinatyColors = [
        '#722F37', // Vino tinto
        '#D4AF37', // Dorado / Chardonnay
        '#FFA07A', // Rose
        '#5c94c1', // Azul agua
        '#800020'  // Burgundy
      ];
      const color = culinatyColors[i % culinatyColors.length];
      const bgColor = culinatyColors[i % culinatyColors.length] + '33'; // 20% alpha

      return {
        label: name,
        data: data,
        fill: true,
        backgroundColor: bgColor,
        borderColor: color,
        tension: 0.4,
        pointRadius: 3
      };
    });

    if (this.standFlowChart) this.standFlowChart.destroy();
    if (!this.standFlowChartCanvas) return;

    this.standFlowChart = new Chart(this.standFlowChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  // Feature: Descargar Excel/CSV Nativo de las métricas de los Stands
  exportToExcel() {
    if (this.teacherSummaryCards.length === 0) return;

    // Titulos
    const header = ['Rank', 'Nombre del Stand', 'Calificación Promedio', 'Visitas Totales'];
    // Filas
    const rows = this.teacherSummaryCards.map(c => [
      c.rank,
      `"${c.standName}"`, // Encapsular en comillas por si tiene comas
      c.avgRating.toFixed(2),
      c.totalVisits
    ]);

    // Combinar (con BOM \uFEFF para arreglar acentos en Excel)
    const csvContent = '\uFEFF' + [
      header.join(','),
      ...rows.map(line => line.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Simular Clic de Descarga
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Francofonia_Reporte_Stands_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

