import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, 
  IonInput, IonSelect, IonSelectOption, IonButton, 
  AlertController 
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
  private alertCtrl = inject(AlertController);

  email = '';
  password = '';
  role: 'admin' | 'supervisor' | 'usuario' = 'usuario';

  async registerUser() {
    if (!this.email || !this.password || !this.role) {
      await this.showAlert('⚠️ Campos incompletos', 'Completa todos los campos para registrar un nuevo usuario.', 'warning');
      return;
    }

    try {
      await this.userService.createUserAdmin(this.email, this.password, this.role);
      await this.showAlert('✅ Usuario creado', `El usuario "${this.email}" fue registrado exitosamente con rol de ${this.role}.`, 'success');
      this.email = '';
      this.password = '';
      this.role = 'usuario';
    } catch (e: any) {
      await this.showAlert('❌ Error al registrar', 'No se pudo crear el usuario: ' + e.message, 'danger');
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
