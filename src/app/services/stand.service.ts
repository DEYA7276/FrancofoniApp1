import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
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

  async initializeStands() {
    const defaultStands: Partial<Stand>[] = [
      { nombre: 'Crepê', responsable: 'Adriana García', descripcion: 'Deliciosas crepas francesas', activo: true, usuarioId: '' },
      { nombre: 'Quiche Lorraine', responsable: 'Mildred Zoé', descripcion: 'Clásico quiche de Lorena', activo: true, usuarioId: '' },
      { nombre: 'Croquembouche', responsable: 'José Emilio', descripcion: 'Torre de profitroles con caramelo', activo: true, usuarioId: '' },
      { nombre: 'Crème Brûlée', responsable: 'Selina Maldonado', descripcion: 'Postre de crema con azúcar quemada', activo: true, usuarioId: '' },
      { nombre: 'Croissant', responsable: 'Ivan Atzin', descripcion: 'Pan de hojaldre mantecoso', activo: true, usuarioId: '' }
    ];

    const standsRef = collection(this.firestore, 'stands');
    const snapshot = await getDocs(standsRef);
    
    if (snapshot.empty) {
      for (const stand of defaultStands) {
        await addDoc(standsRef, stand);
      }
      return true;
    }
    return false;
  }
}
