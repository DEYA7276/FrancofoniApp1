import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonButtons, IonIcon, IonBadge 
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
import { VisitService } from '../services/visit.service';
import { Router } from '@angular/router';
import { ThreeDMapComponent } from '../components/threed-map.component';
import { Participant } from '../models/participant.model';
import { Stand } from '../models/stand.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonButtons, IonIcon, 
    IonBadge, ThreeDMapComponent
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
        <h2>Bonjour, {{ guest.nombre }}!</h2>
        <p>Estás en el Edificio NAKU. Explora los stands y colecciona tus visitas.</p>
        <ion-badge color="warning">Invitado VIP</ion-badge>
      </div>

      <div class="map-card animate-fade-up delay-200">
        <h3>Tu Mapa del Tesoro Culinario</h3>
        <app-threed-map 
          *ngIf="allStands.length > 0"
          [visitedStandIds]="visitedStandIds" 
          [allStands]="allStands">
        </app-threed-map>
      </div>

      <div class="stats-footer animate-fade-up delay-300">
        <div class="stat-box">
          <span class="value">{{ visitedStandIds.length }}</span>
          <span class="label">Stands Visitados</span>
        </div>
        <div class="stat-box">
          <span class="value">{{ allStands.length - visitedStandIds.length }}</span>
          <span class="label">Pendientes</span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .welcome-header { margin-bottom: 25px; }
    .welcome-header h2 { font-weight: bold; margin-bottom: 5px; }
    .welcome-header p { color: #666; font-style: italic; font-size: 0.9rem; }
    .map-card { background: white; border-radius: 20px; padding: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .map-card h3 { margin-top: 0; margin-bottom: 15px; font-size: 1.1rem; }
    .stats-footer { display: flex; gap: 15px; margin-top: 25px; }
    .stat-box { 
      flex: 1; background: var(--ion-color-primary); color: white; 
      padding: 15px; border-radius: 15px; text-align: center; 
      box-shadow: 0 8px 20px rgba(114, 47, 55, 0.2);
    }
    .stat-box .value { display: block; font-size: 1.8rem; font-weight: bold; }
    .stat-box .label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.8; }
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

      // Fetch both stands and visits before updating the state to avoid race conditions
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
