import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, 
  IonInput, IonSelect, IonSelectOption, IonButton, 
  ToastController 
} from '@ionic/angular/standalone';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, 
    IonInput, IonSelect, IonSelectOption, IonButton,
    CommonModule, FormsModule
  ]
})
export class RegisterPage {
  private userService = inject(UserService);
  private toastCtrl = inject(ToastController);

  email = '';
  password = '';
  role: 'admin' | 'supervisor' | 'usuario' = 'usuario';

  async registerUser() {
    if (!this.email || !this.password || !this.role) {
      this.showToast('Completa todos los campos');
      return;
    }

    try {
      await this.userService.createUserAdmin(this.email, this.password, this.role);
      this.showToast('Usuario registrado con éxito', 'success');
      this.email = '';
      this.password = '';
      this.role = 'usuario';
    } catch (e: any) {
      this.showToast('Error al registrar usuario: ' + e.message, 'danger');
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

