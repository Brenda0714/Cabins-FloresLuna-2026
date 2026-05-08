import { ChangeDetectionStrategy, Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery implements OnInit, OnDestroy {

  images = signal<string[]>([
    'assets/img/GALERIA/tu-imagen-1.jpg',
    'assets/img/GALERIA/tu-imagen-2.jpg',
    'assets/img/GALERIA/tu-imagen-3.jpg',
    'assets/img/GALERIA/tu-imagen-4.jpg',
    'assets/img/GALERIA/tu-imagen-5.jpg',
    'assets/img/GALERIA/tu-imagen-6.jpg',
  ]);

  testimonials = signal([
    { img: 'assets/img/GALERIA/cliente1.png', alt: 'Cliente 1', text: 'Increible lugar para disfrutar de la naturaleza.' },
    { img: 'assets/img/GALERIA/cliente2.png', alt: 'Cliente 2', text: 'Una escapada inolvidable. El despertar con el sonido de la naturaleza y la vista de las montañas fue justo lo que necesitábamos para desconectarnos de la ciudad.' },
    { img: 'assets/img/GALERIA/cliente3.png', alt: 'Cliente 3', text: 'Las instalaciones son impecables y el diseño de las cabañas te hace sentir en un refugio de lujo en medio del bosque. ¡Altamente recomendadas!' },
    { img: 'assets/img/GALERIA/cliente4.png', alt: 'Cliente 4', text: 'Paz total. Es el lugar perfecto para leer un libro frente a la chimenea y disfrutar del aire puro de la sierra.' },
    { img: 'assets/img/GALERIA/cliente5.png', alt: 'Cliente 5', text: 'Una escapada inolvidable. El despertar con el sonido de la naturaleza y la vista de las montañas fue justo lo que necesitábamos para desconectarnos de la ciudad.' },
  ]);

// Usamos signals para un mejor rendimiento en OnPush
  currentIndex = signal<number>(0);
  currentIndex2 = signal<number>(0);
  selectedImg = signal<string | null>(null);
  showModal = signal<boolean>(false);
  intervalId: any;

  ngOnInit() {
    this.startAutoplay();
  }
  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  extendedTestimonials = computed(() => {
  const items = this.testimonials();
  // Duplicamos el array para que nunca se vea el fondo blanco
  return [...items, ...items, ...items];
  });

  openModal(index: number) {
    this.currentIndex2.set(index);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  nextImage() {
    this.currentIndex2.update(idx => (idx + 1) % this.images().length);
  }

  prevImage() {
    this.currentIndex2.update(idx => (idx - 1 + this.images().length) % this.images().length);
  }

  startAutoplay() {
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 4000); // Cambia cada 4 segundos
  }

  stopAutoplay() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  nextSlide() {
    if (this.showModal()) return;

    const totalOriginal = this.testimonials().length;

    this.currentIndex.update(idx => {
// Si llega al final del bloque extendido, resetea suavemente
    if (idx >= (totalOriginal * 2)) return totalOriginal;
    return idx + 1;
  });
  }

  prevSlide() {
    this.currentIndex.update(idx => (idx - 1 + this.testimonials().length) % this.testimonials().length);
  }

  // Pausar cuando el usuario interactúa
  handleManualNav(direction: 'next' | 'prev') {
    this.stopAutoplay();
    direction === 'next' ? this.nextSlide() : this.prevSlide();
    this.startAutoplay();
  }


  activeGalleryIndex = signal<number | null>(null);

  toggleOverlay(idx: number) {
    // Si ya está activo, quizás quieras abrir el modal.
    // Si no, solo mostramos el texto "VER"
    this.activeGalleryIndex.set(this.activeGalleryIndex() === idx ? null : idx);
  }



 }
