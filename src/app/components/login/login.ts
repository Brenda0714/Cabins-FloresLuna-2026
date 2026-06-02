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
  apiUrl = 'http://localhost:3000/api/usuarios'; // Ruta para validar en HostGator

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
    }, 5000);
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
          }, 5000);
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

}
