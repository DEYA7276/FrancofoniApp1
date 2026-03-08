import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
  }

  getUserById(id: string): Observable<User> {
    const userDocRef = doc(this.firestore, `users/${id}`);
    return docData(userDocRef, { idField: 'id' }) as Observable<User>;
  }

  async createUserAdmin(email: string, password: string, role: 'admin'|'supervisor'|'usuario') {
    // Note: Creating another user requires either Firebase Admin SDK or secondary app.
    // In client side we might do this or a Cloud Function. Standard client approach will auto login the new user.
    // For simplicity, we create it and they must re-login if needed, or we use a separate firebaseApp instance.
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
    const userDocRef = doc(this.firestore, `users/${id}`);
    return updateDoc(userDocRef, data);
  }

  deleteUser(id: string) {
    const userDocRef = doc(this.firestore, `users/${id}`);
    return deleteDoc(userDocRef);
  }
}
