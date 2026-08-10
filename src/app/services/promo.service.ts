import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface PromoInfo {
  promocion_activa: boolean;
  nombre: string | null;
  descuento: number;
}

@Injectable({ providedIn: 'root' })
export class PromoService {
  private http = inject(HttpClient);
  private apiUrl = 'https://floresdelaluna.mx/api/promociones.php';

  // Estado reactivo global
  promoState = signal<PromoInfo>({ promocion_activa: false, nombre: null, descuento: 0 });

  constructor() {
    this.cargarPromocion();
  }

  cargarPromocion() {
    this.http.get<PromoInfo>(this.apiUrl).subscribe({
      next: (res) => this.promoState.set(res),
      error: (err) => console.error('Error al cargar la promoción:', err)
    });
  }

  // Calcula el precio aplicando el descuento
  calcularPrecio(precioBase: number): { precioFinal: number; precioOriginal: number; tieneDescuento: boolean } {
    const promo = this.promoState();
    if (promo.promocion_activa && promo.descuento > 0) {
      const descuentoMonto = precioBase * (promo.descuento / 100);
      const precioFinal = Math.round(precioBase - descuentoMonto);
      return { precioFinal, precioOriginal: precioBase, tieneDescuento: true };
    }
    return { precioFinal: precioBase, precioOriginal: precioBase, tieneDescuento: false };
  }
}
