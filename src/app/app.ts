import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./template/navbar/navbar";
import { Footer } from "./template/footer/footer";
import { isPlatformBrowser } from '@angular/common';
import * as AOS from 'aos';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Cabins-FloresLuna-2026');

  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 1000, // Duración de la animación en ms
        once: false,     // ¿Animar solo una vez al bajar?
        mirror: true,   // ¿Animar de nuevo al subir?
        offset: 120,
      });
    }
  }
}
