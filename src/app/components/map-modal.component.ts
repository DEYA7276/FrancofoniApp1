import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { FloorMapComponent } from './floor-map.component';
import { Stand } from '../models/stand.model';

@Component({
  selector: 'app-map-modal',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, FloorMapComponent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="glass-header">
        <ion-title>Tu Progreso NAKU</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding map-modal-content">
      <div class="map-wrapper animate-fade-up">
        <app-floor-map 
          [visitedStandIds]="visitedStandIds" 
          [allStands]="allStands">
        </app-floor-map>
      </div>
      <div class="continue-btn-container animate-fade-up delay-300">
        <ion-button expand="block" shape="round" class="custom-btn" (click)="close()">
          Continuar Explorando 🚶
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .glass-header {
      --background: rgba(15, 59, 110, 0.95);
      color: white;
    }
    .map-modal-content {
      --background: #fdfdfd;
    }
    .map-wrapper {
      background: white;
      border-radius: 20px;
      padding: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      margin-bottom: 30px;
      margin-top: 10px;
    }
    .continue-btn-container {
      padding: 0 10px 20px;
    }
    .custom-btn {
      --background: #d4af37;
      --background-hover: #b8860b;
      --color: #000;
      font-weight: bold;
      letter-spacing: 0.5px;
      height: 50px;
    }
  `]
})
export class MapModalComponent {
  @Input() visitedStandIds: string[] = [];
  @Input() allStands: Stand[] = [];

  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ close });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
