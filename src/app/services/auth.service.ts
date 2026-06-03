import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInKey = 'isLoggedIn';
  private userKey = 'usuario';

  constructor() { }

  // Revisa si el usuario tiene sesión guardada en el navegador
  isLoggedIn(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return sessionStorage.getItem(this.loggedInKey) === 'true';
    }
    return false;
  }

  // Activa la sesión al iniciar correctamente
  login(userData: any): void {
    sessionStorage.setItem(this.loggedInKey, 'true');
    sessionStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  // Destruye la sesión
  logout(): void {
    sessionStorage.removeItem(this.loggedInKey);
    sessionStorage.removeItem(this.userKey);
  }

  // 👤 Función extra por si necesitas sacar los datos del cliente en tus pantallas (ej. Nombre, Correo)
  getUsuarioActual(): any {
    const userJson = sessionStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

}
