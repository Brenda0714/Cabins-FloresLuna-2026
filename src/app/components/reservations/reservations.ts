import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-reservations',
  imports: [],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservations { }
