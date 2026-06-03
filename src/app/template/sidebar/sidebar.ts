import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ChangeDetectorRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  isLoggedIn: boolean = false;
  nombreUsuario: string = '';

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.verificarSesion();
  }

  // Detecta cuando el Navbar abre o cierra el menú desde afuera
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.verificarSesion();
    }
    this.cdr.markForCheck(); // Obligatorio por el uso de OnPush
  }

  // 🔄 Esta función le da soporte reactivo en tiempo real a tu @if del HTML
  verificarEstadoActual(): boolean {
    const userJson = sessionStorage.getItem('usuario'); // 🔐 Cambiado a sessionStorage

    if (userJson) {
      const user = JSON.parse(userJson);
      this.isLoggedIn = true;
      this.nombreUsuario = user.nombre_completo || 'Huésped';
      return true;
    } else {
      this.isLoggedIn = false;
      this.nombreUsuario = '';
      return false;
    }
  }
  get userRol(): string {
    const user = this.authService.getUsuarioActual();
    if (user) {
      // Si en tu backend mandas 'rol' o 'role', asegúrate de escribirlo igual aquí
      const rolOriginal = user.rol || user.role;
      if (rolOriginal) {
        return rolOriginal.toString().trim().toLowerCase();
      }
      return rolOriginal ? rolOriginal.toLowerCase() : 'cliente';
    }
    return 'cliente';
  }
  verificarSesion() {
    this.verificarEstadoActual();
    this.cdr.markForCheck(); // Le avisa a OnPush que redibuje el menú
  }

  obtenerIniciales(): string {
    return this.nombreUsuario ? this.nombreUsuario.trim().charAt(0).toUpperCase() : 'U';
  }

  onClose() {
    setTimeout(() => {
      this.close.emit();
      this.cdr.markForCheck();
    }, 10);
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.nombreUsuario = '';
    this.onClose();
    this.cdr.markForCheck();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }
}
