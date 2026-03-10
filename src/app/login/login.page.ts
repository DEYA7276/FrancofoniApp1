import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline, shieldCheckmarkOutline, alertCircleOutline, closeCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule,
    FormsModule, IonItem, IonLabel, IonInput, IonButton,
    IonIcon
  ]
})
export class LoginPage {
  loginMode = 'guest';
  staffEmail = '';
  password = '';
  guestEmail = '';
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({ ticketOutline, shieldCheckmarkOutline, alertCircleOutline, closeCircleOutline, checkmarkCircleOutline });
  }

  async onStaffLogin() {
    if (!this.staffEmail || !this.password) {
      await this.showAlert(
        '⚠️ Campos incompletos',
        'Por favor ingresa tu correo y contraseña.',
        'warning'
      );
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.login(this.staffEmail, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      await this.showAlert(
        '❌ Acceso denegado',
        'Las credenciales que ingresaste son incorrectas. Verifica tu correo y contraseña e intenta de nuevo.',
        'danger'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async onGuestLogin() {
    if (!this.guestEmail) {
      await this.showAlert(
        '⚠️ Correo requerido',
        'Por favor ingresa el correo con el que te registraron al evento.',
        'warning'
      );
      return;
    }

    this.isLoading = true;
    try {
      const success = await this.authService.guestLogin(this.guestEmail);
      if (success) {
        this.router.navigate(['/guest-dashboard']);
      } else {
        await this.showAlert(
          '🔍 No encontrado',
          `El correo "${this.guestEmail}" no coincide con ningún participante registrado. Verifica que sea el correo correcto o contacta al organizador.`,
          'warning'
        );
      }
    } catch (e: any) {
      await this.showAlert(
        '❌ Error de conexión',
        'No se pudo conectar con el servidor. Verifica que tengas conexión a la red.',
        'danger'
      );
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
