import { Component } from '@angular/core';
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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    // Definimos las reglas de validación para el Login
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      console.log('Validando credenciales en HostGator...', this.loginForm.value);

      this.http.post(this.apiUrl, this.loginForm.value).subscribe({
        next: (response: any) => {
          if(response.success){
            this.authService.login(response.user);
            alert('¡Bienvenido de nuevo!');
            // Aquí más adelante guardaremos el estado de sesión activo
            this.router.navigate(['/home']);
          }

        },
        error: (err: any) => {
          console.error('Error en login:', err);
          alert(err.error?.message || 'Correo o contraseña incorrectos.');
        }
      });
    } else {
      alert('Por favor, ingresa tus datos correctamente.');
    }
  }
}
