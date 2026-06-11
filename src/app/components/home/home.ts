import { ApplicationConfig, ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from '../../app.routes';
import { isPlatformBrowser } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled', // <--- FUNDAMENTAL
        scrollPositionRestoration: 'enabled'
      })
    )
  ]
};
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {

  HeroImg = signal([
    "assets/img/HOME/IMG-HERO1.png",
    "assets/img/HOME/IMG-HERO2.png",
    "assets/img/HOME/IMG-HERO3.png",
    "assets/img/HOME/IMG-HERO4.png",
    "assets/img/HOME/IMG-HERO5.png",
    "assets/img/HOME/IMG-HERO6.png",
    "assets/img/HOME/IMG-HERO7.png",
    "assets/img/HOME/IMG-HERO8.png",
    "assets/img/HOME/IMG-HERO9.png",
    "assets/img/HOME/IMG-HERO10.png"

  ]);

  // Señal para saber qué imagen mostrar (empieza en la 0)
  imgActiva = signal<number>(0);

  // Guardamos la referencia del timer para poder destruirlo
  private carruselTimer: any;

  ngOnInit() {
    this.iniciarCarrusel();
  }
  ngOnDestroy() {
    // Limpiamos el timer cuando el usuario cambie de página para evitar fugas de memoria
    if (this.carruselTimer) {
      clearInterval(this.carruselTimer);
    }
  }

  iniciarCarrusel() {
    this.carruselTimer = setInterval(() => {
      this.siguienteImg();
    }, 5000); // Cambia cada 5 segundos
  }

  // Ir a la siguiente imagen (vuelve a 0 si llega al final)
  siguienteImg() {
    const total = this.HeroImg().length;
    this.imgActiva.update(index => (index + 1) % total);
  }

  // Ir a la imagen anterior
  anteriorImg() {
    const total = this.HeroImg().length;
    this.imgActiva.update(index => (index - 1 + total) % total);
  }

  // Seleccionar una imagen específica con los puntitos (dots)
  seleccionarImg(index: number) {
    this.imgActiva.set(index);
    // Reiniciamos el timer para que el usuario tenga 5 segundos limpios tras hacer click
    clearInterval(this.carruselTimer);
    this.iniciarCarrusel();
  }


 }
