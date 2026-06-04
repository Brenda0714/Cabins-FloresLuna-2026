import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservaTransferService {
  // Guardamos la data en una Signal para que sea reactiva y fácil de leer
  public datosParaPagar = signal<any>(null);
}
