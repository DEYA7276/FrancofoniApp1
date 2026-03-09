import { Component, inject, OnInit, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonItem, IonLabel, IonInput, IonButton, 
  IonList, IonListHeader, IonThumbnail, IonImg, IonIcon, 
  IonSelect, IonSelectOption, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, peopleOutline, create, download, mail } from 'ionicons/icons';
// import { ParticipantService } from '../services/participant.service'; // Moved to dynamic import in ngOnInit
import { Participant } from '../models/participant.model';
import { Observable } from 'rxjs';
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
    IonList, IonListHeader, IonThumbnail, IonImg, IonIcon, 
    IonSelect, IonSelectOption, 
    CommonModule, FormsModule, RouterModule,
    QRCodeComponent
  ]
})
export class ParticipantsPage implements OnInit {
  private envInjector = inject(EnvironmentInjector);
  private toastCtrl = inject(ToastController);
  
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
    correo: ''
  };

  constructor() {
    addIcons({ trash, peopleOutline, create, download, mail });
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
        await this.participantService.addParticipant(this.newParticipant);
        this.showToast('Participante registrado exitosamente.', 'success');
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
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newParticipant = { 
      nombre: '', 
      apellido_paterno: '', 
      apellido_materno: '', 
      ciudad: '', 
      municipio: '', 
      sexo: '', 
      correo: '' 
    };
  }

  async deleteParticipant(id: string) {
    if(confirm('¿Seguro que deseas eliminar este participante?')) {
      await this.participantService.deleteParticipant(id);
      this.showToast('Participante eliminado', 'success');
    }
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

