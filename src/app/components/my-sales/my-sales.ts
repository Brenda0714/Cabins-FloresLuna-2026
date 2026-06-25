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
  private apiUrl = 'http://localhost/api/ventas-admin.php'; // Backend

  // 🚦 Signals Principales de Control
  public ventas = signal<any[]>([]);
  public filtroActual = signal<'todos' | 'confirmada' | 'pendiente' | 'cancelada'>('todos');

  // 🔘 Nuevo Signal para rastrear qué Dropdown está abierto en la vista (guarda el ID)
  public dropdownAbierto = signal<number | string | null>(null);

  // ⚡ Computed Signal: Filtrado en tiempo real
  public ventasFiltradas = computed(() => {
    const listaVentas = this.ventas();
    const filtro = this.filtroActual();

    if (filtro === 'todos') {
      return listaVentas;
    }
    return listaVentas.filter(v => v.estado === filtro);
  });

  // 📊 Computed Signals para las Tarjetas Métricas
  public totalIngresos = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'confirmada') // Suma solo las confirmadas
      .reduce((sum, v) => sum + Number(v.monto_total || 0), 0);
  });

  public totalPendientes = computed(() => {
    return this.ventas()
      .filter(v => v.estado_pago === 'pendiente')
      .length;
  });

  constructor() {
    // Escucha clicks globales en la ventana para cerrar el dropdown si el usuario hace click afuera
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

  /**
   * 🗺️ Abre o cierra el menú desplegable de una fila específica sin interferir con los eventos globales
   */
  toggleDropdown(ventaId: number | string, event: Event): void {
    event.stopPropagation(); // Evita que el evento 'click' suba a la ventana y lo cierre de golpe
    if (this.dropdownAbierto() === ventaId) {
      this.dropdownAbierto.set(null);
    } else {
      this.dropdownAbierto.set(ventaId);
    }
  }

  /**
   * ⏳ Calcula reactivamente en el cliente si la estancia ya pasó, está activa o es futura
   */
  obtenerEstadoTemporal(fechaLlegada: string | Date, fechaSalida: string | Date): string {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizamos horas para comparar solo días

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

  /**
   * 🔄 Carga los datos reales desde MySQL / Express
   */
  cargarVentas(): void {
this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        // Mapeamos los datos asegurando que lea 'estado' de la base de datos
        const datosMapeados = data.map(v => {
          // Tomamos 'v.estado' (de tu MySQL) o 'v.estado_pago' si viniera de otra petición
          const campoEstado = v.estado || v.estado_pago;
          const estadoLimpio = campoEstado ? campoEstado.toLowerCase() : 'pendiente';

          return {
            ...v,
            // Guardamos el estado homologado en 'estado_pago' que es el que usa tu HTML
            estado_pago: estadoLimpio === 'completado' ? 'confirmada' : estadoLimpio
          };
        });

        this.ventas.set(datosMapeados);
        console.log('Datos cargados y homologados:', datosMapeados); // Para verificar en consola
      },
      error: (err) => {
        console.error('❌ Error al cargar ventas del servidor:', err);
      }
    });
  }

  /**
   * 🧪 Manejador del Select de filtrado en el HTML
   */
  cambiarFiltro(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.filtroActual.set(elemento.value as any);
  }

  /**
   * 🎯 Ejecuta la acción directa elegida desde el nuevo Dropdown del HTML
   */
  cambiarEstadoDirecto(reservaId: number, evento: any): void {

    const elemento = evento.target as HTMLSelectElement;
    if (!elemento) return;



  const ventaActual = this.ventas().find(v => v.id === reservaId);
    if (!ventaActual) return;

    // 🛡️ CANDADO DE SEGURIDAD INTERNO
    if (this.obtenerEstadoTemporal(ventaActual.fecha_llegada, ventaActual.fecha_salida) === 'vencida') {
      console.warn(`⛔ No puedes modificar la reserva #${reservaId} porque su fecha ya venció.`);
      return; // Frena la ejecución y evita mandar la petición PUT al backend
    }

  const nuevoEstado = elemento.value as 'pendiente' | 'confirmada' | 'cancelada';

  if (ventaActual.estado_pago === nuevoEstado) {
      return;
    }

    // Ejecutamos tu lógica existente de persistencia en la Base de Datos
    this.actualizarEstadoPago(reservaId, nuevoEstado);
  }

  /**
   * 🛠️ Persiste el cambio de estado de manera limpia directamente en la Base de Datos
   */
  actualizarEstadoPago(reservaId: number, nuevoEstado: 'pendiente' | 'confirmada' | 'cancelada'): void {

    // 🎯 Enviamos SOLO el ID y el nuevo estado al Backend
    this.http.post(this.apiUrl, {
      reservaId,
      nuevoEstado
    }).subscribe({
      next: () => {
        // Actualizamos de forma reactiva el Signal modificando EXCLUSIVAMENTE el estado_pago
        this.ventas.update(lista =>
          lista.map(v => v.id === reservaId ? {
            ...v,
            estado_pago: nuevoEstado // 👈 Solo cambia esto, los folios y métodos no se tocan
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
