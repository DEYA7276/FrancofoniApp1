import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, IonCard, IonCardContent, 
  IonIcon, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, storefrontOutline, personAddOutline, 
  qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonButton, IonContent, IonCard, IonCardContent, 
    IonIcon, IonLabel, IonBadge,
    CommonModule, RouterModule
  ]
})
export class DashboardPage {
  authService = inject(AuthService);
  router = inject(Router);
  user$: Observable<User | null> = this.authService.user$;

  constructor() {
    addIcons({ 
      peopleOutline, storefrontOutline, personAddOutline, 
      qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star
    });
  }

  async logout() {
    await this.authService.logout();
    document.body.classList.remove('modo-gala-activado');
    if (this.galaAudio) { this.galaAudio.pause(); }
    this.router.navigate(['/login']);
  }

  isGalaMode = false;
  galaAudio: HTMLAudioElement | null = null;

  toggleGalaMode() {
    this.isGalaMode = !this.isGalaMode;
    if (this.isGalaMode) {
      document.body.classList.add('modo-gala-activado');
      // Música francesa clásica de fondo
      if (!this.galaAudio) {
        this.galaAudio = new Audio('https://dominoweb.com.mx/assets/fr-gala.mp3'); // Un loop clásico
        // Si no funciona el remoto, usa silencio pero activa visuales
        this.galaAudio.volume = 0.4;
      }
      try { this.galaAudio.play(); } catch(e){}
    } else {
      document.body.classList.remove('modo-gala-activado');
      if (this.galaAudio) { this.galaAudio.pause(); }
    }
  }
}

