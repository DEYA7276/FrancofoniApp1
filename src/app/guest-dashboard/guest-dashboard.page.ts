import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBadge
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
import { VisitService } from '../services/visit.service';
import { Router } from '@angular/router';
import { FloorMapComponent } from '../components/floor-map.component';
import { Stand } from '../models/stand.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonButton, IonButtons,
    IonBadge, FloorMapComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar class="glass-header">
        <ion-buttons slot="start">
          <img src="assets/logo_participante.png" class="navbar-logo" alt="Logo" style="margin-left: 10px;">
        </ion-buttons>
        <ion-title>Mi Visita NAKU</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="logout()">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" *ngIf="guest$ | async as guest">
      <div class="welcome-header animate-fade-up">
        <h2>Bonjour, {{ guest.nombre }}! </h2>
        <p>Explora los stands del Edificio NAKU y colecciona tus visitas.</p>
        <ion-badge color="warning">Invitado</ion-badge>
      </div>

      <div class="map-card animate-fade-up delay-200">
        <app-floor-map 
          *ngIf="allStands.length > 0"
          [visitedStandIds]="visitedStandIds" 
          [allStands]="allStands">
        </app-floor-map>
        <div *ngIf="allStands.length === 0" class="empty-map">
          <p>Cargando mapa del evento...</p>
        </div>
      </div>

      <div class="stats-footer animate-fade-up delay-300">
        <div class="stat-box visited-stat">
          <span class="value">{{ visitedStandIds.length }}</span>
          <span class="label">Visitados</span>
        </div>
        <div class="stat-box total-stat">
          <span class="value">{{ allStands.length }}</span>
          <span class="label">Total Stands</span>
        </div>
        <div class="stat-box pending-stat">
          <span class="value">{{ allStands.length - visitedStandIds.length }}</span>
          <span class="label">Pendientes</span>
        </div>
      </div>

      <div *ngIf="visitedStandIds.length === allStands.length && allStands.length > 0" 
           class="completion-banner animate-fade-up delay-400">
        <h3>🏆 ¡Felicidades!</h3>
        <p>Has visitado todos los stands. ¡Eres un verdadero explorador culinario!</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .welcome-header { margin-bottom: 20px; }
    .welcome-header h2 { font-weight: bold; margin-bottom: 5px; }
    .welcome-header p { color: #666; font-style: italic; font-size: 0.9rem; margin-top: 2px; }
    
    .map-card { 
      background: white; 
      border-radius: 20px; 
      padding: 20px; 
      box-shadow: 0 10px 30px rgba(0,0,0,0.05); 
    }
    
    .empty-map {
      text-align: center;
      padding: 40px;
      color: #999;
    }
    
    .stats-footer { display: flex; gap: 10px; margin-top: 20px; }
    .stat-box { 
      flex: 1; 
      color: white; 
      padding: 15px 10px; 
      border-radius: 15px; 
      text-align: center;
    }
    .visited-stat { 
      background: linear-gradient(135deg, #28a745, #20c997);
      box-shadow: 0 6px 15px rgba(40, 167, 69, 0.3);
    }
    .total-stat { 
      background: linear-gradient(135deg, #0F3B6E, #1a5ab8);
      box-shadow: 0 6px 15px rgba(15, 59, 110, 0.3);
    }
    .pending-stat { 
      background: linear-gradient(135deg, #d4af37, #e6c855);
      box-shadow: 0 6px 15px rgba(212, 175, 55, 0.3);
    }
    .stat-box .value { display: block; font-size: 1.6rem; font-weight: bold; }
    .stat-box .label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.9; letter-spacing: 0.5px; }

    .completion-banner {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #fff8e1, #fffcf0);
      border: 2px solid #d4af37;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 8px 25px rgba(212, 175, 55, 0.15);
    }
    .completion-banner h3 { margin: 0 0 5px; font-size: 1.3rem; }
    .completion-banner p { margin: 0; color: #666; font-size: 0.9rem; }
  `]
})
export class GuestDashboardPage implements OnInit {
  authService = inject(AuthService);
  standService = inject(StandService);
  visitService = inject(VisitService);
  router = inject(Router);

  guest$ = this.authService.guest$;
  allStands: Stand[] = [];
  visitedStandIds: string[] = [];

  ngOnInit() {
    this.guest$.pipe(take(1)).subscribe(async guest => {
      if (!guest) {
        this.router.navigate(['/login']);
        return;
      }

      const standsPromise = this.standService.getStands().pipe(take(1)).toPromise();
      const visitsPromise = this.visitService.getParticipantVisits(guest.id!);

      const [stands, visits] = await Promise.all([standsPromise, visitsPromise]);

      this.allStands = stands || [];
      this.visitedStandIds = visits.map(v => v.standId);
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
