import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey } from '../models/survey.model';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/surveys`; }

  addSurvey(survey: Survey) {
    if (this.mode.isLocal) {
      return this.http.post(this.apiUrl, survey).toPromise();
    }
    const ref = collection(this.firestore, 'surveys');
    survey.fecha = new Date().toISOString();
    return addDoc(ref, survey);
  }

  getAllSurveys(): Observable<Survey[]> {
    if (this.mode.isLocal) {
      return this.http.get<Survey[]>(this.apiUrl);
    }
    const q = collection(this.firestore, 'surveys');
    return collectionData(q, { idField: 'id' }) as Observable<Survey[]>;
  }
}
