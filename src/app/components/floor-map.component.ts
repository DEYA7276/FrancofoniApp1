import { Component, Input, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sparklesOutline, checkmarkCircleOutline, ellipseOutline } from 'ionicons/icons';
import { RecommendationService } from '../services/recommendation.service';
import { Stand } from '../models/stand.model';

@Component({
  selector: 'app-floor-map',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    <div class="floor-plan-container">
      <div class="plan-header">
        <h2 class="building-title">EDIFICIO NAKU</h2>
        <p class="plan-subtitle">Toca un stand para interactuar</p>
      </div>

      <div class="floor-plan">
        <!-- PUERTA marker -->
        <div class="puerta-marker">
          <span>PUERTA</span>
        </div>

        <!-- L-shape layout: top row + right column -->
        <div class="l-shape-layout">
          <!-- Top row: first 2 stands -->
          <div class="top-row">
            <ng-container *ngFor="let stand of topStands; let i = index">
              <div class="stand-box"
                [class.visited]="isVisited(stand)"
                [class.pulse-suggest]="suggestion?.id === stand.id"
                (click)="onStandTap(stand)">
                <div class="stand-inner">
                  <ion-icon 
                    [name]="isVisited(stand) ? 'checkmark-circle-outline' : 'ellipse-outline'" 
                    class="stand-status-icon">
                  </ion-icon>
                  <span class="stand-name">{{ stand.nombre }}</span>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Right column: remaining stands -->
          <div class="right-column">
            <ng-container *ngFor="let stand of rightStands; let i = index">
              <div class="stand-box"
                [class.visited]="isVisited(stand)"
                [class.pulse-suggest]="suggestion?.id === stand.id"
                (click)="onStandTap(stand)">
                <div class="stand-inner">
                  <ion-icon 
                    [name]="isVisited(stand) ? 'checkmark-circle-outline' : 'ellipse-outline'" 
                    class="stand-status-icon">
                  </ion-icon>
                  <span class="stand-name">{{ stand.nombre }}</span>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-item">
          <span class="legend-dot visited"></span>
          <span>Visitado</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot pending"></span>
          <span>Pendiente</span>
        </div>
        <div class="legend-item" *ngIf="suggestion">
          <span class="legend-dot suggested"></span>
          <span>Sugerido</span>
        </div>
      </div>

      <!-- Recommendation -->
      <div *ngIf="suggestion" class="recommendation-card">
        <div class="rec-icon">
          <ion-icon name="sparkles-outline"></ion-icon>
        </div>
        <div class="rec-text">
          <h4>✨ Te sugerimos visitar</h4>
          <p><strong>{{ suggestion.nombre }}</strong> — {{ suggestion.responsable || 'Sorpresa culinaria' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .floor-plan-container {
      width: 100%;
    }

    .plan-header {
      text-align: center;
      margin-bottom: 12px;
    }

    .building-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.3rem;
      color: #0F3B6E;
      margin: 0 0 2px;
      letter-spacing: 2px;
    }

    .plan-subtitle {
      font-size: 0.75rem;
      color: #888;
      margin: 0;
    }

    /* Floor plan area */
    .floor-plan {
      position: relative;
      background: linear-gradient(135deg, #f0f4f8 0%, #e8edf2 100%);
      border: 2px dashed rgba(15, 59, 110, 0.2);
      border-radius: 14px;
      padding: 15px 15px 15px 35px;
      min-height: 220px;
    }

    /* PUERTA marker */
    .puerta-marker {
      position: absolute;
      bottom: 20px;
      left: -2px;
      background: #dc3545;
      color: white;
      padding: 14px 5px;
      font-size: 0.55rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      border-radius: 0 6px 6px 0;
      box-shadow: 3px 0 8px rgba(220, 53, 69, 0.3);
      z-index: 2;
    }

    /* L-shape layout */
    .l-shape-layout {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Top row: 2 stands aligned to the right */
    .top-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* Right column: remaining stands aligned to the right */
    .right-column {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    /* Stand box — compact for mobile */
    .stand-box {
      background: white;
      border: 2px solid #0F3B6E;
      border-radius: 10px;
      padding: 8px 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      width: 90px;
      height: 65px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stand-box:active {
      transform: scale(0.93);
    }

    .stand-box.visited {
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
      border-color: #28a745;
      box-shadow: 0 3px 10px rgba(40, 167, 69, 0.15);
    }

    .stand-box:not(.visited) {
      border-style: dashed;
      background: rgba(255, 255, 255, 0.7);
    }

    .stand-box.pulse-suggest {
      border-color: #d4af37 !important;
      border-style: solid !important;
      background: linear-gradient(135deg, #fffcf0, #fff8e1) !important;
      animation: suggestPulse 2s ease-in-out infinite;
    }

    @keyframes suggestPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
      50% { box-shadow: 0 0 0 6px rgba(212, 175, 55, 0); }
    }

    .stand-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    .stand-status-icon {
      font-size: 1.1rem;
      color: #0F3B6E;
    }

    .stand-box.visited .stand-status-icon {
      color: #28a745;
    }

    .stand-name {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.6rem;
      font-weight: 600;
      color: #333;
      line-height: 1.1;
      word-break: break-word;
      max-width: 75px;
    }

    .stand-box.visited .stand-name {
      color: #155724;
    }

    /* Desktop: slightly larger stands */
    @media (min-width: 600px) {
      .stand-box {
        width: 120px;
        height: 80px;
        padding: 10px 12px;
      }
      .stand-name {
        font-size: 0.7rem;
        max-width: 100px;
      }
      .stand-status-icon {
        font-size: 1.3rem;
      }
    }

    /* Legend */
    .map-legend {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 12px;
      padding: 6px 0;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.7rem;
      color: #666;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }

    .legend-dot.visited { background: #28a745; }
    .legend-dot.pending { border: 2px dashed #0F3B6E; background: white; }
    .legend-dot.suggested { background: #d4af37; }

    /* Recommendation card */
    .recommendation-card {
      margin-top: 12px;
      padding: 10px 14px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 249, 230, 0.95));
      border-radius: 12px;
      border: 1.5px solid #d4af37;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.1);
    }

    .rec-icon {
      font-size: 1.3rem;
      color: #d4af37;
      animation: spin 6s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .rec-text h4 {
      margin: 0;
      font-size: 0.65rem;
      color: #b8860b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rec-text p {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: #333;
    }
  `]
})
export class FloorMapComponent implements OnInit, OnChanges {
  @Input() visitedStandIds: string[] = [];
  @Input() allStands: Stand[] = [];

  topStands: Stand[] = [];
  rightStands: Stand[] = [];

  private recommendationService = inject(RecommendationService);
  private alertCtrl = inject(AlertController);
  suggestion: Stand | null = null;

  constructor() {
    addIcons({ sparklesOutline, checkmarkCircleOutline, ellipseOutline });
  }

  ngOnInit() {
    this.distributeStands();
    this.updateSuggestion();
  }

  ngOnChanges() {
    this.distributeStands();
    this.updateSuggestion();
  }

  /** Split stands into L-shape: top 2 + right column for the rest */
  private distributeStands() {
    if (this.allStands.length <= 2) {
      this.topStands = this.allStands;
      this.rightStands = [];
    } else {
      this.topStands = this.allStands.slice(0, 2);
      this.rightStands = this.allStands.slice(2);
    }
  }

  isVisited(stand: Stand): boolean {
    return this.visitedStandIds.includes(stand.id || '');
  }

  private updateSuggestion() {
    if (this.allStands.length > 0) {
      this.suggestion = this.recommendationService.getSmartSuggestion(this.allStands, this.visitedStandIds);
    }
  }

  async onStandTap(stand: Stand) {
    const visited = this.isVisited(stand);
    const alert = await this.alertCtrl.create({
      header: visited ? '✅ ' + stand.nombre : '📍 ' + stand.nombre,
      subHeader: stand.responsable ? `Responsable: ${stand.responsable}` : undefined,
      message: visited
        ? '¡Ya visitaste este stand! Esperamos que hayas disfrutado la experiencia.'
        : stand.descripcion || 'Pasa por aquí y presenta tu QR para registrar tu visita.',
      cssClass: `custom-alert ${visited ? 'alert-success' : 'alert-warning'}`,
      buttons: [{ text: visited ? '¡Genial!' : 'Voy para allá 🚶', cssClass: 'alert-btn-primary' }]
    });
    await alert.present();
  }
}
