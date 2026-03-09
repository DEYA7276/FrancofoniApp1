import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Stand } from '../models/stand.model';

@Injectable({
  providedIn: 'root'
})
export class StandService {
  private firestore = inject(Firestore);

  getStands(): Observable<Stand[]> {
    const q = collection(this.firestore, 'stands');
    return collectionData(q, { idField: 'id' }) as Observable<Stand[]>;
  }

  getStandById(id: string): Observable<Stand> {
    const docRef = doc(this.firestore, `stands/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Stand>;
  }

  getStandsByUsuarioId(usuarioId: string): Observable<Stand[]> {
    const standsRef = collection(this.firestore, 'stands');
    const q = query(standsRef, where('usuarioId', '==', usuarioId));
    return collectionData(q, { idField: 'id' }) as Observable<Stand[]>;
  }

  addStand(stand: Stand) {
    const ref = collection(this.firestore, 'stands');
    return addDoc(ref, stand);
  }

  updateStand(id: string, data: Partial<Stand>) {
    const docRef = doc(this.firestore, `stands/${id}`);
    return updateDoc(docRef, data);
  }

  deleteStand(id: string) {
    const docRef = doc(this.firestore, `stands/${id}`);
    return deleteDoc(docRef);
  }
}
