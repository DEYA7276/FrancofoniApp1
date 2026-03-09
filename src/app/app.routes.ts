import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { supervisorGuard } from './guards/supervisor.guard';
import { usuarioGuard } from './guards/usuario.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'scanner',
    canActivate: [authGuard, usuarioGuard],
    loadComponent: () => import('./scanner/scanner.page').then( m => m.ScannerPage)
  },
  {
    path: 'register',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'participants',
    canActivate: [authGuard, supervisorGuard],
    loadComponent: () => import('./participants/participants.page').then( m => m.ParticipantsPage)
  },
  {
    path: 'stands',
    canActivate: [authGuard, supervisorGuard],
    loadComponent: () => import('./stands/stands.page').then( m => m.StandsPage)
  },
  {
    path: 'survey',
    loadComponent: () => import('./survey/survey.page').then( m => m.SurveyPage)
  },
  {
    path: 'reports',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./reports/reports.page').then( m => m.ReportsPage)
  },
  {
    path: 'guest-dashboard',
    loadComponent: () => import('./guest-dashboard/guest-dashboard.page').then( m => m.GuestDashboardPage)
  },
];
