import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonButton, IonList, IonListHeader,
<<<<<<< HEAD
  IonBadge, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create, qrCodeOutline } from 'ionicons/icons';
=======
  IonBadge, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
import { StandService } from '../services/stand.service';
import { UserService } from '../services/user.service';
import { Stand } from '../models/stand.model';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
<<<<<<< HEAD
// @ts-ignore
import * as QRCode from 'qrcode';
import { QRCodeComponent } from 'angularx-qrcode';
=======
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be

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
<<<<<<< HEAD
    CommonModule, FormsModule, QRCodeComponent
=======
    CommonModule, FormsModule
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
  ]
})
export class StandsPage {
  private standService = inject(StandService);
  private userService = inject(UserService);
<<<<<<< HEAD
  private alertController = inject(AlertController);

  stands$: Observable<Stand[]> = this.standService.getStands();
  usuarios$: Observable<User[]> = this.userService.getUsers().pipe(
    map((users: User[]) => users.filter((u: User) => u.role === 'usuario'))
=======

  stands$: Observable<Stand[]> = this.standService.getStands();
  usuarios$: Observable<User[]> = this.userService.getUsers().pipe(
    map(users => users.filter(u => u.role === 'usuario'))
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
  );

  newStand: Stand = {
    nombre: '',
    descripcion: '',
    usuarioId: '',
    activo: true
  };

  constructor() {
<<<<<<< HEAD
    addIcons({ trash, create, qrCodeOutline });
=======
    addIcons({ trash, create });
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
  }

  async addStand() {
    if (!this.newStand.usuarioId) {
       alert("Por favor asigne un encargado al stand");
       return;
    }
    
    if (this.newStand.id) {
      await this.standService.updateStand(this.newStand.id, this.newStand);
<<<<<<< HEAD
      await this.userService.updateUser(this.newStand.usuarioId, { standId: this.newStand.id });
    } else {
      const docRef = await this.standService.addStand(this.newStand);
      await this.userService.updateUser(this.newStand.usuarioId, { standId: docRef.id });
=======
    } else {
      await this.standService.addStand(this.newStand);
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
    }
    this.resetForm();
  }

  editStand(s: Stand) {
    this.newStand = { ...s };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
<<<<<<< HEAD
    this.newStand = { nombre: '', descripcion: '', usuarioId: '', activo: true, responsable: '' };
=======
    this.newStand = { nombre: '', descripcion: '', usuarioId: '', activo: true };
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
  }

  async deleteStand(id: string) {
    if(confirm('¿Seguro que deseas eliminar este stand?')) {
      await this.standService.deleteStand(id);
    }
  }

  getEncargadoName(users: User[] | null, usuarioId: string): string {
    if (!users) return usuarioId;
    const u = users.find(x => x.id === usuarioId);
    return u ? u.email : usuarioId;
  }
<<<<<<< HEAD

  async downloadQR(standId: string, nombre: string) {
    const defaultUrl = window.location.origin.includes('localhost') 
      ? 'https://miapp.com' // Sugerencia visual
      : window.location.origin;

    const alert = await this.alertController.create({
      header: 'Enlace del Evento',
      message: 'Ingresa la dirección web pública donde estará alojada la app. Si dejas localhost, el QR solo funcionará en tu computadora.',
      inputs: [
        {
          name: 'baseUrl',
          type: 'url',
          value: defaultUrl,
          placeholder: 'https://tudominio.com'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
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
=======
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
}
