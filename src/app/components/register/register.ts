import { Component, ChangeDetectorRef } from '@angular/core'; // 👈 Importamos ChangeDetectorRef para el modal
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true, // Asegura compatibilidad Standalone
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm: FormGroup;
  // 🔗 Apuntamos a la nueva ruta /register que agregamos en el index.js de Node
  apiUrl = 'http://localhost:3000/api/usuarios/register';

  // 🔔 Variables reactivas para el Modal Moderno con @if
  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'error';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef // 👈 Inyectamos el despertador de Angular
  ) {
    // Definimos el formulario con sus validaciones correctas
    this.registerForm = this.fb.group({
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]], // 👈 Ajustado de 250 a 3 letras mínimo
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // 10 dígitos numéricos
      contrasena: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // 🪄 Función que activa la animación y muestra el Modal flotante
  triggerAlert(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    this.cdr.detectChanges(); // 🌟 Fuerza a Angular a pintar el modal de inmediato

    // Se oculta solito a los 4 segundos
    setTimeout(() => {
      this.showAlert = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      console.log('Enviando datos a HostGator...', this.registerForm.value);

      this.http.post(this.apiUrl, this.registerForm.value).subscribe({
        next: (response: any) => {
          // 🌟 Levantamos el modal de éxito con el mensaje que devuelve el backend
          this.triggerAlert(response.message || '¡Registro exitoso! Ya puedes iniciar sesión.', 'success');

          // Esperamos 2 segundos para que alcancen a leer el modal de éxito antes de moverlos de pantalla
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: any) => {
          console.error('Error al registrar usuario:', err);
          // 🌟 Capturamos si el backend dice que el correo ya existe
          const errMsg = err.error?.message || 'Hubo un error al registrar tu cuenta. Intenta de nuevo.';
          this.triggerAlert(errMsg, 'error');
        }
      });
    } else {
      // 🌟 Modal de advertencia local si intentan saltarse las reglas del formulario
      this.triggerAlert('Por favor, llena todos los campos correctamente.', 'error');
    }
  }
}
