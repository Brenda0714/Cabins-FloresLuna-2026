import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  apiUrl = 'http://localhost:3000/api/usuarios'; // Tu ruta del backend para insertar

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    // Definimos el formulario con sus validaciones básicas
    this.registerForm = this.fb.group({
      nombre_completo: ['', [Validators.required, Validators.minLength(250)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // 10 dígitos
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      console.log('Enviando datos a HostGator...', this.registerForm.value);

      this.http.post(this.apiUrl, this.registerForm.value).subscribe({
        next: (response: any) => {
          alert('¡Registro exitoso! Ya puedes iniciar sesión.');
          this.router.navigate(['/login']); // Lo mandamos al login al terminar
        },
        error: (err: any) => {
          console.error('Error al registrar usuario:', err);
          alert('Hubo un error al registrar tu cuenta. Intenta de nuevo.');
        }
      });
    } else {
      alert('Por favor, llena todos los campos correctamente.');
    }
  }
}
