import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-reservations',
  imports: [],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservations {

  BackImg = signal<string[]>([
    'assets/img/RESERVACIONES/section1.png',
    'assets/img/RESERVACIONES/section2.png',
    'assets/img/RESERVACIONES/section3.png',
  ]);

  Cabins = signal([
    { id:1, img: 'assets/img/GALERIA/tu-imagen-5.png', title: 'Orquídea', subtitle: 'Cabaña para Parejas', precio: '3,500',
      text : ['2 Personas','1 Recámara', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[0],
    },
    { id:2, img: 'assets/img/GALERIA/tu-imagen-4.png', title: 'Girasol',  subtitle: 'Cabaña Familiar',     precio: '4,000',
      text : ['6 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[1],
    },
    { id:3, img: 'assets/img/GALERIA/tu-imagen-3.png', title: 'Tulipán',  subtitle: 'Cabaña Familiar',     precio: '4,000',
      text : ['6 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[2],
    },
    { id:4, img: 'assets/img/GALERIA/tu-imagen-7.png', title: 'Cabaña Grande', subtitle: 'Cabaña Grupal',  precio: '6,000',
      text : ['10-12 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['2 Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[1],
    },
    { id:5, img: 'assets/img/GALERIA/tu-imagen-7.png', title: 'Cabaña Grande', subtitle: 'Cabaña Grupal',  precio: '6,000',
      text : ['10-12 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['2 Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[0],

    },
  ]);





scrollToForm() {
  const element = document.getElementById('form');
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth', // Hace que el movimiento sea fluido
      block: 'start'      // Alinea el inicio de la sección al tope de la pantalla
    });
  }
}

 }
