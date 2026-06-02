import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInKey = 'isLoggedIn';

  constructor() {}

  // Revisa si el usuario tiene sesión guardada en el navegador
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.loggedInKey) === 'true';
    }
    return false;
  }

  // Activa la sesión al iniciar correctamente
  login(userData: any): void {
    localStorage.setItem(this.loggedInKey, 'true');
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Destruye la sesión
  logout(): void {
    localStorage.removeItem(this.loggedInKey);
    localStorage.removeItem('userData');
  }
}
