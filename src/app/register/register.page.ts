import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, 
  IonTitle, IonContent, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonItem, IonLabel, 
  IonInput, IonSelect, IonSelectOption, IonButton, 
  IonList, IonListHeader, IonBadge, IonIcon,
  AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash, shieldCheckmarkOutline, personOutline } from 'ionicons/icons';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';

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
    IonList, IonListHeader, IonBadge, IonIcon,
    CommonModule, FormsModule
  ]
})
export class RegisterPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  
  private userService = inject(UserService);
  private alertCtrl = inject(AlertController);

  email = '';
  password = '';
  role: 'admin' | 'supervisor' | 'usuario' = 'usuario';
  editingUser: User | null = null;

  users$!: Observable<User[]>;

  constructor() {
    addIcons({ create, trash, shieldCheckmarkOutline, personOutline });
  }

  ngOnInit() {
    this.users$ = this.userService.getUsers();
  }

  async registerUser() {
    if (!this.email || !this.password || !this.role) {
      await this.showAlert('⚠️ Campos incompletos', 'Completa todos los campos para registrar un nuevo usuario.', 'warning');
      return;
    }

    if (this.password.length < 6) {
      await this.showAlert('⚠️ Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    try {
      await this.userService.createUserAdmin(this.email, this.password, this.role);
      await this.showAlert('✅ Usuario creado', `El usuario "${this.email}" fue registrado exitosamente con rol de ${this.getRoleLabel(this.role)}.`, 'success');
      this.resetForm();
    } catch (e: any) {
      const msg = e.message?.includes('already-in-use') 
        ? 'Este correo ya está registrado.' 
        : 'No se pudo crear el usuario: ' + e.message;
      await this.showAlert('❌ Error al registrar', msg, 'danger');
    }
  }

  editUser(user: User) {
    this.editingUser = user;
    this.role = user.role;
    this.content?.scrollToTop(500);
    setTimeout(() => {
      const formCard = document.querySelector('app-register ion-card');
      if (formCard) {
        formCard.classList.add('flash-highlight');
        setTimeout(() => {
          formCard.classList.remove('flash-highlight');
          formCard.classList.add('flash-highlight-fade');
          setTimeout(() => formCard.classList.remove('flash-highlight-fade'), 1200);
        }, 800);
      }
    }, 550);
  }

  async updateUserRole() {
    if (!this.editingUser) return;
    try {
      await this.userService.updateUser(this.editingUser.id!, { role: this.role });
      await this.showAlert('✅ Rol actualizado', `El usuario "${this.editingUser.email}" ahora es ${this.getRoleLabel(this.role)}.`, 'success');
      this.resetForm();
    } catch (e: any) {
      await this.showAlert('❌ Error', 'No se pudo actualizar el rol: ' + e.message, 'danger');
    }
  }

  async deleteUser(user: User) {
    const alert = await this.alertCtrl.create({
      header: '🗑️ Eliminar usuario',
      message: `¿Estás seguro de que deseas eliminar a "${user.email}"? Esta acción no se puede deshacer.`,
      cssClass: 'custom-alert alert-danger',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-btn-secondary' },
        {
          text: 'Eliminar',
          cssClass: 'alert-btn-danger',
          handler: async () => {
            try {
              await this.userService.deleteUser(user.id!);
              await this.showAlert('✅ Eliminado', `El usuario "${user.email}" fue eliminado correctamente.`, 'success');
            } catch (e: any) {
              await this.showAlert('❌ Error', 'No se pudo eliminar: ' + e.message, 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  resetForm() {
    this.email = '';
    this.password = '';
    this.role = 'usuario';
    this.editingUser = null;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'usuario': 'Encargado de Stand'
    };
    return labels[role] || role;
  }

  getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      'admin': 'danger',
      'supervisor': 'warning',
      'usuario': 'tertiary'
    };
    return colors[role] || 'medium';
  }

  getRoleIcon(role: string): string {
    return role === 'admin' || role === 'supervisor' ? 'shield-checkmark-outline' : 'person-outline';
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
