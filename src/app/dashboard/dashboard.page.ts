import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, IonCard, IonCardContent, 
  IonIcon, IonBadge, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, storefrontOutline, personAddOutline, 
  qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star,
  cloudOutline, serverOutline, swapHorizontalOutline
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { StandService } from '../services/stand.service';
import { BackendModeService } from '../services/backend-mode.service';
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
    IonIcon, IonBadge,
    CommonModule, RouterModule
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  authService = inject(AuthService);
  standService = inject(StandService);
  backendMode = inject(BackendModeService);
  router = inject(Router);
  private alertCtrl = inject(AlertController);
  user$ = this.authService.user$;
  currentUser: User | null = null;
  private emailQueueInterval: any;

  constructor() {
    addIcons({ 
      peopleOutline, storefrontOutline, personAddOutline, 
      qrCodeOutline, documentTextOutline, barChartOutline, wineOutline, star,
      cloudOutline, serverOutline, swapHorizontalOutline
    });
    // Inicializar stands si la colección está vacía
    this.standService.initializeStands().then(created => {
      if (created) console.log('Stands iniciales creados correctamente');
    });
  }

  ngOnInit() {
    this.user$.subscribe(user => {
      this.currentUser = user;
    });

    // Iniciar el procesador de correos en segundo plano
    this.emailQueueInterval = setInterval(() => {
        if (this.backendMode.isLocal && this.currentUser && this.currentUser.role === 'admin') {
            fetch(`${this.backendMode.localApiUrl}/process_email_queue.php`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.exitos > 0) {
                        console.log(`Envío en 2do plano: ${data.exitos} correos enviados exitosamente.`);
                    }
                })
                .catch(err => {}); // Fail silenciosamente
        }
    }, 20000); // Cada 20 segundos
  }

  ngOnDestroy() {
    if (this.emailQueueInterval) {
        clearInterval(this.emailQueueInterval);
    }
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

  async toggleBackendMode() {
    const currentLabel = this.backendMode.getModeLabel();
    const newLabel = this.backendMode.isLocal ? '☁️ Firestore (Internet)' : '🖥️ Local (XAMPP)';

    const alert = await this.alertCtrl.create({
      header: '🔄 Cambiar modo de backend',
      subHeader: `Modo actual: ${currentLabel}`,
      message: `¿Deseas cambiar a ${newLabel}? La app se recargará para aplicar los cambios.`,
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Cambiar',
          cssClass: 'alert-btn-primary',
          handler: () => {
            this.backendMode.toggleMode();
            localStorage.removeItem('localUser');
            window.location.reload();
          }
        }
      ]
    });
    await alert.present();
  }
}
