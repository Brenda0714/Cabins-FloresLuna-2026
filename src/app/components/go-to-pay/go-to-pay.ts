import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnInit, PLATFORM_ID, signal, ViewChild, Renderer2, OnDestroy } from '@angular/core';
import { ReservaTransferService } from '../../services/reserva-transfer.service';
import { Router, RouterModule } from '@angular/router';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-go-to-pay',
  imports: [DecimalPipe, RouterModule],
  templateUrl: './go-to-pay.html',
  styleUrl: './go-to-pay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoToPay implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private paypalRendered = false;
  private transferService = inject(ReservaTransferService);
  private router = inject(Router);
  private renderer = inject(Renderer2);


  showAlert2: boolean = false;
  alertMessage2 = '';
  alertTitle = '';
  alertType: 'success' | 'error' | 'warning' = 'warning';

  public data = signal<any>(null);

  apiUrl = 'http://localhost/api/hacer-pago.php';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const navbar = document.querySelector('app-navbar, .main-navbar'); // Asegúrate de apuntar a la etiqueta o clase de tu menú
      const footer = document.querySelector('app-footer, .main-footer'); // Asegúrate de apuntar a tu footer

      if (navbar) this.renderer.setStyle(navbar, 'display', 'none');
      if (footer) this.renderer.setStyle(footer, 'display', 'none');
    }

    // Leemos los datos que guardamos en la pantalla anterior
    const datosReserva = this.transferService.datosParaPagar();

    // Si el usuario entra a la ruta manualmente sin haber llenado el formulario, lo regresamos
    if (!datosReserva) {
      this.router.navigate(['/']);
      return;
    }

    this.data.set(datosReserva);


  }


  ngOnDestroy() {
    // 👀 Volvemos a mostrar el Navbar y Footer al salir de la pasarela de pago
    if (isPlatformBrowser(this.platformId)) {
      const navbar = document.querySelector('app-navbar, .main-navbar');
      const footer = document.querySelector('app-footer, .main-footer');

      if (navbar) this.renderer.removeStyle(navbar, 'display');
      if (footer) this.renderer.removeStyle(footer, 'display');
    }
  }

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

            const total = this.data()?.montoTotal;
            const montoFormateado = total ? Number(total).toFixed(2) : '0.00';

            console.log('Monto enviado a la ventana de PayPal:', montoFormateado);

            return actions.order.create({
              purchase_units: [{
                amount: {
                  currency_code: 'MXN',
                  value: montoFormateado
                }
              }]
            });
          },
          onApprove: (data: any, actions: any) => {
            return actions.order.capture().then((details: any) => {
              console.log('💰 Pago de PayPal aprobado con éxito:', details);

              const transaccionId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id;

              // Si por alguna razón no viene, usamos el ID de orden como respaldo
              const folioFinal = transaccionId || details.id;

              console.log('Folio Contable Seleccionado:', folioFinal);
              // Cuando el pago es exitoso, disparamos la inserción de la reserva real
              this.enviarReservaReal('confirmada', folioFinal);
            });
          },

          onError: (err: any) => {
            console.error('Error en la pasarela de PayPal:', err);
            this.alertTitle = 'Error de Pago ❌';
            this.alertMessage2 = 'La transacción con PayPal no pudo completarse.';
            this.alertType = 'error';
            this.showAlert2 = true;
            this.cdr.detectChanges();
          }
        }).render(element.nativeElement)
          .then(() => {
            this.paypalRendered = true;
            console.log('¡Botones de PayPal dibujados con éxito en el resumen!');
          })
          .catch((err: any) => {
            console.error('Error al renderizar los botones:', err);
          });
      }
    }

  }


  enviarReservaReal(estadoPago: 'pendiente' | 'confirmada' = 'pendiente', referenciaPago: string = 'N/A') {

    const datosReserva = this.data();


    // Guardilla de seguridad: Si no hay datos en el Signal, le avisamos al usuario
    if (!datosReserva) {
      alert('Por favor, completa correctamente todos los campos del formulario primero.');
      return;
    }

    // 2. Activamos el estado de carga mientras se procesa la petición en el servidor

    console.log('Enviando datos reales al servidor...', datosReserva);

    console.log(`Enviando datos reales al servidor con estado: ${estadoPago}...`, datosReserva);

    // 3. Mapeo: Transformamos las propiedades de tu interfaz 'Reserva' al formato que espera tu index.js
    const payload = {
      nombre: datosReserva.cliente,
      email: datosReserva.correo,
      telefono: datosReserva.telefono,
      cabin_nombre: datosReserva.cabin,
      fecha_llegada: datosReserva.fechaLlegada,
      fecha_salida: datosReserva.fechaSalida,
      noches: datosReserva.noches,
      monto_total: datosReserva.montoTotal,
      estado_pago: estadoPago,
      referencia_pago: referenciaPago
    };



    // 4. Hacemos la petición POST real a tu Backend
    this.http.post(this.apiUrl, payload)
      .subscribe({
        next: (response: any) => {

          console.log('🚀 ¡Servidor respondió con éxito!', response);

          this.alertTitle = estadoPago === 'confirmada' ? '¡Pago y Reservación Exitosa! 🎉' : '¡Reservación Registrada! 🎉';
          this.alertMessage2 = `Tu estancia para la cabaña "${datosReserva.cabin}" ha sido reservada, checa tu bandeja de correo. También puedes revisar tus reservaciones en el apartado de "Mis Compras".`;
          this.alertType = 'success'; // Cambia el ícono a verde
          this.showAlert2 = true;

          this.cdr.detectChanges();
        },
        error: (error) => {

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
        }
      });
  }


  manejarClickAlerta() {
    // 1. Cerramos la alerta sea cual sea el caso
    this.showAlert2 = false;

    // 2. Si todo salió bien, mandamos al usuario al Home de Flores de la Luna
    if (this.alertType === 'success') {
      this.router.navigate(['/']);
    } else {
      // Si fue un error o advertencia, no redirigimos para que puedan
      // volver a dar clic en el botón de PayPal e intentar el pago
      this.cdr.detectChanges();
    }
  }

}
