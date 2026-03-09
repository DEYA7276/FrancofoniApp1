import { Component, inject, OnInit, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonLabel, IonInput, IonButton,
  IonIcon, IonSelect, IonSelectOption, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, peopleOutline, create, download, mail, print } from 'ionicons/icons';
// import { ParticipantService } from '../services/participant.service'; // Moved to dynamic import in ngOnInit
import { Participant } from '../models/participant.model';
import { Observable, take } from 'rxjs';
import { RouterModule } from '@angular/router';

import { QRCodeComponent } from 'angularx-qrcode';
import emailjs from '@emailjs/browser';
// @ts-ignore
import * as QRCode from 'qrcode';

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

        // Generar QR y enviar correo via EmailJS
        try {
          const qrBase64 = await QRCode.toDataURL(newId);
          await emailjs.send('service_3isdngl', 'template_i1gmcja', {
            correo: this.newParticipant.correo,
            nombre: this.newParticipant.nombre,
            name: 'Francofonia 2026', // Sin acento para evitar errores de codificación (caracteres raros)
            message: 'Aqui esta tu codigo QR para el evento Francofonia 2026.',
            qr_image: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${newId}`,
            participant_id: newId
          }, 'X3Xu-2gcvTwghomK1');
          await this.participantService.updateParticipant(newId, { correoEnviado: true });
          this.showToast('Registrado y correo enviado exitosamente.', 'success');
        } catch (err: any) {
          console.error('Error enviando correo', err);
          await this.participantService.updateParticipant(newId, { correoEnviado: false });
          this.showToast('Registrado, pero falló el envío del correo.', 'warning');
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
    if (confirm('¿Seguro que deseas eliminar este participante?')) {
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

  // Feature Premium: Generar Gafete (Badge) A4 y Llamar Impresora
  async printGafete(p: Participant) {
    // Generar el Base64 directamente (no dependemos de que esté dibujado en el dom actual)
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(p.id!);
    } catch(e) {
      qrDataUrl = '';
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      this.showToast("Por favor permite las ventanas emergentes (pop-ups) para imprimir.", 'warning');
      return;
    }

    // Plantilla HTML del Gafete Nivel Dios
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gafete - ${p.nombre} ${p.apellido_paterno}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600&display=swap');
          body { 
            font-family: 'Montserrat', sans-serif; 
            margin: 0; padding: 20px; 
            display: flex; justify-content: center; align-items: flex-start;
            background: #f5f5f5;
          }
          .gafete {
            width: 350px;
            height: 500px;
            background: white;
            border: 2px solid #0F3B6E;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
            position: relative;
            text-align: center;
          }
          .header {
            background: #0F3B6E;
            color: white;
            padding: 25px 0;
            border-bottom: 5px solid #d4af37; /* Dorado */
          }
          .header h1 {
            font-family: 'Playfair Display', serif;
            margin: 0; font-size: 26px;
            letter-spacing: 1px;
          }
          .body-content {
            padding: 30px 20px;
          }
          .name {
            font-size: 24px;
            font-weight: 600;
            color: #722F37; /* Vino */
            margin: 0 0 10px 0;
            line-height: 1.2;
          }
          .role {
            font-size: 14px;
            color: #666;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .qr-box {
            width: 150px;
            height: 150px;
            margin: 0 auto;
            border: 5px solid #f5f5f5;
            border-radius: 10px;
          }
          .qr-box img { width: 100%; height: 100%; border-radius: 5px; }
          .footer {
            position: absolute;
            bottom: 0; width: 100%;
            background: #f5f5f5;
            padding: 10px 0;
            font-size: 12px;
            color: #999;
            border-top: 1px dashed #ccc;
          }
        </style>
      </head>
      <body>
        <div class="gafete">
          <div class="header">
            <h1>LA FRANCOFONÍA</h1>
          </div>
          <div class="body-content">
            <h2 class="name">${p.nombre}<br>${p.apellido_paterno}</h2>
            <div class="role">Participante VIP</div>
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR del Participante"/>
            </div>
            <p style="margin-top:20px; font-weight: bold; font-family: 'Courier New', monospace; font-size:16px;">
              ID: ${p.id?.substring(0,8).toUpperCase()}
            </p>
          </div>
          <div class="footer">
            Pase de Degustación y Encuestas<br>ESCOM - IPN
          </div>
        </div>
        <script>
          // Autoprint when load is complete
          setTimeout(() => { window.print(); }, 500);
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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

