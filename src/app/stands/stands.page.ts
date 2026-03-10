import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonButton, IonList, IonListHeader,
  IonBadge, IonIcon, AlertController
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
  private standService = inject(StandService);
  private userService = inject(UserService);
  private alertController = inject(AlertController);

  stands$: Observable<Stand[]> = this.standService.getStands();
  usuarios$: Observable<User[]> = this.userService.getUsers().pipe(
    map((users: User[]) => users.filter((u: User) => u.role === 'usuario'))
  );

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  async downloadQR(standId: string, nombre: string) {
    const defaultUrl = window.location.origin.includes('localhost') 
      ? 'https://miapp.com' // Sugerencia visual
      : window.location.origin;

    const alert = await this.alertController.create({
      header: '🔗 Enlace del Evento',
      message: 'Ingresa la dirección web pública donde estará alojada la app. Si dejas localhost, el QR solo funcionará en tu computadora.',
      cssClass: 'custom-alert',
      inputs: [
        {
          name: 'baseUrl',
          type: 'url',
          value: defaultUrl,
          placeholder: 'https://tudominio.com'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Generar y Descargar QR',
          handler: async (data: any) => {
            try {
              let baseUrl = data.baseUrl.trim();
              if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
              
              const url = `${baseUrl}/survey?standId=${standId}`;
              const qrBase64 = await QRCode.toDataURL(url, { width: 500, margin: 2 });
              const link = document.createElement('a');
              link.download = `QR_Encuesta_${nombre.replace(/\s+/g, '_')}.png`;
              link.href = qrBase64;
              link.click();
            } catch (e) {
              console.error('Error generando QR:', e);
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
