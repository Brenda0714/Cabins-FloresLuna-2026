import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css'
})
export class MyPurchases implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  showAlert: boolean = false;
  showAlert2: boolean = false;
  alertMessage = '';
  alertMessage2 = '';
  alertTitle = '';
  alertType: 'success' | 'error' | 'warning' = 'warning';

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/mis-compras';

  // 🌟 Ruta base para el manejo del usuario (ajústala a tu backend si es diferente)
  private userApiUrl = 'http://localhost:3000/api/usuarios';

  public compras = signal<any[]>([]);

  // 👤 Expandido para soportar la pestaña de perfil
  public ActualizacionActual = signal<'proximas' | 'pasadas' | 'perfil'>('proximas');

  // 👤 Signal para almacenar y manejar los datos del perfil localmente
  public usuarioPerfil = signal<any>({ nombre: '', email: '', telefono: '' });

  public comprasFiltradas = computed(() => {
    const lista = this.compras();
    const pestaña = this.ActualizacionActual();
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (pestaña === 'proximas') {
      return lista.filter(c => c.fecha_salida >= hoy);
    } else if (pestaña === 'pasadas') {
      return lista.filter(c => c.fecha_salida < hoy);
    }
    return [];
  });

  ngOnInit(): void {
    this.obtenerHistorialUsuario();
    this.cargarDatosPerfil();
  }

  obtenerHistorialUsuario(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();

    if (usuarioLogueado && usuarioLogueado.id) {
      this.http.get<any[]>(`${this.apiUrl}/${usuarioLogueado.id}`).subscribe({
        next: (data) => {
          this.compras.set(data);
        },
        error: (err) => {
          console.error('❌ Error al recuperar las reservaciones de la BD:', err);
        }
      });
    } else {
      console.warn('⚠️ No se detectó un usuario logueado en el AuthService.');
    }
  }

  // 👤 Carga inicial de la información de la sesión en el formulario
  cargarDatosPerfil(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();
    if (usuarioLogueado) {
      this.usuarioPerfil.set({
        nombre: usuarioLogueado.nombre || '',
        email: usuarioLogueado.correo || usuarioLogueado.email || '',
        telefono: usuarioLogueado.telefono || ''
      });
    }
  }

  // 🔄 Cambiar de pestañas
  cambiarActualizacion(tipo: 'proximas' | 'pasadas' | 'perfil'): void {
    this.ActualizacionActual.set(tipo);
  }

  // 🔄 MÉTODO: Cancelar una reservación activa cambiando su estado a 'cancelado'
  cancelarReserva(idReserva: number): void {
    // 1. Buscamos la compra actual en el signal usando su ID para extraer el folio real
    const compraActual = this.compras().find(c => c.id === idReserva);

    // Si la compra tiene un folio (como FL-670676), lo guardamos; si no, usamos el ID de reserva
    const identificador = compraActual?.folio ? `Folio #${compraActual.folio}` : `#RES-${idReserva}`;

    // 2. Usamos una ventana de confirmación que SÍ detiene el código para validar la decisión del usuario
    const usuarioConfirmo = confirm(`¿Estás seguro de que deseas cancelar la reservación con ${identificador}? Esta acción liberará las fechas de la cabaña.`);

    // 3. SÓLO si el usuario da clic en "Aceptar", se manda la petición al Backend
    if (usuarioConfirmo) {

      // 🌟 Cambiado a .put() para conectar con tu app.put() del backend.
      // Se añade un objeto vacío {} como segundo parámetro porque los PUT requieren un "body"
      this.http.put(`${this.apiUrl}/cancelar/${idReserva}`, {}).subscribe({
        next: (res: any) => {

          // Mostramos tu alerta personalizada de éxito
          this.MostrarAlerta(`La reservación con ${identificador} ha sido cancelada con éxito.`);
          setTimeout(() => {
            this.compras.set(this.compras().filter(c => c.id !== idReserva));
          }, 1000);

          // Filtramos el signal para remover la cabaña cancelada de la pantalla de "Próximos Viajes"
          this.compras.set(this.compras().filter(c => c.id !== idReserva));
        },
        error: (err) => {
          console.error('❌ Error al cancelar la reservación en el servidor:', err);
          this.MostrarAlerta('No se pudo procesar la cancelación en este momento. Inténtalo más tarde.');
        }
      });
    }
  }

  // 💾 MÉTODO: Guardar cambios de actualización de datos
  guardarPerfil(nuevoNombre: string, nuevoTelefono: string): void {
    const usuarioLogueado = this.authService.getUsuarioActual();

    if (!usuarioLogueado || !usuarioLogueado.id) {
      alert('Error de sesión. Por favor vuelve a iniciar sesión.');
      return;
    }

    const body = { nombre: nuevoNombre, telefono: nuevoTelefono };

    this.http.put(`${this.userApiUrl}/actualizar/${usuarioLogueado.id}`, body).subscribe({
      next: (res: any) => {
        alert('¡Perfil actualizado con éxito!');

        // 1. Actualizamos el signal local
        this.usuarioPerfil.update(u => ({ ...u, nombre: nuevoNombre, telefono: nuevoTelefono }));

        // 2. IMPORTANTE: Actualiza también el objeto en tu AuthService si guarda datos en localStorage
        // usuarioLogueado.nombre = nuevoNombre;
        // usuarioLogueado.telefono = nuevoTelefono;
        // this.authService.actualizarSesionLocal(usuarioLogueado);
      },
      error: (err) => {
        console.error('❌ Error al actualizar el perfil:', err);
        alert('Hubo un error al guardar los cambios.');
      }
    });
  }

  // 🚨 MÉTODO: Dar de baja la cuenta del usuario de forma definitiva
  eliminarCuenta(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();
    if (!usuarioLogueado || !usuarioLogueado.id) return;

    const palabraClave = prompt('⚠️ ¡ADVERTENCIA CRÍTICA! Si eliminas tu cuenta, perderás todo tu historial de reservaciones. Escribe "ELIMINAR" para confirmar de forma permanente:');

    if (palabraClave === 'ELIMINAR') {
      this.http.delete(`${this.userApiUrl}/eliminar/${usuarioLogueado.id}`).subscribe({
        next: (res: any) => {
          alert('Tu cuenta ha sido eliminada correctamente. Esperamos verte pronto de vuelta.');

          // Aquí ejecutas el logout de tu AuthService para borrar tokens/localStorage y redirigir al login
          // this.authService.logout();
        },
        error: (err) => {
          console.error('❌ Error al eliminar la cuenta:', err);
          alert('Ocurrió un error al intentar eliminar la cuenta.');
        }
      });
    }
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

}
