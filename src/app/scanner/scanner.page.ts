import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonButton, 
  IonIcon, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCodeOutline, warningOutline } from 'ionicons/icons';
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

  scanner: Html5QrcodeScanner | null = null;
  myStand: Stand | null = null;
  isScanning = false;

  constructor() {
    addIcons({ qrCodeOutline, warningOutline });
  }

  async ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        this.standService.getStandsByUsuarioId(user.id).pipe(take(1)).subscribe(stands => {
          if (stands && stands.length > 0) {
            this.myStand = stands[0];
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
      this.showToast(result.message, result.success ? 'success' : 'danger');
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

