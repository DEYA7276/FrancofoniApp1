import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
<<<<<<< HEAD
  IonButton, IonContent, IonCard, IonCardContent, 
  IonIcon, IonBadge
=======
  IonButton, IonContent, IonList, IonItem, 
  IonIcon, IonLabel 
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, storefrontOutline, personAddOutline, 
<<<<<<< HEAD
  qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
=======
  qrCodeOutline, documentTextOutline, barChartOutline 
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
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
<<<<<<< HEAD
    IonButton, IonContent, IonCard, IonCardContent, 
    IonIcon, IonBadge,
=======
    IonButton, IonContent, IonList, IonItem, 
    IonIcon, IonLabel,
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
    CommonModule, RouterModule
  ]
})
export class DashboardPage {
  authService = inject(AuthService);
<<<<<<< HEAD
  standService = inject(StandService);
  router = inject(Router);
  user$ = this.authService.user$;
=======
  router = inject(Router);
  user$: Observable<User | null> = this.authService.user$;
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be

  constructor() {
    addIcons({ 
      peopleOutline, storefrontOutline, personAddOutline, 
<<<<<<< HEAD
      qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star
    });
    // Inicializar stands si la colección está vacía
    this.standService.initializeStands().then(created => {
      if (created) console.log('Stands iniciales creados correctamente');
=======
      qrCodeOutline, documentTextOutline, barChartOutline 
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
    });
  }

  async logout() {
    await this.authService.logout();
<<<<<<< HEAD
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
=======
    this.router.navigate(['/login']);
  }
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
}

