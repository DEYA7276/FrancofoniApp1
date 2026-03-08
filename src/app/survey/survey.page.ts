import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonTextarea, IonButton, 
  IonIcon, ToastController 
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
  private toastCtrl = inject(ToastController);

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
    this.authService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        this.standService.getStandsByUsuarioId(user.id).pipe(take(1)).subscribe(stands => {
          if (stands && stands.length > 0) {
            this.myStand = stands[0];
            this.survey.standId = this.myStand.id!;
          }
        });
      }
    });
  }

  async submitSurvey() {
    if (!this.myStand) {
      this.showToast('No tienes un stand asignado');
      return;
    }
    if (!this.survey.participantId) {
      this.showToast('Debes ingresar el ID del participante');
      return;
    }

    try {
      await this.surveyService.addSurvey(this.survey);
      this.showToast('Encuesta guardada con éxito', 'success');
      this.survey = {
        participantId: '',
        standId: this.myStand.id!,
        p1: '', p2: '', p3: '', p4: '', p5: '', fecha: ''
      };
    } catch (e: any) {
      this.showToast('Error al guardar la encuesta', 'danger');
    }
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

