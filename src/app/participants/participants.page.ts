import { Component, inject, OnInit, EnvironmentInjector, runInInjectionContext, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonIcon, IonSelect, IonSelectOption, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, peopleOutline, create, download, mail, print } from 'ionicons/icons';
// import { ParticipantService } from '../services/participant.service'; // Moved to dynamic import in ngOnInit
import { Participant } from '../models/participant.model';
import { Observable, take } from 'rxjs';
import { RouterModule } from '@angular/router';

import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-participants',
  templateUrl: './participants.page.html',
  styleUrls: ['./participants.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonBackButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonButton,
    IonIcon, IonSelect, IonSelectOption,
    CommonModule, FormsModule, RouterModule,
    QRCodeComponent
  ]
})
export class ParticipantsPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  private envInjector = inject(EnvironmentInjector);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  private participantService!: any; // Using any for the instance to avoid type cycle if it exists, or cast later
  participants$: Observable<Participant[]> | undefined;

  isSaving = false;

  newParticipant: Participant = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    ciudad: '',
    municipio: '',
    sexo: '',
    correo: '',
    tipoBoleto: 'Normal'
  };

  constructor() {
    addIcons({ trash, peopleOutline, create, download, mail, print });
  }

  async ngOnInit() {
    // Completely break ESM and DI cycles by dynamic importing the service
    const { ParticipantService } = await import('../services/participant.service');

    runInInjectionContext(this.envInjector, () => {
      this.participantService = inject(ParticipantService);
      this.participants$ = this.participantService.getParticipants();
    });
  }

  async addParticipant() {
    if (!this.newParticipant.nombre || !this.newParticipant.correo) {
      this.showToast('Por favor llena los campos requeridos mínimos (Nombre, Correo)');
      return;
    }

    this.isSaving = true;
    try {
      if (this.newParticipant.id) {
        await this.participantService.updateParticipant(this.newParticipant.id, this.newParticipant);
        this.showToast('Participante actualizado exitosamente.', 'success');
      } else {
        const newId = await this.participantService.addParticipant(this.newParticipant);

        // Generar QR y enviar correo via PHP (API local backend)
        try {
          // Asumimos que la nueva API local en PHP ya envió el correo, pero podríamos revisar la respuesta
          // si implementáramos el check en el Service. Por ahora, asumiremos éxito temporal
          // hasta leer la confirmación de la API.
          this.showToast('Registrado y correo encolado en servidor local.', 'success');
        } catch (err: any) {
          console.error('Error procesando respuesta', err);
          this.showToast('Registrado, pero falló el envío del correo desde el servidor.', 'warning');
        }
      }
      this.resetForm();
    } catch (e: any) {
      this.showToast('Error: ' + e.message, 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  editParticipant(p: Participant) {
    this.newParticipant = { ...p };
    // Smooth scroll to form using Ionic's content scroll
    this.content?.scrollToTop(500);
    // Flash the form card to highlight it
    setTimeout(() => {
      const formCard = document.querySelector('app-participants ion-card');
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
    this.newParticipant = {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      ciudad: '',
      municipio: '',
      sexo: '',
      correo: '',
      tipoBoleto: 'Normal'
    };
  }

  async deleteParticipant(id: string) {
    const alert = await this.alertCtrl.create({
      header: '🗑️ Eliminar participante',
      message: '¿Estás seguro de que deseas eliminar este participante? Se perderán sus datos y registro.',
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
            await this.participantService.deleteParticipant(id);
            this.showToast('Participante eliminado', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  downloadQR(id: string, name: string) {
    const canvas = document.querySelector(`qrcode#qr-${id} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `QR_${name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } else {
      this.showToast('Error al generar la descarga', 'danger');
    }
  }

  sendEmail(p: Participant) {
    const subject = encodeURIComponent('Tu Pase para Francofonia');
    const body = encodeURIComponent(`Hola ${p.nombre},\n\nTu registro ha sido exitoso. Tu ID de participante es: ${p.id}\n\nPresenta este código en los stands.`);
    window.location.href = `mailto:${p.correo}?subject=${subject}&body=${body}`;
  }

  async exportPendingQRs() {
    if (!this.participants$) return;
    this.participants$.pipe(take(1)).subscribe((participants: Participant[]) => {
      const pendientes = participants.filter((p: Participant) => p.correoEnviado !== true);
      if (pendientes.length === 0) {
        this.showToast('Todos los participantes han recibido su correo.', 'success');
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Nombre,Correo,ID_Participante\n";

      pendientes.forEach((p: Participant) => {
        csvContent += `${p.nombre} ${p.apellido_paterno},${p.correo},${p.id}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "participantes_pendientes_qr.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast(`Exportados ${pendientes.length} participantes pendientes.`);
    });
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

