import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonButton, IonList, IonListHeader,
  IonBadge, IonIcon, AlertController, IonicSafeString
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create, qrCodeOutline } from 'ionicons/icons';
import { StandService } from '../services/stand.service';
import { UserService } from '../services/user.service';
import { Stand } from '../models/stand.model';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
// @ts-ignore
import * as QRCode from 'qrcode';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-stands',
  templateUrl: './stands.page.html',
  styleUrls: ['./stands.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonToggle, IonButton, IonList, IonListHeader,
    IonBadge, IonIcon,
    CommonModule, FormsModule, QRCodeComponent
  ]
})
export class StandsPage {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  private standService = inject(StandService);
  private userService = inject(UserService);
  private alertController = inject(AlertController);

  stands$: Observable<Stand[]> = this.standService.getStands();
  usuarios$: Observable<User[]> = this.userService.getUsers().pipe(
    map((users: User[]) => users.filter((u: User) => u.role === 'usuario'))
  );

  /** Auto-detects the current URL for QR generation */
  baseUrl = window.location.origin;

  newStand: Stand = {
    nombre: '',
    descripcion: '',
    usuarioId: '',
    activo: true
  };

  constructor() {
    addIcons({ trash, create, qrCodeOutline });
  }

  async addStand() {
    if (!this.newStand.usuarioId) {
      const alert = await this.alertController.create({
        header: '⚠️ Falta encargado',
        message: 'Por favor asigna un encargado al stand antes de guardarlo.',
        cssClass: 'custom-alert alert-warning',
        buttons: [{ text: 'Entendido', cssClass: 'alert-btn-primary' }]
      });
      await alert.present();
      return;
    }
    
    try {
      if (this.newStand.id) {
        await this.standService.updateStand(this.newStand.id, this.newStand);
        await this.userService.updateUser(this.newStand.usuarioId, { standId: this.newStand.id });
        const successAlert = await this.alertController.create({
          header: '✅ Stand actualizado',
          message: `El stand "${this.newStand.nombre}" fue actualizado exitosamente.`,
          cssClass: 'custom-alert alert-success',
          buttons: [{ text: 'Perfecto', cssClass: 'alert-btn-primary' }]
        });
        await successAlert.present();
      } else {
        const docRef = await this.standService.addStand(this.newStand);
        await this.userService.updateUser(this.newStand.usuarioId, { standId: docRef.id });
        const successAlert = await this.alertController.create({
          header: '✅ Stand creado',
          message: `El stand "${this.newStand.nombre}" fue creado exitosamente.`,
          cssClass: 'custom-alert alert-success',
          buttons: [{ text: 'Perfecto', cssClass: 'alert-btn-primary' }]
        });
        await successAlert.present();
      }
      this.resetForm();
    } catch (e: any) {
      const errAlert = await this.alertController.create({
        header: '❌ Error',
        message: 'Hubo un error al guardar el stand: ' + e.message,
        cssClass: 'custom-alert alert-danger',
        buttons: [{ text: 'Cerrar', cssClass: 'alert-btn-primary' }]
      });
      await errAlert.present();
    }
  }

  editStand(s: Stand) {
    this.newStand = { ...s };
    // Smooth scroll to form using Ionic's content scroll
    this.content?.scrollToTop(500);
    // Flash the form card to highlight it
    setTimeout(() => {
      const formCard = document.querySelector('app-stands ion-card');
      if (formCard) {
        formCard.classList.add('flash-highlight');
        setTimeout(() => {
          formCard.classList.remove('flash-highlight');
          formCard.classList.add('flash-highlight-fade');
          setTimeout(() => formCard.classList.remove('flash-highlight-fade'), 1200);
        }, 800);
      }
    }, 550);
  }

  resetForm() {
    this.newStand = { nombre: '', descripcion: '', usuarioId: '', activo: true, responsable: '' };
  }

  async deleteStand(id: string) {
    const alert = await this.alertController.create({
      header: '🗑️ Eliminar stand',
      message: '¿Estás seguro de que deseas eliminar este stand? Esta acción no se puede deshacer.',
      cssClass: 'custom-alert alert-danger',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            await this.standService.deleteStand(id);
          }
        }
      ]
    });
    await alert.present();
  }

  getEncargadoName(users: User[] | null, usuarioId: string): string {
    if (!users) return usuarioId;
    const u = users.find(x => x.id === usuarioId);
    return u ? u.email : usuarioId;
  }

  /** Build the survey URL for a stand using current origin */
  getSurveyUrl(standId: string): string {
    return `${this.baseUrl}/survey?standId=${standId}`;
  }

  async downloadQR(standId: string, nombre: string) {
    const currentUrl = window.location.origin;

    const alert = await this.alertController.create({
      header: '🔗 Generar QR de Encuesta',
      subHeader: `Stand: ${nombre}`,
      message: new IonicSafeString(`Tu URL actual es: <strong>${currentUrl}</strong><br><br>Usa esta misma URL si todos los dispositivos están en la misma red. Si tienes un dominio público, cámbiala.`),
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'baseUrl',
          type: 'url',
          value: currentUrl,
          placeholder: 'http://192.168.x.x:8102'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: '📋 Usar URL Actual',
          cssClass: 'alert-btn-secondary',
          handler: async () => {
            await this.generateAndDownloadQR(currentUrl, standId, nombre);
            return true;
          }
        },
        {
          text: '⬇️ Descargar QR',
          cssClass: 'alert-btn-primary',
          handler: async (data: any) => {
            let baseUrl = (data.baseUrl || currentUrl).trim();
            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
            await this.generateAndDownloadQR(baseUrl, standId, nombre);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async generateAndDownloadQR(baseUrl: string, standId: string, nombre: string) {
    try {
      const url = `${baseUrl}/survey?standId=${standId}`;
      const qrBase64 = await QRCode.toDataURL(url, { width: 500, margin: 2 });
      const link = document.createElement('a');
      link.download = `QR_Encuesta_${nombre.replace(/\s+/g, '_')}.png`;
      link.href = qrBase64;
      link.click();

      const success = await this.alertController.create({
        header: '✅ QR Descargado',
        message: new IonicSafeString(`El QR de "${nombre}" apunta a:<br><strong>${url}</strong><br><br>Imprímelo y pégalo en la mesa del stand.`),
        cssClass: 'custom-alert alert-success',
        buttons: [{ text: '¡Listo!', cssClass: 'alert-btn-primary' }]
      });
      await success.present();
    } catch (e) {
      console.error('Error generando QR:', e);
    }
  }
}
