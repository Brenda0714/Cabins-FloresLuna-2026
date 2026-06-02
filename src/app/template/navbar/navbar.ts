import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Sidebar],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class Navbar {


  isMenuOpen: boolean = false;


  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userFirstName(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.nombre_completo) {
          // Corta el nombre completo por los espacios y toma la primera palabra
          return user.nombre_completo.trim().split(' ')[0];
        }
      }
    }
    return '';
  }

  // Agrega esto dentro de la clase de tu navbar.component.ts:
  get userRol(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        // Convertimos a minúsculas para que el IF del HTML no falle si en la BD viene "ADMIN" o "Admin"
        return user.rol ? user.rol.toLowerCase() : 'cliente';
      }
    }
    return 'cliente';
  }

  // Función simulada para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

}
