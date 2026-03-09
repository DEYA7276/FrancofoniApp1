import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonToggle, IonButton, IonList, IonListHeader,
  IonBadge, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create } from 'ionicons/icons';
import { StandService } from '../services/stand.service';
import { UserService } from '../services/user.service';
import { Stand } from '../models/stand.model';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-stands',
  templateUrl: './stands.page.html',
  styleUrls: ['./stands.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonToggle, IonButton, IonList, IonListHeader,
    IonBadge, IonIcon,
    CommonModule, FormsModule
  ]
})
export class StandsPage {
  private standService = inject(StandService);
  private userService = inject(UserService);

  stands$: Observable<Stand[]> = this.standService.getStands();
  usuarios$: Observable<User[]> = this.userService.getUsers().pipe(
    map(users => users.filter(u => u.role === 'usuario'))
  );

  newStand: Stand = {
    nombre: '',
    descripcion: '',
    usuarioId: '',
    activo: true
  };

  constructor() {
    addIcons({ trash, create });
  }

  async addStand() {
    if (!this.newStand.usuarioId) {
       alert("Por favor asigne un encargado al stand");
       return;
    }
    
    if (this.newStand.id) {
      await this.standService.updateStand(this.newStand.id, this.newStand);
    } else {
      await this.standService.addStand(this.newStand);
    }
    this.resetForm();
  }

  editStand(s: Stand) {
    this.newStand = { ...s };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newStand = { nombre: '', descripcion: '', usuarioId: '', activo: true };
  }

  async deleteStand(id: string) {
    if(confirm('¿Seguro que deseas eliminar este stand?')) {
      await this.standService.deleteStand(id);
    }
  }

  getEncargadoName(users: User[] | null, usuarioId: string): string {
    if (!users) return usuarioId;
    const u = users.find(x => x.id === usuarioId);
    return u ? u.email : usuarioId;
  }
}
