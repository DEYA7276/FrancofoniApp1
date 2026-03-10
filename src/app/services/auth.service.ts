import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, docData, collection, query, where, getDocs } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Participant } from '../models/participant.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private guestSubject = new BehaviorSubject<Participant | null>(null);
  public guest$ = this.guestSubject.asObservable();

  // For local mode: store user in a BehaviorSubject
  private localUserSubject = new BehaviorSubject<User | null>(null);

  // user$ needs to handle both modes dynamically
  public user$: Observable<User | null> = this.mode.useLocal$
    .pipe(
      switchMap(isLocal => {
        if (isLocal) {
          return this.localUserSubject.asObservable();
        }
        return authState(this.auth).pipe(
          switchMap(user => {
            if (!user) return of(null);
            return runInInjectionContext(this.injector, () =>
              docData(doc(this.firestore, `users/${user.uid}`)) as Observable<User>
            );
          })
        );
      })
    );

  async login(email: string, password: string) {
    this.guestSubject.next(null);

    if (this.mode.isLocal) {
      const response: any = await this.http.post(`${this.mode.localApiUrl}/auth/login`, { email, password }).toPromise();
      if (response && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
          standId: response.user.standId,
          createdAt: response.user.createdAt ? new Date(response.user.createdAt) : new Date()
        };
        this.localUserSubject.next(user);
        localStorage.setItem('localUser', JSON.stringify(user));
        return { user: response.user };
      }
      throw new Error('Credenciales inválidas');
    }

    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async guestLogin(email: string): Promise<boolean> {
    if (this.mode.isLocal) {
      try {
        const response: any = await this.http.post(`${this.mode.localApiUrl}/auth/guest-login`, { correo: email }).toPromise();
        if (response && response.found) {
          this.guestSubject.next(response.participant);
          this.localUserSubject.next(null);
          localStorage.removeItem('localUser');
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    const participantsRef = collection(this.firestore, 'participants');
    const q = query(participantsRef, where('correo', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const p = { id: snap.docs[0].id, ...snap.docs[0].data() } as Participant;
      this.guestSubject.next(p);
      await signOut(this.auth);
      return true;
    }
    return false;
  }

  async logout() {
    this.guestSubject.next(null);

    if (this.mode.isLocal) {
      this.localUserSubject.next(null);
      localStorage.removeItem('localUser');
      return;
    }

    return signOut(this.auth);
  }

  getCurrentUser() {
    if (this.mode.isLocal) {
      return this.localUserSubject.getValue();
    }
    return this.auth.currentUser;
  }

  restoreLocalSession() {
    if (this.mode.isLocal) {
      const stored = localStorage.getItem('localUser');
      if (stored) {
        try {
          const user = JSON.parse(stored) as User;
          this.localUserSubject.next(user);
        } catch {
          localStorage.removeItem('localUser');
        }
      }
    }
  }
}
