import { Component, OnInit, signal, computed, inject } from '@angular/core';
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

export class MyPurchases implements OnInit{
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/mis-compras'

  public compras = signal<any[]>([]);
  public ActualizacionActual = signal<'proximas' | 'pasadas'>('proximas');

  public comprasFiltradas = computed(() => {
    const lista = this.compras();
    const pestaña = this.ActualizacionActual();
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (pestaña === 'proximas') {
      return lista.filter(c => c.fecha_salida >= hoy);
    } else {
      return lista.filter(c => c.fecha_salida < hoy);
    }
  });

  ngOnInit(): void {
    this.obtenerHistorialUsuario();
  }

  obtenerHistorialUsuario(): void {
    const usuarioLogueado = this.authService.getUsuarioActual();

    if (usuarioLogueado && usuarioLogueado.id) {
      this.http.get<any[]>(`${this.apiUrl}/${usuarioLogueado.id}`).subscribe({
        next: (data) => {
          this.compras.set(data); // Reemplaza los datos con lo que viene de MySQL
        },
        error: (err) => {
          console.error('❌ Error al recuperar las reservaciones de la BD:', err);
        }
      });
    } else {
      console.warn('⚠️ No se detectó un usuario logueado en el AuthService.');
    }
    }


  cambiarActualizacion(tipo: 'proximas' | 'pasadas'): void {
    this.ActualizacionActual.set(tipo);
  }

}
