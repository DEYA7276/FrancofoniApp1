import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey } from '../models/survey.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private apiUrl = `${environment.localApiUrl}/surveys`;

  addSurvey(survey: Survey) {
    if (environment.useLocalBackend) {
      return this.http.post(this.apiUrl, survey).toPromise();
    }
    const ref = collection(this.firestore, 'surveys');
    survey.fecha = new Date().toISOString();
    return addDoc(ref, survey);
  }

  getAllSurveys(): Observable<Survey[]> {
    if (environment.useLocalBackend) {
      return this.http.get<Survey[]>(this.apiUrl);
    }
    const q = collection(this.firestore, 'surveys');
    return collectionData(q, { idField: 'id' }) as Observable<Survey[]>;
  }
}
