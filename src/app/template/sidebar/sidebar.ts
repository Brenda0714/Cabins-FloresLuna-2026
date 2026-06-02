import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  onClose() {
setTimeout(() => {
    this.close.emit();
    this.cdr.markForCheck();
  }, 10);
  }

  // Esto fuerza a Angular a reaccionar si el Input cambia desde afuera
  ngOnChanges() {
  this.cdr.markForCheck();
  }

  isLoggedIn: boolean = false;
  nombreUsuario: string = '';

  ngOnInit() {
  this.verificarSesion();
}

  // Revisa si hay una sesión activa guardada localmente
verificarSesion() {
  const userJson = localStorage.getItem('usuario'); // O como llames a tu objeto de sesión
  if (userJson) {
    const user = JSON.parse(userJson);
    this.isLoggedIn = true;
    this.nombreUsuario = user.nombre_completo || 'Huésped';
  } else {
    this.isLoggedIn = false;
  }
}

// Extrae la inicial del nombre para pintarla en el círculo estético móvil
obtenerIniciales(): string {
  return this.nombreUsuario ? this.nombreUsuario.charAt(0).toUpperCase() : 'U';
}

// Borra los datos, cierra el menú lateral y te redirige a home
logout() {
  localStorage.removeItem('usuario');
  this.isLoggedIn = false;
  this.onClose();
  // Aquí puedes usar tu router para mandarlo a /home si lo deseas
}


}
