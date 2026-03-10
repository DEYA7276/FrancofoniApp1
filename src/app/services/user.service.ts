import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/users`; }

  getUsers(): Observable<User[]> {
    if (this.mode.isLocal) {
      return this.http.get<User[]>(this.apiUrl);
    }
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
  }

  getUserById(id: string): Observable<User> {
    if (this.mode.isLocal) {
      return this.http.get<User>(`${this.apiUrl}/${id}`);
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return docData(userDocRef, { idField: 'id' }) as Observable<User>;
  }

  async createUserAdmin(email: string, password: string, role: 'admin'|'supervisor'|'usuario', standId?: string) {
    if (this.mode.isLocal) {
      return this.http.post(this.apiUrl, { email, password, role, standId: standId || '' }).toPromise();
    }

    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user: User = {
      id: userCredential.user.uid,
      email,
      role: role,
      standId: standId || '',
      createdAt: new Date()
    };
    const userDocRef = doc(this.firestore, `users/${user.id}`);
    return setDoc(userDocRef, user);
  }

  updateUser(id: string, data: Partial<User>) {
    if (this.mode.isLocal) {
      return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return updateDoc(userDocRef, data);
  }

  deleteUser(id: string) {
    if (this.mode.isLocal) {
      return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return deleteDoc(userDocRef);
  }
}
