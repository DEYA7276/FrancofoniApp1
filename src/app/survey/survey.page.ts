import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonTextarea, IonButton, 
  IonIcon, AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline } from 'ionicons/icons';
import { SurveyService } from '../services/survey.service';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
import { Survey } from '../models/survey.model';
import { Stand } from '../models/stand.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.page.html',
  styleUrls: ['./survey.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonSelect, 
    IonSelectOption, IonTextarea, IonButton, 
    IonIcon,
    CommonModule, FormsModule
  ]
})
export class SurveyPage implements OnInit {
  private surveyService = inject(SurveyService);
  private authService = inject(AuthService);
  private standService = inject(StandService);
  private alertCtrl = inject(AlertController);
  private route = inject(ActivatedRoute);

  myStand: Stand | null = null;
  
  survey: Survey = {
    participantId: '',
    standId: '',
    p1: '',
    p2: '',
    p3: '',
    p4: '',
    p5: '',
    fecha: ''
  };

  constructor() {
    addIcons({ warningOutline });
  }

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe((params: any) => {
      const standIdParam = params['standId'];
      
      if (standIdParam) {
        this.loadStand(standIdParam);
      } else {
        this.authService.user$.pipe(take(1)).subscribe(user => {
          if (user && user.standId) {
            this.loadStand(user.standId);
          }
        });
      }
    });
  }

  private loadStand(id: string) {
    this.standService.getStandById(id).pipe(take(1)).subscribe((stand: Stand | undefined) => {
      if (stand) {
        this.myStand = stand;
        this.myStand.id = id;
        this.survey.standId = id;
      }
    });
  }

  async submitSurvey() {
    if (!this.myStand) {
      await this.showAlert('⚠️ Sin stand asignado', 'No tienes un stand asignado. Contacta al administrador.', 'warning');
      return;
    }
    if (!this.survey.participantId) {
      await this.showAlert('⚠️ Correo requerido', 'Debes ingresar tu correo electrónico para enviar la encuesta.', 'warning');
      return;
    }
    
    const p1Val = parseInt(this.survey.p1, 10);
    if (!this.survey.p1 || p1Val < 1 || p1Val > 5) {
      await this.showAlert('⚠️ Calificación inválida', 'La calificación del stand debe ser un número del 1 al 5.', 'warning');
      return;
    }

    if (!this.survey.p2) {
      await this.showAlert('⚠️ Campo incompleto', 'Por favor contesta si recomendarías el stand.', 'warning');
      return;
    }

    if (this.survey.p5 && this.survey.p5.length > 100) {
      await this.showAlert('⚠️ Texto muy largo', 'Los comentarios no pueden exceder 100 caracteres.', 'warning');
      return;
    }

    try {
      await this.surveyService.addSurvey(this.survey);
      await this.showAlert('✅ ¡Gracias por tu opinión!', 'Tu encuesta fue guardada exitosamente. ¡Tu feedback nos ayuda a mejorar!', 'success');
      this.survey = {
        participantId: '',
        standId: this.myStand.id!,
        p1: '', p2: '', p3: '', p4: '', p5: '', fecha: ''
      };
    } catch (e: any) {
      await this.showAlert('❌ Error', 'No se pudo guardar la encuesta. Intenta de nuevo.', 'danger');
    }
  }

  private async showAlert(header: string, message: string, type: string = 'warning') {
    const alert = await this.alertCtrl.create({
      header,
      message,
      cssClass: `custom-alert alert-${type}`,
      buttons: [{ text: 'Entendido', cssClass: 'alert-btn-primary' }]
    });
    await alert.present();
  }
}
