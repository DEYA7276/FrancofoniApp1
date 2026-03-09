import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonToast, IonSegment, IonSegmentButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, 
    FormsModule, IonItem, IonLabel, IonInput, IonButton, 
    IonToast, IonSegment, IonSegmentButton, IonButtons, IonIcon
  ]
})
export class LoginPage {
  loginMode = 'guest';
  email = '';
  password = '';
  guestEmail = '';
  errorMessage = '';
  isToastOpen = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ ticketOutline, shieldCheckmarkOutline });
  }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMessage = 'Credenciales inválidas.';
      this.isToastOpen = true;
    }
  }

  async guestLogin() {
    if (!this.guestEmail) {
      this.errorMessage = 'Por favor ingresa tu correo.';
      this.isToastOpen = true;
      return;
    }

    try {
      const success = await this.authService.guestLogin(this.guestEmail);
      if (success) {
        this.router.navigate(['/guest-dashboard']);
      } else {
        this.errorMessage = 'El correo no coincide con ningún participante registrado.';
        this.isToastOpen = true;
      }
    } catch (e: any) {
      this.errorMessage = 'Ocurrió un error al intentar ingresar.';
      this.isToastOpen = true;
    }
  }

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }
}
