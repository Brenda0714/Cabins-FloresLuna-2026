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
  private apiUrl = 'https://floresdelaluna.mx/api/mis-compras.php';
  private perfilUrl = 'https://floresdelaluna.mx/api/perfil.php';
  private cancelarUrl = 'https://floresdelaluna.mx/api/cancelar-reserva.php';
  private eliminarUrl = 'https://floresdelaluna.mx/api/eliminar-cuenta.php';

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
      this.http.get<any[]>(`${this.apiUrl}?usuarioId=${usuarioLogueado.id}`).subscribe({
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
      this.http.get<any>(`${this.perfilUrl}?usuarioId=${usuarioLogueado.id}`).subscribe({
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

    const datosActualizados: any = {
      id: usuarioLogueado.id,
      nombre,
      telefono
    };

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
    this.http.post(this.perfilUrl, datosActualizados).subscribe({
      next: (res: any) => {
        this.MostrarAlerta('¡Excelente! Tus datos han sido actualizados.');
        this.usuarioPerfil.update(p => ({ ...p, nombre, telefono }));
      },
      error: (err) => this.MostrarAlerta('No se pudieron guardar los cambios.')
    })

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
    // 🟢 Usamos POST enviando el ID en el cuerpo
    this.http.post(this.cancelarUrl, { id }).subscribe({
      next: () => {
        this.MostrarAlerta('La reservación ha sido cancelada.');
        this.compras.update(lista =>
          lista.map(c => c.id === id ? { ...c, estado: 'cancelada' } : c)
        );
        this.idReservaACancelar = null;
      },
      error: () => this.MostrarAlerta('Error al procesar cancelación.')
    });
  }



  // 🚨 MÉTODO: Dar de baja la cuenta del usuario de forma definitiva
eliminarCuenta(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();
    if (!usuarioLogueado || !usuarioLogueado.id) return;

    if (prompt('Escribe "ELIMINAR" para confirmar:') === 'ELIMINAR') {
      // 🟢 Usamos POST para eliminar
      this.http.post(this.eliminarUrl, { id: usuarioLogueado.id }).subscribe({
        next: () => {
          alert('Cuenta eliminada.');
          this.authService.logout(); // Asumiendo que tienes este método
        },
        error: () => alert('Error al eliminar cuenta.')
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
