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
)
  {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

// Función simulada para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

 }
