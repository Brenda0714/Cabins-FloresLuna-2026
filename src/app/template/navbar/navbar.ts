import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Sidebar],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class Navbar {


isMenuOpen: boolean = false;

isLoggedIn: boolean = false;


constructor(private router: Router) {}

// Función simulada para cerrar sesión
  logout(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/home']);
  }

 }
