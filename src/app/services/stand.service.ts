import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where, getDocs } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stand } from '../models/stand.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class StandService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/stands`; }

  getStands(): Observable<Stand[]> {
    if (this.mode.isLocal) {
      return this.http.get<Stand[]>(this.apiUrl);
    }
    const q = collection(this.firestore, 'stands');
    return collectionData(q, { idField: 'id' }) as Observable<Stand[]>;
  }

  getStandById(id: string): Observable<Stand> {
    if (this.mode.isLocal) {
      return this.http.get<Stand>(`${this.apiUrl}/${id}`);
    }
    const docRef = doc(this.firestore, `stands/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Stand>;
  }

  getStandsByUsuarioId(usuarioId: string): Observable<Stand[]> {
    if (this.mode.isLocal) {
      return this.http.get<Stand[]>(`${this.apiUrl}?usuarioId=${usuarioId}`);
    }
    const standsRef = collection(this.firestore, 'stands');
    const q = query(standsRef, where('usuarioId', '==', usuarioId));
    return collectionData(q, { idField: 'id' }) as Observable<Stand[]>;
  }

  async addStand(stand: Stand): Promise<{ id: string }> {
    if (this.mode.isLocal) {
      const response: any = await this.http.post(this.apiUrl, stand).toPromise();
      return { id: response.id };
    }
    const ref = collection(this.firestore, 'stands');
    const docRef = await addDoc(ref, stand);
    return { id: docRef.id };
  }

  updateStand(id: string, data: Partial<Stand>) {
    if (this.mode.isLocal) {
      return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
    }
    const docRef = doc(this.firestore, `stands/${id}`);
    return updateDoc(docRef, data);
  }

  deleteStand(id: string) {
    if (this.mode.isLocal) {
      return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
    }
    const docRef = doc(this.firestore, `stands/${id}`);
    return deleteDoc(docRef);
  }

  async initializeStands() {
    if (this.mode.isLocal) {
      const response: any = await this.http.post(`${this.apiUrl}/initialize`, {}).toPromise();
      return response?.initialized ?? false;
    }

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
