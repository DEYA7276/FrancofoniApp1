import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
<<<<<<< HEAD
import { Firestore, doc, docData, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Participant } from '../models/participant.model';
=======
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);

<<<<<<< HEAD
  private guestSubject = new BehaviorSubject<Participant | null>(null);
  public guest$ = this.guestSubject.asObservable();

  public user$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of(null);
=======
  public user$: Observable<User | null> = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of(null);
      // Ensure docData is called within an injection context
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
      return runInInjectionContext(this.injector, () => 
        docData(doc(this.firestore, `users/${user.uid}`)) as Observable<User>
      );
    })
  );

  async login(email: string, password: string) {
<<<<<<< HEAD
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
=======
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
>>>>>>> 8f319084bc27d9d3beef2a6fdbb0087f8f4291be
    return signOut(this.auth);
  }
  
  getCurrentUser() {
    return this.auth.currentUser;
  }
}
