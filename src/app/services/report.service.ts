import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BackendModeService } from './backend-mode.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private mode = inject(BackendModeService);

  private get apiUrl() { return `${this.mode.localApiUrl}/reports`; }

  async getVisitsPerStand(): Promise<any[]> {
    const data: any = await this.http.get<any[]>(`${this.apiUrl}/visits-per-stand`).toPromise();
    return data || [];
  }

  async getMostVisitedStand(): Promise<any> {
    return await this.http.get<any>(`${this.apiUrl}/most-visited`).toPromise();
  }

  async getStandRatings(): Promise<any[]> {
    const data: any = await this.http.get<any[]>(`${this.apiUrl}/stand-ratings`).toPromise();
    return data || [];
  }

  async getGlobalFlow(): Promise<any[]> {
    const data: any = await this.http.get<any[]>(`${this.apiUrl}/global-flow`).toPromise();
    return data || [];
  }

  async getStandFlows(): Promise<any[]> {
    const data: any = await this.http.get<any[]>(`${this.apiUrl}/stand-flows`).toPromise();
    return data || [];
  }

  async getFullSummary(): Promise<any> {
    return await this.http.get<any>(`${this.apiUrl}/summary`).toPromise();
  }
}
