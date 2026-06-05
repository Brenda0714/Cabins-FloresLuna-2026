import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-my-sales',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe], // 🌟 Añadidos Pipes para fechas y números en el HTML
  templateUrl: './my-sales.html',
  styleUrl: './my-sales.css',
})
export class MySales implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/pagos'; // Servidor Express

  // 🚦 Signals Principales de Control
  public ventas = signal<any[]>([]);
  public filtroActual = signal<'todos' | 'confirmada' | 'pendiente' | 'cancelada'>('todos');

  // ⚡ Computed Signal: Filtrado en tiempo real
  public ventasFiltradas = computed(() => {
    const listaVentas = this.ventas();
    const filtro = this.filtroActual();

    if (filtro === 'todos') {
      return listaVentas;
    }
    return listaVentas.filter(v => v.estado_pago === filtro);
  });

  // 📊 Computed Signals para las Tarjetas Métricas
  public totalIngresos = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'confirmada') // 💵 Corregido: Suma solo las confirmadas
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

  // 🔄 1. Carga los datos reales desde MySQL
cargarVentas(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        // Homologamos los datos que vengan como 'completado' desde PayPal a 'confirmada'
        const datosMapeados = data.map(v => {
          const estadoLimpio = v.estado_pago ? v.estado_pago.toLowerCase() : 'pendiente';
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

  // 🧪 Manejador del Select del HTML
cambiarFiltro(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.filtroActual.set(elemento.value as any);
  }

rotarEstadoPago(reservaId: number, estadoActual: string): void {
    let siguienteEstado: 'pendiente' | 'confirmada' | 'cancelada';
    const estadoLimpio = estadoActual ? estadoActual.toLowerCase() : 'pendiente';

    if (estadoLimpio === 'confirmada') {
      siguienteEstado = 'cancelada';
    } else if (estadoLimpio === 'cancelada') {
      siguienteEstado = 'pendiente';
    } else {
      siguienteEstado = 'confirmada'; // Por defecto si está pendiente o nulo
    }

    // Despacha la actualización real al backend
    this.actualizarEstadoPago(reservaId, siguienteEstado);
  }

  // 🛠️ 2. Persiste el cambio de estado directamente en la Base de Datos
actualizarEstadoPago(reservaId: number, nuevoEstado: 'pendiente' | 'confirmada' | 'cancelada'): void {
    // Generamos un folio rústico para Flores de la Luna únicamente al confirmarse el pago
    const nuevoFolio = nuevoEstado === 'confirmada' ? `FL-${Math.floor(10000 + Math.random() * 90000)}` : null;

    // Enviamos la actualización al Backend
    this.http.put(`${this.apiUrl}/actualizar-estado`, {
      reservaId,
      nuevoEstado,
      folio: nuevoFolio
    }).subscribe({
      next: () => {
        // Actualizamos la interfaz reactivamente manteniendo la consistencia de los 3 estados
        this.ventas.update(lista =>
          lista.map(v => v.id === reservaId ? {
            ...v,
            estado_pago: nuevoEstado,
            folio: nuevoFolio,
            metodo_pago: nuevoEstado === 'confirmada' ? 'Manual/Admin' : (nuevoEstado === 'pendiente' ? null : v.metodo_pago)
          } : v)
        );
        console.log(`✨ Estado de reserva #${reservaId} actualizado con éxito a: ${nuevoEstado}`);
      },
      error: (err) => {
        console.error('❌ Error al actualizar el estado de pago:', err);
      }
    });
  }
}
