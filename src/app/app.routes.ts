import { Cancellations } from './components/cancellations/cancellations';
import { Regulation } from './components/regulation/regulation';
import { HowToGet } from './components/how-to-get/how-to-get';
import { Reservations } from './components/reservations/reservations';
import { Gallery } from './components/gallery/gallery';
import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(c => c.Home)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./components/gallery/gallery').then(c => c.Gallery)
  },
  {
    path: 'reservations',
    loadComponent: () => import('./components/reservations/reservations').then(c => c.Reservations)
  },
  {
    path: 'go-to-pay',
    loadComponent: () => import('./components/go-to-pay/go-to-pay').then(c => c.GoToPay)
  },
  {
    path: 'my-purchases',
    loadComponent: () => import('./components/my-purchases/my-purchases').then(c => c.MyPurchases)
  },
  {
    path: 'my-sales',
    loadComponent: () => import('./components/my-sales/my-sales').then(c => c.MySales)
  },
  {
    path: 'how-to-get',
    loadComponent: () => import('./components/how-to-get/how-to-get').then(c => c.HowToGet)
  },
  {
    path: 'cancellations',
    loadComponent: () => import('./components/cancellations/cancellations').then(c => c.Cancellations)
  },
  {
    path: 'regulation',
    loadComponent: () => import('./components/regulation/regulation').then(c => c.Regulation)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(c => c.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(c => c.Register)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'home'
  }

];
