import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, Component, ElementRef, inject, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import * as AOS from 'aos';
import { Cancellations } from "../cancellations/cancellations";
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReservaTransferService } from '../../services/reserva-transfer.service'; // Ajusta la ruta
import { CabinCalendarComponent } from '../cabin-calendar/cabin-calendar.component';


@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [DecimalPipe, CabinCalendarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Reservations implements AfterViewInit {
  fechaInicioSel = signal<Date | null>(null);
  fechaFinSel = signal<Date | null>(null);
  private ApiUrl = "http://localhost/api/verificar-disponibilidad.php"

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private paypalRendered = false;
  showAlert: boolean = false;
  showAlert2: boolean = false;
  alertMessage = '';
  alertMessage2 = '';
  alertTitle = '';
  alertType: 'success' | 'error' | 'warning' = 'warning';

  BackImg = signal<string[]>([
    'assets/img/RESERVACIONES/section1.png',
    'assets/img/RESERVACIONES/section2.png',
    'assets/img/RESERVACIONES/section3.png',
  ]);

  Cabins = signal([
    {
      id: 1, img: 'assets/img/GALERIA/01_Orquidea_pareja.png', title: 'Orquídea', subtitle: 'Cabaña para Parejas (2 Personas)',
      precio: '2,900', precio2: '3,500',
      text: 'Cama matrimonial, Cajonera, Buró y Espejo',
      amenities: [
        'Baño completo',
        'WIFI',
        'Patio (Asador personal Weber, Toldo, mesa y sillas)',
        'Cocina (Parrilla,microondas,cafetera y refrigerador)',
        'Comedor (Mesa, Sillas y utensilios)',
        'Sala (Tv y Sillas Sillon)'
      ],
      fondo: this.BackImg()[0],
      fechaInicio: null as Date | null,
      fechaFin: null as Date | null
    },
    {
      id: 2, img: 'assets/img/GALERIA/02_Girasol_familiar.png', title: 'Girasol', subtitle: 'Cabaña Familiar (6 Personas)',
      precio: '3,500', precio2: '4,200',
      text: `Habitación 1: Cama matrimonial, Tv, Burós y Espejo.
             Habitación 2: Dos literas con colchón individual, Tv y Cajonera`,
      amenities: [
        'Baño completo',
        'WIFI',
        'Patio (Asador personal Weber, Toldo, mesa y sillas)',
        'Cocina (Parrilla,microondas,cafetera y refrigerador)',
        'Comedor (Mesa, Sillas y utensilios)',
        'Sala (Tv y Sillas Sillon)'
      ],
      fondo: this.BackImg()[1],
      fechaInicio: null as Date | null,
      fechaFin: null as Date | null
    },
    {
      id: 3, img: 'assets/img/GALERIA/03_Tulipan_familiar.png', title: 'Tulipán', subtitle: 'Cabaña Familiar (6 Personas)',
      precio: '3,500', precio2: '4,200',
      text: `Habitación 1: Cama matrimonial, Tv , Burós y Espejo.
             Habitación 2: Dos literas con colchón individual , Tv y Cajonera.`,
      amenities: [
        'Baño completo',
        'WIFI',
        'Patio (Asador personal Weber, Toldo, mesa y sillas)',
        'Cocina (Parrilla,microondas,cafetera y refrigerador)',
        'Comedor (Mesa, Sillas y utensilios)',
        'Sala (Tv y Sillas Sillon)'
      ],
      fondo: this.BackImg()[2],
      fechaInicio: null as Date | null,
      fechaFin: null as Date | null
    },
    {
      id: 4, img: 'assets/img/GALERIA/tu-imagen-7.jpg', title: 'Dalia House', subtitle: 'Cabaña Grupal (12 Personas)',
      precio: '6,000', precio2: '6,000',
      text: 'PROXIMAMENTE',
      amenities: [],
      fondo: this.BackImg()[1],
      fechaInicio: null as Date | null,
      fechaFin: null as Date | null
    },
    {
      id: 5, img: 'assets/img/GALERIA/tu-imagen-7.jpg', title: 'Magnolia House', subtitle: 'Cabaña Grupal (12 Personas)',
      precio: '6,000', precio2: '6,000',
      text: 'PROXIMAMENTE',
      amenities: [],
      fondo: this.BackImg()[0],
      fechaInicio: null as Date | null,
      fechaFin: null as Date | null
    },
  ]);

  constructor(private router: Router) { }
  // 🏠 Creamos la función para cerrar la alerta e ir al Home
  cerrarAlertaYIrAlHome(): void {
    this.showAlert2 = false;

    // Solo si la reservación y el pago fueron exitosos, lo mandamos al home
    if (this.alertType === 'success') {
      this.router.navigate(['/']);
      this.cdr.detectChanges();
    }
  }

  // CALENDARIO DE FORMA DINAMICA REFRESCAR
  @ViewChild(CabinCalendarComponent) calendarComponent!: CabinCalendarComponent;

  // Cuando ocurra un evento importante (ej. una reserva exitosa)
  onReservaExitosa() {
    this.calendarComponent.refrescarDisponibilidad();
  }

  // ==============================================================================================================================
  // 📋 INICIAR PAGO
  // ==============================================================================================================================
  loading = signal(false);
  reservaData = signal<any>(null);
  cabinSeleccionadaForm = signal<string>('');
  fechaInicioForm = signal<Date | null>(null);
  fechaFinForm = signal<Date | null>(null);
  formTouched = signal(false);
  private transferService = inject(ReservaTransferService);

  iniciarPago(nombre: string, email: string, tel: string, llegada: string, salida: string, cabin: string) {


    // 1. Activamos el estado de "intentó enviar" para que se muestren los outlines visuales
    this.formTouched.set(true);

    const usuarioSesionString = sessionStorage.getItem('usuario');

    if (!usuarioSesionString) {
      this.alertMessage = 'No has iniciado sesión. Por favor, ingresa a tu cuenta primero.';
      this.showAlert = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showAlert = false;
        this.cdr.detectChanges();
      }, 3000); // 3 segundos es mejor para alcanzar a leer el texto largo
      return;
    }

    if (!nombre || !email || !tel || !llegada || !salida || !cabin) {
      this.alertMessage = 'Por favor, completa todos los campos del formulario.';
      this.showAlert = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showAlert = false;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    // Si todo está bien, limpiamos el estado de error por si acaso
    this.formTouched.set(false);

    const usuarioSesion = JSON.parse(usuarioSesionString);
    if (email !== usuarioSesion.correo) {
      this.alertMessage = 'El correo ingresado no coincide con tu cuenta activa.';
      this.showAlert = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showAlert = false;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    const infoCabana = this.Cabins().find(c => c.title === cabin);
    const [anoIn, mesIn, diaIn] = llegada.split('-').map(Number);
    const [anoOut, mesOut, diaOut] = salida.split('-').map(Number);

    const fechaIn = new Date(anoIn, mesIn - 1, diaIn, 0, 0, 0);
    const fechaOut = new Date(anoOut, mesOut - 1, diaOut, 0, 0, 0);


    let totalPagar = 0;
    let nochesCalculadas = 0;

    if (fechaOut <= fechaIn) {
      this.alertMessage = 'La fecha de salida debe ser posterior a la de llegada.';
      this.showAlert = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showAlert = false;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    // 🌟 ====================================================================
    // 🚀 NUEVO ALGORITMO: CÁLCULO DIFERENCIADO POR DÍAS DE LA SEMANA
    // ====================================================================


    if (infoCabana) {
      // Convertimos los precios quitando las comas de los strings
      const precioSemana = Number(infoCabana.precio.replace(/,/g, ''));    // Lun a Jue
      const precioFinSemana = Number(infoCabana.precio2.replace(/,/g, '')); // Vie a Dom

      // Creamos un objeto auxiliar para recorrer el rango noche por noche
      let fechaAux = new Date(fechaIn);

      while (fechaAux < fechaOut) {
        const diaSemana = fechaAux.getDay(); // 0 = Domingo, 1 = Lunes, ..., 5 = Viernes, 6 = Sábado

        // Si la noche es Viernes (5), Sábado (6) o Domingo (0)
        if (diaSemana === 5 || diaSemana === 6 || diaSemana === 0) {
          totalPagar += precioFinSemana;
        } else {
          // Si es Lunes (1), Martes (2), Miércoles (3) o Jueves (4)
          totalPagar += precioSemana;
        }

        nochesCalculadas++;
        fechaAux.setDate(fechaAux.getDate() + 1); // Avanzar al siguiente día
      }
    }

    // Calculamos un promedio del precio unitario para mantener la consistencia en el servicio
    const precioPorNochePromedio = nochesCalculadas > 0 ? totalPagar / nochesCalculadas : 0;
    // ====================================================================


    this.loading.set(true);

    this.http.post(this.ApiUrl, {
      cabin_nombre: cabin,
      fecha_llegada: llegada,
      fecha_salida: salida
    }).subscribe({
      next: (respuesta: any) => {
        this.loading.set(false);

        // Evalúa la condición que responde el Backend
        if (!respuesta.disponible) {
          this.MostrarAlerta(`Lo sentimos, la cabaña ${cabin} ya se encuentra reservada en las fechas seleccionadas.`);
          return;
        }
        // 2. información en el servicio compartido
        this.transferService.datosParaPagar.set({
          cliente: nombre,
          correo: email,
          telefono: tel,
          fechaLlegada: llegada,
          fechaSalida: salida,
          cabin: cabin,
          noches: nochesCalculadas,
          precioUnitario: precioPorNochePromedio,
          montoTotal: totalPagar
        });

        this.router.navigate(['/go-to-pay']);

        // 3. Mostramos en consola para validar
        console.log('Datos de la reservación listos para procesar:', this.reservaData());
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Error al verificar disponibilidad:', error);
        this.MostrarAlerta('Hubo un problema al verificar la disponibilidad. Intenta más tarde.');

      }
    });
  }

  formatuearFechaParaInput(fecha: Date | undefined | null): string {
    if (!fecha) return '';
    const ano = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  MostrarAlerta(mensaje: string) {
    this.alertMessage = mensaje;
    this.showAlert = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.showAlert = false;
      this.cdr.detectChanges();
    }, 3000);
    return;
  }

  // >>> AGREGA ESTA NUEVA FUNCIÓN <<<
  cerrarModal() {
    this.reservaData.set(null); // Esto cierra el @if del modal automáticamente
    this.paypalRendered = false; // Reseteamos la bandera de PayPal
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {

      // animaciones AOS
      AOS.init({
        duration: 1000,
        once: true,
        mirror: false,
        offset: 120,
      });

    }
  }

  scrollToForm(cabin: any) {
    this.cabinSeleccionadaForm.set(cabin.title);
    this.fechaInicioForm.set(cabin.fechaInicio);
    this.fechaFinForm.set(cabin.fechaFin);

    const element = document.getElementById('formulario');
    if (element) {
      // Calcula la posición exacta en píxeles del formulario en el documento
      const yOffset = element.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: yOffset,
        behavior: 'smooth' // Desplazamiento fluido y limpio
      });
    }
  }

}
