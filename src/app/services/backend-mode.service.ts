import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * BackendModeService - Configuración para modo LOCAL ONLY
 * No hay opción de Firebase - solo API PHP/MySQL local
 */
@Injectable({
  providedIn: 'root'
})
export class BackendModeService {
  // Siempre modo local - no hay opción de cambiar
  public readonly isLocal: boolean = true;
  
  public localApiUrl: string;

  constructor() {
    this.localApiUrl = environment.localApiUrl;
  }

  getModeLabel(): string {
    return '🖥️ Local (XAMPP)';
  }

  // Métodos mantenidos por compatibilidad pero no hacen nada
  get useLocal$() {
    return new BehaviorSubject<boolean>(true).asObservable();
  }

  setMode(useLocal: boolean): void {
    // No-op - siempre local
  }

  toggleMode(): boolean {
    return true;
  }
}
