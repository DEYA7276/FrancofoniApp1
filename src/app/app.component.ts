import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { BackendModeService } from './services/backend-mode.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private backendMode = inject(BackendModeService);

  ngOnInit() {
    // Restore local session if using local backend
    if (this.backendMode.isLocal) {
      this.authService.restoreLocalSession();
    }
  }
}
