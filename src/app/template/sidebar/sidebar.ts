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
    this.close.emit();
  }

  // Esto fuerza a Angular a reaccionar si el Input cambia desde afuera
  ngOnChanges() {
    this.cdr.markForCheck();
  }
}
