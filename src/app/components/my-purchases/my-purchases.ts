import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service'; // Ajusta la ruta a tu servicio

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css'
})
export class MyPurchases implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/mis-compras'; // Tu endpoint de Node.js

  // 🚦 Signal con el historial completo del usuario logueado
  public compras = signal<any[]>([]);

  // 🚦 Signal para segmentar entre viajes planeados y pasados
  public ActualizacionActual = signal<'proximas' | 'pasadas'>('proximas');

  // ⚡ Computed Signal: Divide automáticamente las estancias por fecha actual
  public comprasFiltradas = computed(() => {
    const lista = this.compras();
    const pestaña = this.ActualizacionActual();
    const hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

    if (pestaña === 'proximas') {
      // Reservas activas, aprobadas o pendientes que aún no terminan
      return lista.filter(c => c.fecha_salida >= hoy);
    } else {
      // Historial de visitas viejas
      return lista.filter(c => c.fecha_salida < hoy);
    }
  });

  ngOnInit(): void {
    this.obtenerHistorialUsuario();
  }

  obtenerHistorialUsuario(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();

    if (usuarioLogueado && usuarioLogueado.id) {
      // Cuando conectes el backend, le mandas el id del usuario de la sesión:
      // this.http.get<any[]>(`${this.apiUrl}/${usuarioLogueado.id}`).subscribe(data => this.compras.set(data));
    }

    // Datos simulados idénticos a la estructura de tus tablas SQL para desarrollo
    const datosSimulados = [
      {
        id: 101, // id de la tabla 'reservas'
        cabin_nombre: 'Cabaña Luna Rústica',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        monto_total: 4500.00,
        estado: 'confirmada',
        folio: 'FL-99231', // tabla 'pagos'
        metodo_pago: 'PayPal',
        estado_pago: 'aprobado'
      },
      {
        id: 102,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-07-02',
        fecha_salida: '2026-07-04',
        noches: 2,
        monto_total: 3600.00,
        estado: 'pendiente',
        folio: null,
        metodo_pago: null,
        estado_pago: 'pendiente'
      },
      {
        id: 103,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-07-02',
        fecha_salida: '2026-07-04',
        noches: 2,
        monto_total: 3600.00,
        estado: 'pendiente',
        folio: null,
        metodo_pago: null,
        estado_pago: 'pendiente'
      },
      {
        id: 104,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-07-02',
        fecha_salida: '2026-07-04',
        noches: 2,
        monto_total: 3600.00,
        estado: 'pendiente',
        folio: null,
        metodo_pago: null,
        estado_pago: 'pendiente'
      },
      {
        id: 105,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-07-02',
        fecha_salida: '2026-07-04',
        noches: 2,
        monto_total: 3600.00,
        estado: 'pendiente',
        folio: null,
        metodo_pago: null,
        estado_pago: 'pendiente'
      },
    ];

    this.compras.set(datosSimulados);
  }

  cambiarActualizacion(tipo: 'proximas' | 'pasadas'): void {
    this.ActualizacionActual.set(tipo);
  }
}
