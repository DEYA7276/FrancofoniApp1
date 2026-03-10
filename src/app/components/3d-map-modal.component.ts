import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, ModalController 
} from '@ionic/angular/standalone';
import { ThreeDMapComponent } from './threed-map.component';
import { Stand } from '../models/stand.model';

@Component({
  selector: 'app-3d-map-modal',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonButton, IonContent, ThreeDMapComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar class="glass-header">
        <ion-title>Tu Progreso NAKU</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cerrar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-threed-map 
        [visitedStandIds]="visitedStandIds" 
        [allStands]="allStands">
      </app-threed-map>
    </ion-content>
  `
})
export class ThreeDMapModalComponent {
  @Input() visitedStandIds: string[] = [];
  @Input() allStands: Stand[] = [];

  private modalCtrl = inject(ModalController);

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
