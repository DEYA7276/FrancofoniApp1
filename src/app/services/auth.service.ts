import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  public user$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of(null);
      // Ensure docData is called within an injection context
      return runInInjectionContext(this.injector, () => 
        docData(doc(this.firestore, `users/${user.uid}`)) as Observable<User>
      );
    })
  );

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    return signOut(this.auth);
  }
  
  getCurrentUser() {
    return this.auth.currentUser;
  }
}
