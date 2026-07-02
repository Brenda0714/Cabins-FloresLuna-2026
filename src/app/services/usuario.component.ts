import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from './usuario'; // <-- Ruta corregida

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario.component.html'
})
export class UsuariosComponent implements OnInit {
  listaUsuarios: any[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Agregamos (: any) a los parámetros para que TypeScript esté feliz
    this.usuarioService.getUsuarios().subscribe({
      next: (data: any) => {
        this.listaUsuarios = data;
        console.log('Backend conectado!');
      },
      error: (err: any) => {
        console.error('Error al conectar Angular con el backend:', err);
      }
    });
  }
}
