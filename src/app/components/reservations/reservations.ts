import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import * as AOS from 'aos';

interface Reserva {
  cliente: string;
  correo: string;
  telefono: string;
  fechaLlegada: string;
  fechaSalida: string;
  cabin:  string,
  noches:  string,
  precioUnitario:  string,
  montoTotal:  string
};


@Component({
  selector: 'app-reservations',
  imports: [DecimalPipe],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Reservations implements AfterViewInit{



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


  BackImg = signal<string[]>([
    'assets/img/RESERVACIONES/section1.png',
    'assets/img/RESERVACIONES/section2.png',
    'assets/img/RESERVACIONES/section3.png',
  ]);

  Cabins = signal([
    { id:1, img: 'assets/img/GALERIA/tu-imagen-5.jpg', title: 'Orquídea', subtitle: 'Cabaña para Parejas', precio: '3,500',
      text : ['2 Personas','1 Recámara', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[0],
    },
    { id:2, img: 'assets/img/GALERIA/tu-imagen-4.jpg', title: 'Girasol',  subtitle: 'Cabaña Familiar',     precio: '4,000',
      text : ['6 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[1],
    },
    { id:3, img: 'assets/img/GALERIA/tu-imagen-3.jpg', title: 'Tulipán',  subtitle: 'Cabaña Familiar',     precio: '4,000',
      text : ['6 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[2],
    },
    { id:4, img: 'assets/img/GALERIA/tu-imagen-7.jpg', title: 'Cabaña Grande', subtitle: 'Cabaña Grupal',  precio: '6,000',
      text : ['10-12 Personas','2 Recámaras', '1 Baño', 'Sala', 'Cocina'],
      amenities: ['2 Cama King Size','4 Camas Individuales','Smart TV', 'Internet', 'WIFI', 'Mirador'],
      fondo: this.BackImg()[1],
    },
    { id:5, img: 'assets/img/GALERIA/tu-imagen-7.jpg', title: 'Cabaña Grande', subtitle: 'Cabaña Grupal',  precio: '6,000',
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





loading = signal(false);
reservaData = signal<any>(null);

iniciarPago(nombre: string, email: string, tel: string, llegada: string, salida: string, cabin: string) {




    // 1. Validar que no haya campos vacíos
    if (!nombre || !email || !tel || !llegada || !salida || !cabin) {
      alert('Por favor, completa todos los campos.');
      return;
    }


  const infoCabana = this.Cabins().find(c => c.title === cabin);
  const precioNumerico = infoCabana ? infoCabana.precio.replace(',', '') : '0';


  const fechaIn = new Date(llegada);
  const fechaOut = new Date(salida);

  // Diferencia en milisegundos dividida por milisegundos en un día
  const diffTime = fechaOut.getTime() - fechaIn.getTime();
  const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (noches <= 0) {
    alert('La fecha de salida debe ser posterior a la de llegada.');
    return;
  }
  const precioPorNoche = infoCabana ? Number(infoCabana.precio.replace(',', '')) : 0;
  const totalPagar = precioPorNoche * noches;

    // 2. Creamos el objeto con la data
    this.reservaData.set({
      cliente: nombre,
      correo: email,
      telefono: tel,
      fechaLlegada: llegada,
      fechaSalida: salida,
      cabin: cabin,
      noches: noches,
      precioUnitario: precioPorNoche,
      montoTotal: totalPagar
    });

    // 3. Mostramos en consola para validar
    console.log('Datos de la reservación listos para procesar:', this.reservaData());

    // 4. Simulamos el proceso de pago
    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
      console.log('Simulación de pago finalizada');
      // Aquí podrías redirigir a Stripe, PayPal o tu backend
    }, 2000);
  }

 }
