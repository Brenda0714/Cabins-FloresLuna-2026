import { Routes } from '@angular/router';

export const routes: Routes = [

    {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(c => c.Home)
  },
    {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'home'
  }

];
