import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, docData, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

  private guestSubject = new BehaviorSubject<Participant | null>(null);
  public guest$ = this.guestSubject.asObservable();

  public user$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of(null);
      return runInInjectionContext(this.injector, () => 
        docData(doc(this.firestore, `users/${user.uid}`)) as Observable<User>
      );
    })
  );

  async login(email: string, password: string) {
    this.guestSubject.next(null); // Clear guest session on staff login
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async guestLogin(email: string): Promise<boolean> {
    const participantsRef = collection(this.firestore, 'participants');
    const q = query(participantsRef, where('correo', '==', email.toLowerCase().trim()));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      const p = { id: snap.docs[0].id, ...snap.docs[0].data() } as Participant;
      this.guestSubject.next(p);
      await signOut(this.auth); // Clear staff session on guest login
      return true;
    }
    return false;
  }

  async logout() {
    this.guestSubject.next(null);
    return signOut(this.auth);
  }
  
  getCurrentUser() {
    return this.auth.currentUser;
  }
}
