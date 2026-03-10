import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * BackendModeService - Controla en RUNTIME si la app usa backend local o Firestore.
 * Lee/escribe en localStorage para que persista sin recompilar.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendModeService {
  private static readonly STORAGE_KEY = 'francofonia_backend_mode';

  private _useLocal: boolean;
  private _useLocal$ = new BehaviorSubject<boolean>(false);
  public useLocal$ = this._useLocal$.asObservable();

  public localApiUrl: string;

  constructor() {
    // Priority: localStorage > environment.ts
    const stored = localStorage.getItem(BackendModeService.STORAGE_KEY);
    if (stored !== null) {
      this._useLocal = stored === 'true';
    } else {
      this._useLocal = environment.useLocalBackend;
    }
    this._useLocal$.next(this._useLocal);
    this.localApiUrl = environment.localApiUrl;
  }

  get isLocal(): boolean {
    return this._useLocal;
  }

  setMode(useLocal: boolean) {
    this._useLocal = useLocal;
    localStorage.setItem(BackendModeService.STORAGE_KEY, String(useLocal));
    this._useLocal$.next(useLocal);
  }

  toggleMode(): boolean {
    this.setMode(!this._useLocal);
    return this._useLocal;
  }

  getModeLabel(): string {
    return this._useLocal ? '🖥️ Local (XAMPP)' : '☁️ Firestore (Internet)';
  }
}
