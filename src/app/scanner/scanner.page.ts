import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, 
  IonIcon, ToastController, ModalController, AlertController 
} from '@ionic/angular/standalone';
import { ThreeDMapModalComponent } from '../components/3d-map-modal.component';
import { addIcons } from 'ionicons';
import { qrCodeOutline, warningOutline } from 'ionicons/icons';
// @ts-ignore
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
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  scanner: Html5QrcodeScanner | null = null;
  myStand: Stand | null = null;
  isScanning = false;

  constructor() {
    addIcons({ qrCodeOutline, warningOutline });
  }

  async ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(async user => {
      if (user && user.standId) {
        this.standService.getStandById(user.standId).pipe(take(1)).subscribe(stand => {
          if (stand) {
            this.myStand = stand;
            this.myStand.id = user.standId; // ensure ID is set in case doc doesn't include it directly
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

  async startScanner() {
    if (!this.myStand) {
      const noStandAlert = await this.alertCtrl.create({
        header: '⚠️ Sin stand asignado',
        message: 'No tienes ningún stand asignado. Contacta al administrador para que te asignen uno.',
        cssClass: 'custom-alert alert-warning',
        buttons: [{ text: 'Entendido', cssClass: 'alert-btn-primary' }]
      });
      await noStandAlert.present();
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
    } catch (e: any) {
      const errAlert = await this.alertCtrl.create({
        header: '❌ Error',
        message: 'Hubo un error al registrar la visita: ' + e.message,
        cssClass: 'custom-alert alert-danger',
        buttons: [{ text: 'Cerrar', cssClass: 'alert-btn-primary' }]
      });
      await errAlert.present();
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

