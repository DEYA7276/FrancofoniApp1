import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private apiUrl = `${environment.localApiUrl}/participants`;

  getParticipants(): Observable<Participant[]> {
    if (environment.useLocalBackend) {
      return this.http.get<Participant[]>(this.apiUrl);
    }
    const pRef = collection(this.firestore, 'participants');
    return collectionData(pRef, { idField: 'id' }) as Observable<Participant[]>;
  }

  getParticipantById(id: string): Observable<Participant> {
    if (environment.useLocalBackend) {
      return this.http.get<Participant>(`${this.apiUrl}/${id}`);
    }
    const docRef = doc(this.firestore, `participants/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Participant>;
  }

  async addParticipant(participant: Participant): Promise<string> {
    if (environment.useLocalBackend) {
      const response: any = await this.http.post(this.apiUrl, participant).toPromise();
      return response.id;
    }
    participant.createdAt = new Date().toISOString();
    const pRef = collection(this.firestore, 'participants');
    const docRef = await addDoc(pRef, participant);
    return docRef.id;
  }

  updateParticipant(id: string, data: Partial<Participant>) {
    if (environment.useLocalBackend) {
      return this.http.put(`${this.apiUrl}/${id}`, data).toPromise();
    }
    const docRef = doc(this.firestore, `participants/${id}`);
    return updateDoc(docRef, data);
  }

  deleteParticipant(id: string) {
    if (environment.useLocalBackend) {
      return this.http.delete(`${this.apiUrl}/${id}`).toPromise();
    }
    const docRef = doc(this.firestore, `participants/${id}`);
    return deleteDoc(docRef);
  }
}
