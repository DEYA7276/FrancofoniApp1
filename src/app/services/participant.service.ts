import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private firestore = inject(Firestore);

  getParticipants(): Observable<Participant[]> {
    const pRef = collection(this.firestore, 'participants');
    return collectionData(pRef, { idField: 'id' }) as Observable<Participant[]>;
  }

  getParticipantById(id: string): Observable<Participant> {
    const docRef = doc(this.firestore, `participants/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Participant>;
  }

  async addParticipant(participant: Participant): Promise<string> {
    participant.createdAt = new Date().toISOString();
    const pRef = collection(this.firestore, 'participants');
    const docRef = await addDoc(pRef, participant);
    return docRef.id;
  }

  updateParticipant(id: string, data: Partial<Participant>) {
    const docRef = doc(this.firestore, `participants/${id}`);
    return updateDoc(docRef, data);
  }

  deleteParticipant(id: string) {
    const docRef = doc(this.firestore, `participants/${id}`);
    return deleteDoc(docRef);
  }
}
