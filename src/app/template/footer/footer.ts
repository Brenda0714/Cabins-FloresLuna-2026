import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {

  enviarWhatsAppInfo() {
  const urlBase = 'https://wa.me/message/EHTO5WIU5EMVI1';
  const mensaje = 'Hola, quiero saber mas información';

  // Construimos la URL completa con el texto codificado
  const urlFinal = `${urlBase}?text=${encodeURIComponent(mensaje)}`;

  // Abrimos en una pestaña nueva
  window.open(urlFinal, '_blank');
}

 }
