import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, IonList, IonItem, 
  IonIcon, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  peopleOutline, storefrontOutline, personAddOutline, 
  qrCodeOutline, documentTextOutline, barChartOutline 
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
    IonButton, IonContent, IonList, IonItem, 
    IonIcon, IonLabel,
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
      qrCodeOutline, documentTextOutline, barChartOutline 
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}

