import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Navbar } from "./template/navbar/navbar";
import { Footer } from "./template/footer/footer";
import { isPlatformBrowser } from '@angular/common';
import { UsuariosComponent } from './services/usuario.component';;
import { init } from 'aos';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, UsuariosComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Cabins-FloresLuna-2026');

  private platformId = inject(PLATFORM_ID);

  showNavAndFooter = true;

  constructor(private router: Router) {
    // Escuchamos cada vez que el usuario cambia de página/ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si la ruta actual contiene 'login' o 'register', ocultamos el menú
      const currentUrl = event.urlAfterRedirects;
      this.showNavAndFooter = !(currentUrl.includes('/login') || currentUrl.includes('/register'));
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      init({
        duration: 1000, // Duración de la animación en ms
        once: false,     // ¿Animar solo una vez al bajar?
        mirror: true,   // ¿Animar de nuevo al subir?
        offset: 120,
      });
    }
  }
}
