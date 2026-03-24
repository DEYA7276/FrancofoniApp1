import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonIcon, IonInput, IonButton, IonSpinner, IonImg, AlertController } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BackendModeService } from '../services/backend-mode.service';
import { addIcons } from 'ionicons';
import { mailOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonIcon, IonInput, IonButton, IonSpinner, IonImg
  ]
})
export class ForgotPasswordPage implements OnInit {
  forgotForm: FormGroup;
  isLoading = false;

  private http = inject(HttpClient);
  private mode = inject(BackendModeService);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  constructor() {
    addIcons({ mailOutline, checkmarkCircleOutline, alertCircleOutline });
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  async onRequestReset() {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    
    try {
      const email = this.forgotForm.value.email;
      const url = `${this.mode.localApiUrl}/request-reset`;
      
      const res: any = await this.http.post(url, { email }).toPromise();
      
      await this.showAlert(
        '🌟 ¡Listo!',
        'Las instrucciones para recuperar tu contraseña han sido enviadas a tu correo.',
        'success'
      );
      this.forgotForm.reset();
      this.router.navigate(['/login']);
    } catch (e: any) {
      const errorMsg = e.error?.error || 'Ocurrió un error al procesar tu solicitud. Verifica tu conexión.';
      await this.showAlert('❌ Error', errorMsg, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showAlert(header: string, message: string, cssClass: string = 'warning') {
    const alert = await this.alertCtrl.create({
      header,
      message,
      cssClass: `custom-alert alert-${cssClass}`,
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel',
          cssClass: 'alert-btn-primary'
        }
      ],
      backdropDismiss: true,
      animated: true
    });
    await alert.present();
  }
}
