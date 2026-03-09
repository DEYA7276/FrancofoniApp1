import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Survey } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private firestore = inject(Firestore);

  addSurvey(survey: Survey) {
    const ref = collection(this.firestore, 'surveys');
    survey.fecha = new Date().toISOString();
    return addDoc(ref, survey);
  }

  getAllSurveys(): Observable<Survey[]> {
    const q = collection(this.firestore, 'surveys');
    return collectionData(q, { idField: 'id' }) as Observable<Survey[]>;
  }
}
