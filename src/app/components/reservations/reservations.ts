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

  enviarReservaReal() {
    // 1. Obtenemos los datos actuales que ya calculó y guardó tu formulario en el Signal
    const datosReserva = this.reservaData();

    // Guardilla de seguridad: Si no hay datos en el Signal, le avisamos al usuario
    if (!datosReserva) {
      alert('Por favor, completa correctamente todos los campos del formulario primero.');
      return;
    }

    // 2. Activamos el estado de carga mientras se procesa la petición en el servidor
    this.loading.set(true);
    console.log('Enviando datos reales al servidor...', datosReserva);

    // 3. Mapeo: Transformamos las propiedades de tu interfaz 'Reserva' al formato que espera tu index.js
    const payload = {
      nombre: datosReserva.cliente,
      email: datosReserva.correo,
      telefono: datosReserva.telefono,
      cabin_nombre: datosReserva.cabin,
      fecha_llegada: datosReserva.fechaLlegada,
      fecha_salida: datosReserva.fechaSalida,
      noches: datosReserva.noches,
      monto_total: datosReserva.montoTotal
    };



    // 4. Hacemos la petición POST real a tu Backend
    this.http.post('http://localhost:3000/api/reservas', payload)
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          console.log('🚀 ¡Servidor respondió con éxito!', response);

          // ✨ CONFIGURACIÓN DE MODAL DE ÉXITO
          this.alertTitle = '¡Reservación Exitosa! 🎉';
          this.alertMessage2 = `Tu estancia para la cabaña "${datosReserva.cabin}" ha sido reservada, checa tu bandeja de correo. Tambien puedes revisar tus reservaciones en el apartado de "Mis Compras"`;
          this.alertType = 'success'; // Cambia el ícono a verde
          this.showAlert2 = true;

          this.cdr.detectChanges();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.loading.set(false);
          console.error('❌ Error recibido del backend:', error);
          this.alertType = 'error';
          this.showAlert2 = true;

          // 🔐 Si el correo electrónico no está registrado en la tabla 'usuarios'
          if (error.status === 401 && error.error?.requireAuth) {
            this.alertTitle = 'Inicia Sesión';
            this.alertMessage2 = error.error.message;
          } else {
            // Si es un error de código 500 o base de datos caída
            this.alertTitle = 'Error en el Servidor ❌';
            this.alertMessage2 = 'Hubo un error al procesar tu reserva en el servidor.';
          }

          this.cdr.detectChanges();
          this.cdr.markForCheck();
        }
      });
  }


  // ==============================================================================================================================
  // 📋 PAYPAL PAYMENT
  // ==============================================================================================================================

  @ViewChild('paymentRef', { static: false }) set paymentRef(element: ElementRef | undefined) {

    if (isPlatformBrowser(this.platformId) && element && element.nativeElement) {
      if (this.paypalRendered) return;
      const paypalObj = (window as any).paypal;
      if (paypalObj) {
        // Limpiamos residuos por si hace múltiples clics
        element.nativeElement.innerHTML = '';

        // Renderizamos directamente porque aquí ya es 100% seguro que el DIV existe
        paypalObj.Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: this.reservaData()?.montoTotal?.toString() || '0.00'
                }
              }]
            });
          },
          onApprove: (data: any, actions: any) => {
            return actions.order.capture().then((details: any) => {
              alert('¡Pago completado con éxito por ' + details.payer.name.given_name + '!');
              console.log('Detalles del pago:', details);

              this.EnviarCorreo(this.reservaData(), details.id);
            });
          },
          onError: (err: any) => {
            console.error('Error en la pasarela de PayPal:', err);
          }
        }).render(element.nativeElement)
          .then(() => {
            console.log('¡Botones de PayPal dibujados con éxito en el resumen!');
          })
          .catch((err: any) => {
            console.error('Error al renderizar los botones:', err);
          });
      }
    }
  }

  viewportScroller: any;




  // ==============================================================================================================================
  // 📋 INICIAR PAGO
  // ==============================================================================================================================
  formatuearFechaParaInput(fecha: Date | undefined | null): string {
    if (!fecha) return '';
    const ano = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

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

    this.http.post('http://localhost:3000/api/reservas/verificar-disponibilidad', {
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
  // ==============================================================================================================================
  // 📋 ENVIAR CORREOS
  // ==============================================================================================================================

  EnviarCorreo(data: any, paypalOrderId: string = 'N/A') {
    if (!data) return;

    const payload = {
      nombre: data.cliente, // ✨ Mapeado de 'cliente' a 'nombre' según tu señal
      email: data.correo,
      telefono: data.telefono,
      cabin_nombre: data.cabin,
      fecha_llegada: data.fechaLlegada,
      fecha_salida: data.fechaSalida,
      noches: data.noches,
      monto_total: data.montoTotal,
      folio_pago: paypalOrderId // Se envía el ID de orden real de PayPal si existe
    };

    console.log('Despachando registro y correos hacia Node.js...', payload);

    // Reemplaza con la dirección exacta asignada a tu backend en HostGator
    this.http.post('http://localhost:3000/api/reservas/enviar-confirmacion', payload)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            alert('¡Tu reservación ha sido guardada en el sistema y los correos de confirmación fueron enviados!');
            this.cerrarModal();
          }
        },
        error: (err) => {
          console.error('Error al insertar la reservación:', err);
          alert('Hubo un inconveniente al conectarse con el servidor para guardar tu reserva.');
        }
      });
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
