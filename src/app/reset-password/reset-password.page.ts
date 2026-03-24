import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonIcon, IonInput, IonButton, IonSpinner, IonImg, AlertController } from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BackendModeService } from '../services/backend-mode.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, shieldCheckmarkOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonIcon, IonInput, IonButton, IonSpinner, IonImg
  ]
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  success = false;
  token = '';

  private http = inject(HttpClient);
  private mode = inject(BackendModeService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  constructor() {
    addIcons({ lockClosedOutline, shieldCheckmarkOutline, checkmarkCircleOutline, alertCircleOutline });
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Extraer token de la URL: ?token=abc1234
    this.route.queryParams.subscribe(async params => {
      this.token = params['token'] || '';
      if (!this.token) {
        await this.showAlert(
          '❌ Enlace Inválido',
          'El token no fue encontrado en la URL. El enlace puede estar incompleto.',
          'danger'
        );
      }
    });
  }

  passwordMatchValidator(control: AbstractControl) {
    const p = control.get('password')?.value;
    const cp = control.get('confirmPassword')?.value;
    return p === cp ? null : { mismatch: true };
  }

  async onResetPassword() {
    if (this.resetForm.invalid || !this.token) return;

    this.isLoading = true;
    
    try {
      const new_password = this.resetForm.value.password;
      const url = `${this.mode.localApiUrl}/reset-password`;
      
      const res: any = await this.http.post(url, { token: this.token, new_password }).toPromise();
      
      this.success = true;
      await this.showAlert(
        '✨ Éxito',
        res.message || 'Tu contraseña ha sido actualizada correctamente.',
        'success'
      );
      this.resetForm.reset();
      this.router.navigate(['/login']);
    } catch (e: any) {
      const errorMsg = e.error?.error || 'Ocurrió un error al restablecer la contraseña. El token pudo haber expirado.';
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
