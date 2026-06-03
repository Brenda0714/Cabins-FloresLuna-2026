import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  private http = inject(HttpClient); // Inyección moderna sin usar constructor
  private apiUrl = 'http://localhost:3000/api/ventas-admin'; // Tu ruta de Node en HostGator

  // 🚦 1. Signal Principal: Almacena el arreglo crudo de reservas con sus pagos
  public ventas = signal<any[]>([]);

  // 🚦 2. Signal de Control: Almacena el filtro seleccionado por el administrador
  public filtroActual = signal<'todos' | 'aprobado' | 'pendiente'>('todos');

  // ⚡ 3. Computed Signal: Se actualiza sola mágicamente cuando cambie 'ventas' o 'filtroActual'
  public ventasFiltradas = computed(() => {
    const listaVentas = this.ventas();
    const filtro = this.filtroActual();

    if (filtro === 'todos') {
      return listaVentas;
    }

    // Filtra comparando directamente con la columna 'estado_pago' de tu tabla de pagos
    return listaVentas.filter(v => v.estado_pago === filtro);
  });

  // 📊 4. Computed Signals para las Métricas (Tarjetas de arriba)
  public totalIngresos = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'aprobado')
      .reduce((sum, v) => sum + Number(v.monto_total || 0), 0);
  });

  public totalPendientes = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'pendiente')
      .length;
  });

  ngOnInit(): void {
    this.cargarVentas();
  }

  // 🔄 Carga los datos combinados desde tu backend
  cargarVentas(): void {
    // Aquí simulamos los datos que traerá tu consulta SQL con INNER JOIN
    // En cuanto conectes tu backend, solo descomenta la línea de abajo:
    // this.http.get<any[]>(this.apiUrl).subscribe(data => this.ventas.set(data));

    const datosSimulados = [
      {
        id: 1, // id de la tabla 'reservas'
        usuario_id: 14,
        cabin_nombre: 'Cabaña Luna Rústica',
        fecha_llegada: '2026-06-10',
        fecha_salida: '2026-06-12',
        noches: 2,
        precio_unitario: 1500.00,
        monto_total: 3000.00,
        estado: 'confirmada',
        // Datos de la tabla 'pagos'
        reserva_id: 1,
        folio: 'FL-89324',
        monto: 3000.00,
        metodo_pago: 'PayPal',
        estado_pago: 'aprobado',
        referencia_pago: 'PAYPAL-ID-7732',
        fecha_pago: '2026-06-03'
      },
      {
        id: 2,
        usuario_id: 25,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        precio_unitario: 1800.00,
        monto_total: 5400.00,
        estado: 'pendiente',
        reserva_id: 2,
        folio: null,
        monto: null,
        metodo_pago: null,
        estado_pago: 'pendiente',
        referencia_pago: null,
        fecha_pago: null
      },
      {
        id: 3,
        usuario_id: 25,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        precio_unitario: 1800.00,
        monto_total: 5400.00,
        estado: 'pendiente',
        reserva_id: 2,
        folio: null,
        monto: null,
        metodo_pago: null,
        estado_pago: 'pendiente',
        referencia_pago: null,
        fecha_pago: null
      },
      {
        id: 4,
        usuario_id: 25,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        precio_unitario: 1800.00,
        monto_total: 5400.00,
        estado: 'pendiente',
        reserva_id: 2,
        folio: null,
        monto: null,
        metodo_pago: null,
        estado_pago: 'pendiente',
        referencia_pago: null,
        fecha_pago: null
      },
      {
        id: 5,
        usuario_id: 25,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        precio_unitario: 1800.00,
        monto_total: 5400.00,
        estado: 'pendiente',
        reserva_id: 2,
        folio: null,
        monto: null,
        metodo_pago: null,
        estado_pago: 'pendiente',
        referencia_pago: null,
        fecha_pago: null
      },
      {
        id: 6,
        usuario_id: 25,
        cabin_nombre: 'Suite Flores del Bosque',
        fecha_llegada: '2026-06-15',
        fecha_salida: '2026-06-18',
        noches: 3,
        precio_unitario: 1800.00,
        monto_total: 5400.00,
        estado: 'pendiente',
        reserva_id: 2,
        folio: null,
        monto: null,
        metodo_pago: null,
        estado_pago: 'pendiente',
        referencia_pago: null,
        fecha_pago: null
      }

    ];

    // Asignamos el valor a la Signal usando .set()
    this.ventas.set(datosSimulados);
  }

  // 🧪 Cambia el filtro (Se ejecuta al mover el select del HTML)
  cambiarFiltro(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.filtroActual.set(elemento.value as any);
  }

  // 🛠️ Cambiar estado de pago (Simulado para tus botones de editar)
  actualizarEstadoPago(reservaId: number, nuevoEstado: 'aprobado' | 'pendiente'): void {
    // Actualiza la Signal mapeando el valor cambiado (Angular redibuja todo al instante)
    this.ventas.update(lista =>
      lista.map(v => v.id === reservaId ? { ...v, estado_pago: nuevoEstado } : v)
    );
  }
}
