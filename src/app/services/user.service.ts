import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private http = inject(HttpClient);
  private apiUrl = `${environment.localApiUrl}/users`;

  getUsers(): Observable<User[]> {
    if (environment.useLocalBackend) {
      return this.http.get<User[]>(this.apiUrl);
    }
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
  }

  getUserById(id: string): Observable<User> {
    if (environment.useLocalBackend) {
      return this.http.get<User>(`${this.apiUrl}/${id}`);
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return docData(userDocRef, { idField: 'id' }) as Observable<User>;
  }

  async createUserAdmin(email: string, password: string, role: 'admin'|'supervisor'|'usuario') {
    if (environment.useLocalBackend) {
      return this.http.post(this.apiUrl, { email, password, role }).toPromise();
    }

    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user: User = {
      id: userCredential.user.uid,
      email,
      role: role,
      createdAt: new Date()
    };
    const userDocRef = doc(this.firestore, `users/${user.id}`);
    return setDoc(userDocRef, user);
  }

  updateUser(id: string, data: Partial<User>) {
    if (environment.useLocalBackend) {
      return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return updateDoc(userDocRef, data);
  }

  deleteUser(id: string) {
    if (environment.useLocalBackend) {
      return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
    }
    const userDocRef = doc(this.firestore, `users/${id}`);
    return deleteDoc(userDocRef);
  }
}
