import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, 
  IonIcon, ToastController, ModalController, AlertController 
} from '@ionic/angular/standalone';

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

    // Intentar sincronizar visitas offline periódicamente (cada 15s)
    setInterval(async () => {
      if (navigator.onLine) {
        const synced = await this.visitService.syncOfflineVisits();
        if (synced > 0) {
          this.showToast(`📡 Se sincronizaron automáticamente ${synced} visitas guardadas offline.`, 'success');
        }
      }
    }, 15000);
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
        if (result.success && result.tipoBoleto === 'VIP') {
           audio.src = 'https://actions.google.com/sounds/v1/water/glass_clink.ogg'; // Brindis VIP
        } else {
           audio.src = result.success 
            ? 'https://actions.google.com/sounds/v1/water/water_drop.ogg' 
            : 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
        }
        audio.play();
      } catch (audioErr) {
        console.log('No se pudo reproducir el sonido', audioErr);
      }

      // Feature Premium: Reconocimiento VIP
      if (result.success && result.tipoBoleto === 'VIP') {
        const vipAlert = await this.alertCtrl.create({
          header: '👑 INVITADO ESPECIAL',
          subHeader: result.participantNombre ? `¡Bienvenue ${result.participantNombre}!` : 'Acceso Autorizado',
          message: 'Trato preferencial. Por favor brinda la mejor experiencia gastronómica.',
          cssClass: 'custom-alert alert-warning', // Se pinta dorado en css global
          buttons: [{ text: '¡Adelante!', cssClass: 'alert-btn-primary' }]
        });
        await vipAlert.present();
      } else {
        this.showToast(result.message, result.success ? 'success' : 'danger');
      }

    } catch (e: any) {
      // Si falla por problemas de red o servidor apagado temporalmente
      if (!navigator.onLine || e.status === 0 || e.name === 'HttpErrorResponse') {
        this.visitService.registerOfflineVisit(participantId, this.myStand.id);
        
        // Sonido de alerta (opcional) pero dejamos que fluya
        this.showToast('📶 Sin conexión a servidor. Visita guardada temporalmente en memoria (Offline Mode).', 'warning');
      } else {
        const errAlert = await this.alertCtrl.create({
          header: '❌ Error',
          message: 'Hubo un error al registrar la visita: ' + (e.error?.message || e.message),
          cssClass: 'custom-alert alert-danger',
          buttons: [{ text: 'Cerrar', cssClass: 'alert-btn-primary' }]
        });
        await errAlert.present();
      }
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

