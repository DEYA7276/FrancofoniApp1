import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, 
<<<<<<< HEAD
  IonIcon, ToastController, ModalController 
} from '@ionic/angular/standalone';
import { ThreeDMapModalComponent } from '../components/3d-map-modal.component';
import { addIcons } from 'ionicons';
import { qrCodeOutline, warningOutline } from 'ionicons/icons';
// @ts-ignore
=======
  IonIcon, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, warningOutline } from 'ionicons/icons';
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
import { VisitService } from '../services/visit.service';
import { Stand } from '../models/stand.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonButton, 
    IonIcon,
    CommonModule
  ]
})
export class ScannerPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private standService = inject(StandService);
  private visitService = inject(VisitService);
  private toastCtrl = inject(ToastController);
<<<<<<< HEAD
  private modalCtrl = inject(ModalController);
=======
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be

  scanner: Html5QrcodeScanner | null = null;
  myStand: Stand | null = null;
  isScanning = false;

  constructor() {
    addIcons({ qrCodeOutline, warningOutline });
  }

  async ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(async user => {
<<<<<<< HEAD
      if (user && user.standId) {
        this.standService.getStandById(user.standId).pipe(take(1)).subscribe(stand => {
          if (stand) {
            this.myStand = stand;
            this.myStand.id = user.standId; // ensure ID is set in case doc doesn't include it directly
=======
      if (user) {
        this.standService.getStandsByUsuarioId(user.id).pipe(take(1)).subscribe(stands => {
          if (stands && stands.length > 0) {
            this.myStand = stands[0];
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
          }
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.scanner) {
      this.scanner.clear().catch(e => console.error(e));
    }
  }

  startScanner() {
    if (!this.myStand) {
      this.showToast('No tienes ningún stand asignado.');
      return;
    }
    
    this.isScanning = true;
    
    setTimeout(() => {
      this.scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: {width: 250, height: 250}, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
        false
      );
      this.scanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
    }, 200);
  }

  async onScanSuccess(decodedText: string, decodedResult: any) {
    if (this.scanner) {
      this.scanner.clear();
      this.isScanning = false;
    }

    const participantId = decodedText;
    if (!this.myStand?.id) return;

    try {
      const result = await this.visitService.registerVisit(participantId, this.myStand.id);
<<<<<<< HEAD
      
      // Reproducir sonido "sensorial" de éxito o error
      try {
        const audio = new Audio();
        // Usando un bip sutil tipo 'campanilla' o 'ding' suave (basado en data URI para evitar dependencias locales si no existen)
        // Este es un sonido de éxito corto y premium
        audio.src = result.success 
          ? 'https://actions.google.com/sounds/v1/water/water_drop.ogg' // Simula gota de vino / líquido
          : 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
        audio.play();
      } catch (audioErr) {
        console.log('No se pudo reproducir el sonido', audioErr);
      }

      this.showToast(result.message, result.success ? 'success' : 'danger');

      if (result.success) {
        // Cargar todos los stands y visitas para el mapa
        const allStands = await this.standService.getStands().pipe(take(1)).toPromise() || [];
        const visits = await this.visitService.getParticipantVisits(participantId);
        const visitedIds = visits.map((v: any) => v.standId);

        const modal = await this.modalCtrl.create({
          component: ThreeDMapModalComponent,
          componentProps: {
            participantId: participantId,
            visitedStandIds: visitedIds,
            allStands: allStands
          }
        });
        await modal.present();
      }
=======
      this.showToast(result.message, result.success ? 'success' : 'danger');
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
    } catch (e: any) {
      this.showToast('Error registrando visita: ' + e.message, 'danger');
    }
  }

  onScanFailure(error: any) {}

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

