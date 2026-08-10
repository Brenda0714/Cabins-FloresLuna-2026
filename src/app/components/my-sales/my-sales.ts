import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'https://floresdelaluna.mx/api/ventas-admin.php';

  public ventas = signal<any[]>([]);
  public filtroActual = signal<'todos' | 'confirmada' | 'pendiente' | 'cancelada'>('todos');
  public dropdownAbierto = signal<number | string | null>(null);

  // ⚡ Computed Signal: Corregido a v.estado_pago
  public ventasFiltradas = computed(() => {
    const listaVentas = this.ventas();
    const filtro = this.filtroActual();

    if (filtro === 'todos') {
      return listaVentas;
    }
    return listaVentas.filter(v => v.estado_pago === filtro);
  });

  public totalIngresos = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'confirmada')
      .reduce((sum, v) => sum + Number(v.monto_total || 0), 0);
  });

  public totalPendientes = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'pendiente')
      .length;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => {
        if (this.dropdownAbierto()) {
          this.dropdownAbierto.set(null);
        }
      });
    }
  }

  ngOnInit(): void {
    this.cargarVentas();
  }

  toggleDropdown(ventaId: number | string, event: Event): void {
    event.stopPropagation();
    if (this.dropdownAbierto() === ventaId) {
      this.dropdownAbierto.set(null);
    } else {
      this.dropdownAbierto.set(ventaId);
    }
  }

  obtenerEstadoTemporal(fechaLlegada: string | Date, fechaSalida: string | Date): string {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const llegada = new Date(fechaLlegada);
    llegada.setHours(0, 0, 0, 0);

    const salida = new Date(fechaSalida);
    salida.setHours(0, 0, 0, 0);

    if (hoy > salida) {
      return 'vencida';
    } else if (hoy >= llegada && hoy <= salida) {
      return 'En Curso';
    } else {
      return 'Próxima';
    }
  }

  cargarVentas(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const datosMapeados = data.map(v => {
          const campoEstado = v.estado || v.estado_pago;
          const estadoLimpio = campoEstado ? campoEstado.toLowerCase() : 'pendiente';

          return {
            ...v,
            estado_pago: estadoLimpio === 'completado' ? 'confirmada' : estadoLimpio
          };
        });

        this.ventas.set(datosMapeados);
      },
      error: (err) => {
        console.error('❌ Error al cargar ventas del servidor:', err);
      }
    });
  }

  cambiarFiltro(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.filtroActual.set(elemento.value as any);
  }

  cambiarEstadoDirecto(reservaId: number, evento: any): void {
    const elemento = evento.target as HTMLSelectElement;
    if (!elemento) return;

    const ventaActual = this.ventas().find(v => (v.reserva_id || v.id) === reservaId);
    if (!ventaActual) return;

    if (this.obtenerEstadoTemporal(ventaActual.fecha_llegada, ventaActual.fecha_salida) === 'vencida') {
      return;
    }

    const nuevoEstado = elemento.value as 'pendiente' | 'confirmada' | 'cancelada';
    if (ventaActual.estado_pago === nuevoEstado) return;

    this.actualizarEstadoPago(reservaId, nuevoEstado);
  }

  actualizarEstadoPago(reservaId: number, nuevoEstado: 'pendiente' | 'confirmada' | 'cancelada'): void {
    this.http.post(this.apiUrl, {
      reservaId,
      nuevoEstado
    }).subscribe({
      next: () => {
        this.ventas.update(lista =>
          lista.map(v => (v.reserva_id || v.id) === reservaId ? {
            ...v,
            estado_pago: nuevoEstado
          } : v)
        );
      },
      error: (err) => {
        console.error('❌ Error al actualizar el estado de pago:', err);
      }
    });
  }

  actualizarMonto1(venta: any, evento: Event): void {
    if (venta.metodo_pago?.toLowerCase() !== 'transferencia') return;

    const input = evento.target as HTMLInputElement;
    const valor = input.value.trim();
    venta.monto1 = valor !== '' ? parseFloat(valor) : null;
    this.guardarMontos(venta);
  }

  actualizarMonto2(venta: any, evento: Event): void {
    if (venta.metodo_pago?.toLowerCase() !== 'transferencia') return;

    const input = evento.target as HTMLInputElement;
    const valor = input.value.trim();
    venta.monto2 = valor !== '' ? parseFloat(valor) : null;
    this.guardarMontos(venta);
  }

  guardarMontos(venta: any): void {
    const idReserva = venta.reserva_id || venta.id;

    const body = {
      reservaId: idReserva,
      monto1: venta.monto1 !== null && venta.monto1 !== undefined ? Number(venta.monto1) : null,
      monto2: venta.monto2 !== null && venta.monto2 !== undefined ? Number(venta.monto2) : null
    };

    this.http.post<any>(this.apiUrl, body).subscribe({
      next: (res) => {
        this.ventas.update(lista =>
          lista.map(v => {
            if ((v.reserva_id || v.id) === idReserva) {
              return {
                ...v,
                estado_pago: res.nuevoEstado,
                fecha_pago1: res.fecha_pago1,
                fecha_pago2: res.fecha_pago2
              };
            }
            return v;
          })
        );
      },
      error: (err) => {
        console.error('❌ Error al guardar en la base de datos:', err);
      }
    });
  }
}
