import { Component, Input, OnInit, inject, model, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cabin-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabin-calendar.component.html'
})
export class CabinCalendarComponent implements OnInit {
  fechaInicioSel = model<Date | null>(null);
  fechaFinSel = model<Date | null>(null);
  private ApiUrl = "https://floresdelaluna.mx/api/fechas-ocupadas.php"
  readonly FECHA_ACTUAL_SISTEMA = new Date();
  @Input() cabinNombre!: string;
  private http = inject(HttpClient);

  currentDate = new Date();
  diasDelMes = signal<any[]>([]);
  fechasOcupadas = signal<{ inicio: Date, fin: Date }[]>([]);

  public refrescarDisponibilidad() {
    this.cargarFechasOcupadas();
  }

  ngOnInit() {
    this.cargarFechasOcupadas();
  }

  seleccionarDia(dia: any) {
    if (!dia.numero || !dia.disponible) return; // Si es un hueco o está ocupado, no hace nada

    const fechaClickeada = dia.fechaObj;
    if (!fechaClickeada) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaClickeada < hoy) {
      alert('No puedes seleccionar una fecha anterior al día de hoy.');
      return;
    }

    // Caso 1: No hay nada seleccionado, o ya había ambas y reiniciamos la selección
    if (!this.fechaInicioSel() || (this.fechaInicioSel() && this.fechaFinSel())) {
      this.fechaInicioSel.set(fechaClickeada);
      this.fechaFinSel.set(null);
    }
    // Caso 2: Ya hay fecha de inicio, vamos a poner la fecha de salida (Check-out)
    else if (this.fechaInicioSel() && !this.fechaFinSel()) {
      if (fechaClickeada <= this.fechaInicioSel()!) {
        // Si selecciona una fecha anterior a la de inicio, la volvemos la nueva fecha de inicio
        this.fechaInicioSel.set(fechaClickeada);
      } else {
        // Validar que no existan días ocupados intermediamente en el rango que quiere elegir
        if (this.contieneDiasOcupados(this.fechaInicioSel()!, fechaClickeada)) {
          alert('No puedes seleccionar un rango que incluya días ocupados en medio.');
          return;
        }
        this.fechaFinSel.set(fechaClickeada);

        // 🚀 TIP EXTRAS: Aquí ya tienes las dos fechas listas para enviarlas a tu formulario
        console.log("Llegada:", this.fechaInicioSel());
        console.log("Salida:", this.fechaFinSel());
      }
    }
  }

  contieneDiasOcupados(inicio: Date, fin: Date): boolean {
    let d = new Date(inicio);
    while (d < fin) {
      if (this.verificarSiEstaOcupado(d)) return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  }

  obtenerClaseEstadoDia(dia: any): string {
    if (!dia.numero) return '';
    if (dia.esPasado) {
      return 'bg-gray-100/70 border border-gray-200/50 text-gray-400 font-normal line-through cursor-not-allowed';
    }
    if (!dia.disponible) {
      return 'bg-red-100 border border-red-200 text-red-600 font-normal cursor-not-allowed';
    }

    const f = dia.fechaObj;
    const inicio = this.fechaInicioSel();
    const fin = this.fechaFinSel();

    // Helper para igualar las horas a cero absoluto y comparar manzanas con manzanas
    const formatearFecha = (date: Date | null) => {
      if (!date) return '';
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    const strFechaActual = formatearFecha(f);
    const strInicio = formatearFecha(inicio);
    const strFin = formatearFecha(fin);

    // Si es exactamente el día de inicio o fin seleccionado
    if ((inicio && strFechaActual === strInicio) || (fin && strFechaActual === strFin)) {
      return 'bg-orange-500 border border-orange-600 text-white font-bold scale-105 shadow-sm cursor-pointer transition-all';
    }

    // Si está en medio del rango seleccionado
    if (inicio && fin && f > inicio && f < fin) {
      return 'bg-orange-100 border-y border-orange-200 text-orange-700 cursor-pointer';
    }

    // Estado disponible por defecto (Verde)
    return 'bg-green-100 border border-green-200 text-green-700 hover:bg-orange-200 hover:text-orange-800 cursor-pointer transition-all';

  }

  cargarFechasOcupadas() {
    const url = `${this.ApiUrl}?cabin=${encodeURIComponent(this.cabinNombre)}`;
    this.http.get<any[]>(url)
      .subscribe({
        next: (reservas) => {


          const rangos = reservas.map(r => {
            // r.fecha_llegada viene como "2026-06-05T06:00:00.000Z" o "2026-06-05"
            // Cortamos los primeros 10 caracteres para asegurar el formato YYYY-MM-DD
            const strLlegada = r.fecha_llegada.substring(0, 10);
            const strSalida = r.fecha_salida.substring(0, 10);

            // Dividimos el string en [Año, Mes, Día] como números enteros
            const [anoIn, mesIn, diaIn] = strLlegada.split('-').map(Number);
            const [anoOut, mesOut, diaOut] = strSalida.split('-').map(Number);

            // Creamos el objeto Date usando constructor local (Nota: el mes en JS va de 0 a 11, por eso restamos 1)
            return {
              inicio: new Date(anoIn, mesIn - 1, diaIn, 0, 0, 0),
              fin: new Date(anoOut, mesOut - 1, diaOut, 0, 0, 0)
            };
          });



          this.fechasOcupadas.set(rangos);
          this.generarCalendario();
        },
        error: (err) => console.error('Error al cargar calendario:', err)
      });
  }

  generarCalendario() {
    const año = this.currentDate.getFullYear();
    const mes = this.currentDate.getMonth();

    const primerDiaMes = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();

    const dias = [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Rellenar días en blanco del mes anterior
    for (let i = 0; i < primerDiaMes; i++) {
      dias.push({ numero: null, disponible: true, fechaObj: null, esPasado: false });
    }

    // Generar los días del mes actual y validar disponibilidad
    for (let dia = 1; dia <= totalDias; dia++) {
      const fechaEvaluar = new Date(año, mes, dia, 0, 0, 0);
      const estaOcupado = this.verificarSiEstaOcupado(fechaEvaluar);

      const esFechaPasada = fechaEvaluar < hoy;

      dias.push({
        numero: dia,
        disponible: !estaOcupado && !esFechaPasada,
        fechaObj: fechaEvaluar,
        esPasado: esFechaPasada
      });
    }

    this.diasDelMes.set(dias);
  }

  verificarSiEstaOcupado(fecha: Date): boolean {
    // Compara si la fecha cae dentro de algún rango de reservación existente
    return this.fechasOcupadas().some(rango => {
      return fecha >= rango.inicio && fecha < rango.fin;
      // Nota: Usamos '< rango.fin' para que el día del Check-Out aparezca libre (verde) para el siguiente cliente
    });
  }

  cambiarMes(direccion: number) {
    if (direccion === -1 && this.esMesActual()) {
      return;
    }
    this.currentDate.setMonth(this.currentDate.getMonth() + direccion);
    this.generarCalendario();
  }

  obtenerNombreMes(): string {
    return this.currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  }

  esMesActual(): boolean {
    return this.currentDate.getFullYear() === this.FECHA_ACTUAL_SISTEMA.getFullYear() &&
      this.currentDate.getMonth() === this.FECHA_ACTUAL_SISTEMA.getMonth();
  }

}
