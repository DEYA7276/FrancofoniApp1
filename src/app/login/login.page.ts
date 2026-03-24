import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline, shieldCheckmarkOutline, alertCircleOutline, closeCircleOutline, checkmarkCircleOutline, phonePortraitOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BackendModeService } from '../services/backend-mode.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule,
    FormsModule, IonItem, IonLabel, IonInput, IonButton,
    IonIcon,
    RouterLink
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
  private http = inject(HttpClient);
  private backendMode = inject(BackendModeService);

  constructor() {
    addIcons({ ticketOutline, shieldCheckmarkOutline, alertCircleOutline, closeCircleOutline, checkmarkCircleOutline, phonePortraitOutline });
  }

  async showMobileInstructions() {
    try {
      const res: any = await this.http.get(`${this.backendMode.localApiUrl}/network-info`).toPromise();
      await this.showAlert(
        '📱 Usar desde Celular',
        `Para abrir esta app y la cámara QR desde tu dispositivo móvil, asegúrate de conectarlo a este mismo WiFi y entra a la siguiente dirección:\n\n🔗 ${res.full_url}\n\n(Puedes tomarle foto para no olvidarla)`,
        'success'
      );
    } catch (e) {
      this.showAlert('❌ Error de red', 'Asegúrate de estar ejecutando XAMPP.', 'danger');
    }
  }

  private getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': '👑 Administrador',
      'supervisor': '🛡️ Supervisor',
      'usuario': '📱 Encargado de Stand'
    };
    return labels[role] || role;
  }

  private getRoleEmoji(role: string): string {
    const emojis: Record<string, string> = {
      'admin': '👑',
      'supervisor': '🛡️',
      'usuario': '📱'
    };
    return emojis[role] || '✨';
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
      
      // Get user data for welcome modal
      this.authService.user$.pipe(take(1)).subscribe(async user => {
        if (user) {
          const roleLabel = this.getRoleLabel(user.role);
          const emoji = this.getRoleEmoji(user.role);
          const name = user.email.split('@')[0];

          const welcomeAlert = await this.alertCtrl.create({
            header: `${emoji} ¡Bienvenue!`,
            subHeader: `Bienvenido al Panel de ${roleLabel}`,
            message: `Hola ${name}, tu sesión se ha iniciado correctamente. ¡Que disfrutes la Francofonía 2026!`,
            cssClass: 'custom-alert alert-success',
            buttons: [{
              text: '¡Vamos! 🚀',
              cssClass: 'alert-btn-primary',
              handler: () => {
                this.router.navigate(['/dashboard']);
              }
            }]
          });
          await welcomeAlert.present();
        } else {
          this.router.navigate(['/dashboard']);
        }
      });
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
        const welcomeAlert = await this.alertCtrl.create({
          header: '🎉 ¡Bienvenido!',
          subHeader: 'Panel de Visitante',
          message: `¡Genial! Tu correo fue verificado. Disfruta tu recorrido por la Francofonía 2026 y no olvides visitar todos los stands.`,
          cssClass: 'custom-alert alert-success',
          buttons: [{
            text: '¡Explorar! 🇫🇷',
            cssClass: 'alert-btn-primary',
            handler: () => {
              this.router.navigate(['/guest-dashboard']);
            }
          }]
        });
        await welcomeAlert.present();
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
