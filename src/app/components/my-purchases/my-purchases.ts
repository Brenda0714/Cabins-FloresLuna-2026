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

      return lista.filter(c => c.fecha_salida >= hoy && c.estado !== 'cancelada');
    } else {

      return lista.filter(c => c.fecha_salida < hoy || c.estado === 'cancelada');
    }
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

    if (usuarioLogueado && usuarioLogueado.id) {
      // 1. Primero cargamos lo que haya en la sesión local para que no se vea vacío mientras carga
      this.usuarioPerfil.set({
        id: usuarioLogueado.id,
        nombre: usuarioLogueado.nombre || '',
        email: usuarioLogueado.correo || usuarioLogueado.email || '',
        telefono: usuarioLogueado.telefono || ''
      });

      // 2. 🔥 El truco definitivo: Traemos los datos más frescos directamente de la Base de Datos
      this.http.get<any>(`${this.apiUrl}/perfil/${usuarioLogueado.id}`).subscribe({
        next: (data) => {
          if (data) {
            this.usuarioPerfil.set({
              id: usuarioLogueado.id,
              nombre: data.nombre_completo || '',
              email: data.email || usuarioLogueado.correo || usuarioLogueado.email || '',
              telefono: data.telefono || ''
            });
          }
        },
        error: (err) => {
          console.error('❌ Error al sincronizar el perfil con la base de datos:', err);
        }
      });
    } else {
      console.warn('⚠️ No se pudo cargar el perfil porque no hay un ID de usuario activo.');
    }
  }


  guardarPerfil(nombre: string, telefono: string, contrasenia: string, confirmarContrasenia: string): void {
    const usuarioLogueado = this.authService.getUsuarioActual();
    if (!usuarioLogueado || !usuarioLogueado.id) return;

    if (!nombre.trim() || !telefono.trim()) {
      this.MostrarAlerta('El nombre y el teléfono son campos obligatorios.');
      return;
    }

    const datosActualizados: any = { nombre, telefono };

    // Si el usuario intentó rellenar los campos de contraseña, los validamos
    if (contrasenia || confirmarContrasenia) {
      if (contrasenia !== confirmarContrasenia) {
        this.MostrarAlerta('Las contraseñas ingresadas no coinciden.');
        return;
      }
      if (contrasenia.length < 6) {
        this.MostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      datosActualizados.contrasenia = contrasenia;
    }

    // Petición PUT a tu servidor Express
    this.http.put(`${this.apiUrl}/perfil/${usuarioLogueado.id}`, datosActualizados).subscribe({
      next: (res: any) => {
        this.MostrarAlerta('¡Excelente! Tus datos de cuenta han sido actualizados con éxito.');

        // Actualizamos el Signal de forma reactiva localmente
        this.usuarioPerfil.update(perfil => ({
          ...perfil,
          nombre,
          telefono
        }));
      },
      error: (err) => {
        console.error('❌ Error al actualizar el perfil en el servidor:', err);
        this.MostrarAlerta('No se pudieron guardar los cambios en este momento.');
      }
    });
  }



  // 🔄 Cambiar de pestañas
  cambiarActualizacion(tipo: 'proximas' | 'pasadas' | 'perfil'): void {
    this.ActualizacionActual.set(tipo);
  }


  public showConfirmModal = false;
  public idReservaACancelar: number | null = null;
  public identificadorACancelar: string = '';

  // 🔄 MÉTODO: Cancelar una reservación activa cambiando su estado a 'cancelado'
  cancelarReserva(idReserva: number): void {
    const compraActual = this.compras().find(c => c.id === idReserva);
    this.identificadorACancelar = compraActual?.folio ? `Folio #${compraActual.folio}` : `#RES-${idReserva}`;

    // Guardamos temporalmente el ID y abrimos el modal
    this.idReservaACancelar = idReserva;
    this.showConfirmModal = true;
  }

  confirmarCancelacionExitosa(): void {
    if (!this.idReservaACancelar) return;

    const id = this.idReservaACancelar;
    const identificador = this.identificadorACancelar;

    // Cerramos el modal de confirmación inmediatamente
    this.showConfirmModal = false;

    // Mandamos la petición al backend
    this.http.put(`${this.apiUrl}/cancelar/${id}`, {}).subscribe({
      next: (res: any) => {
        // Mostramos tu alerta original naranja de éxito
        this.MostrarAlerta(`La reservación con ${identificador} ha sido cancelada con éxito.`);

        // Le damos un respiro para ver la alerta antes de moverla de pestaña
        setTimeout(() => {
          this.compras.update(lista =>
            lista.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c)
          );
          // Limpiamos variables de control
          this.idReservaACancelar = null;
        }, 600);
      },
      error: (err) => {
        console.error('❌ Error al cancelar la reservación en el servidor:', err);
        this.MostrarAlerta('No se pudo procesar la cancelación en este momento. Inténtalo más tarde.');
        this.idReservaACancelar = null;
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
