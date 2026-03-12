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
import { StandService } from '../services/stand.service';
import { User } from '../models/user.model';
import { Stand } from '../models/stand.model';
import { Observable, firstValueFrom, take } from 'rxjs';

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
  private standService = inject(StandService);
  private alertCtrl = inject(AlertController);

  email = '';
  password = '';
  role: 'admin' | 'supervisor' | 'usuario' = 'usuario';
  selectedStandId = '';
  editingUser: User | null = null;

  users$!: Observable<User[]>;
  stands$!: Observable<Stand[]>;

  constructor() {
    addIcons({ create, trash, shieldCheckmarkOutline, personOutline });
  }

  ngOnInit() {
    this.users$ = this.userService.getUsers();
    this.stands$ = this.standService.getStands();
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

    // Guard: Only one admin allowed
    if (this.role === 'admin') {
      const users = await firstValueFrom(this.userService.getUsers().pipe(take(1)));
      if (users.some(u => u.role === 'admin')) {
        await this.showAlert('⚠️ Límite de Administradores', 'Ya existe un administrador en el sistema. El correo de admin debe ser único.', 'warning');
        return;
      }
    }

    if (this.role === 'usuario' && !this.selectedStandId) {
      await this.showAlert('⚠️ Stand requerido', 'Debes asignar un stand al encargado para que pueda escanear QRs correctamente.', 'warning');
      return;
    }

    try {
      await this.userService.createUserAdmin(this.email, this.password, this.role, 
        this.role === 'usuario' ? this.selectedStandId : undefined
      );
      const standMsg = this.role === 'usuario' ? ' y se le asignó su stand.' : '.';
      await this.showAlert('✅ Usuario creado', `El usuario "${this.email}" fue registrado como ${this.getRoleLabel(this.role)}${standMsg}`, 'success');
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
    this.selectedStandId = user.standId || '';
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

    // Guard: Only one admin allowed
    if (this.role === 'admin' && this.editingUser.role !== 'admin') {
      const users = await firstValueFrom(this.userService.getUsers().pipe(take(1)));
      if (users.some(u => u.role === 'admin')) {
        await this.showAlert('⚠️ Límite de Administradores', 'Ya existe un administrador en el sistema.', 'warning');
        return;
      }
    }

    if (this.role === 'usuario' && !this.selectedStandId) {
      await this.showAlert('⚠️ Stand requerido', 'Asigna un stand al encargado.', 'warning');
      return;
    }

    try {
      const updateData: Partial<User> = { role: this.role };
      if (this.role === 'usuario') {
        updateData.standId = this.selectedStandId;
      } else {
        updateData.standId = '';
      }

      await this.userService.updateUser(this.editingUser.id!, updateData);
      await this.showAlert('✅ Actualizado', `"${this.editingUser.email}" ahora es ${this.getRoleLabel(this.role)}.`, 'success');
      this.resetForm();
    } catch (e: any) {
      await this.showAlert('❌ Error', 'No se pudo actualizar: ' + e.message, 'danger');
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
              await this.showAlert('✅ Eliminado', `"${user.email}" fue eliminado.`, 'success');
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
    this.selectedStandId = '';
    this.editingUser = null;
  }

  getStandName(standId: string, stands: Stand[]): string {
    const stand = stands.find(s => s.id === standId);
    return stand ? stand.nombre : 'Sin asignar';
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
