import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  private apiUrl = 'https://floresdelaluna.mx/api/login.php'; // Ruta para validar en HostGator

  // 🔔 Variables para nuestra alerta bonita con Tailwind
  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Definimos las reglas de validación para el Login
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // 🪄 Función auxiliar para disparar la alerta flotante
  triggerAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    this.cdr.detectChanges();
    // Se esconde automáticamente después de 4 segundos
    setTimeout(() => {
      this.showAlert = false;
      this.cdr.detectChanges();
    }, 2000);
  }


  onLogin(): void {


    if (this.loginForm.valid) {

      this.http.post(this.apiUrl, this.loginForm.value).subscribe({
        next: (response: any) => {

          if (response.success) {

            this.authService.login(response.user);

            this.triggerAlert(`¡Bienvenido de nuevo, ${response.user.nombre_completo.split(' ')[0]}!`, 'success');

            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 2000);
          } else {

            this.triggerAlert('Error al iniciar sesión.', 'error');
          }
        },
        error: (err: any) => {

          const errMsg = err.error?.message || 'El correo electrónico o la contraseña son incorrectos.';
          this.triggerAlert(errMsg, 'error');
        }
      });
    } else {

      this.triggerAlert('Por favor, ingresa tus datos correctamente.', 'error');
    }
  }
// Variables del modal
  mostrarModalPassword = false;
  usuarioRecuperacion = '';
  nuevaPassword = '';
  mostrarPasswordInput = false;
abrirModalPassword() {
    this.mostrarModalPassword = true;
  }

  cerrarModalPassword() {
    this.mostrarModalPassword = false;
    this.usuarioRecuperacion = '';
    this.nuevaPassword = '';
    this.mostrarPasswordInput = false;
  }

  toggleMostrarPassword() {
    this.mostrarPasswordInput = !this.mostrarPasswordInput;
  }

actualizarPasswordDirecto(usuario: string, nuevaPassword: string) {
  if (!usuario || !nuevaPassword) {
      this.triggerAlert('Por favor, completa todos los campos del formulario.', 'error');
      return;
  }

  this.authService.actualizarPassword(usuario, nuevaPassword).subscribe({
    next: (res: any) => {
        // Cierra el modal primero para que la alerta flotante sea bien visible
        this.cerrarModalPassword();

        // Muestra el mensaje de éxito usando tu alerta bonita
        const mensajeExito = res.message || 'Contraseña actualizada exitosamente.';
        this.triggerAlert(mensajeExito, 'success');
            setTimeout(() => {

            }, 2000);
    },
    error: (err: any) => {
      console.error('Detalle del error HTTP:', err);
// Extrae el mensaje dinámico según el tipo de respuesta
      const mensajeError =
        err.error?.message ||
        (typeof err.error === 'string' ? err.error : null) ||
        'Error al conectar con el servidor o actualizar la contraseña.';
        this.triggerAlert(mensajeError, 'error');
            setTimeout(() => {

            }, 2000);
    }
  });
}

}
