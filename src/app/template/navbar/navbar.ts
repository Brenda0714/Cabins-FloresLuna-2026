import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Sidebar],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {


  isMenuOpen: boolean = false;
  nombreUsuario: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 🔄 Cada vez que el usuario navegue a otra página (cambio de ruta),
    // forzamos al Navbar a verificar si la sesión sigue viva o ya se cerró.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.refreshNavbar();
    });

    // Verificación inicial al cargar la página de golpe
    this.refreshNavbar();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userFirstName(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = this.authService.getUsuarioActual();
      this.nombreUsuario = user.nombre_completo
      if (user && user.nombre_completo) {
        this.obtenerIniciales();
        // Corta el nombre completo por los espacios y toma la primera palabra
        return user.nombre_completo.trim().split(' ')[0];

      }

    }
    return '';
  }

  // Agrega esto dentro de la clase de tu navbar.component.ts:
  get userRol(): string {
    const user = this.authService.getUsuarioActual();
    if (user) {
      // Si en tu backend mandas 'rol' o 'role', asegúrate de escribirlo igual aquí
      const rolOriginal = user.rol || user.role;
      if (rolOriginal) {
        return rolOriginal.toString().trim().toLowerCase();
      }
      return rolOriginal ? rolOriginal.toLowerCase() : 'cliente';
    }
    return 'cliente';
  }

  // Función simulada para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.refreshNavbar();
    this.cdr.detectChanges();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }

  obtenerIniciales(): string {
    return this.nombreUsuario ? this.nombreUsuario.trim().charAt(0).toUpperCase() : 'U';
  }

  refreshNavbar() {
    this.cdr.detectChanges();
  }

}
