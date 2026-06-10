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


  // 1. Guardamos cuál cabaña está seleccionada (Por defecto la primera)
  public cabanaSeleccionada = signal<string>('Orquídea');

  // 2. Controladores del Modal que ya tienes funcionando
  public showModal = signal<boolean>(false);
  public currentIndex2 = signal<number>(0);
  currentIndex = signal<number>(0);

  selectedImg = signal<string | null>(null);
  intervalId: any;

  ngOnInit() {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  public galeriaData = signal<Record<string, string[]>>({
    'Orquídea': [
      'assets/img/GALERIA/orquidea/orquidea-1.png', // Lado Izq - Vertical Larga (Index 0)
      'assets/img/GALERIA/orquidea/orquidea-2.png', // Lado Izq - Horizontal Corta 1 (Index 1)
      'assets/img/GALERIA/orquidea/orquidea-3.png', // Lado Izq - Horizontal Corta 2 (Index 2)
      'assets/img/GALERIA/orquidea/orquidea-4.png', // Lado Der - Horizontal Sup (Index 3)
      'assets/img/GALERIA/orquidea/orquidea-5.png', // Lado Der - Horizontal Media (Index 4)
      'assets/img/GALERIA/orquidea/orquidea-6.png',
      'assets/img/GALERIA/orquidea/orquidea-7.png',
      'assets/img/GALERIA/orquidea/orquidea-8.png',
      'assets/img/GALERIA/orquidea/orquidea-9.png',
      'assets/img/GALERIA/orquidea/orquidea-10.png',
      'assets/img/GALERIA/orquidea/orquidea-11.png',
      'assets/img/GALERIA/orquidea/orquidea-12.png'
    ],
    'Tulipán': [
      'assets/img/GALERIA/tulipan/tulipan-1.png',
      'assets/img/GALERIA/tulipan/tulipan-2.png',
      'assets/img/GALERIA/tulipan/tulipan-3.png',
      'assets/img/GALERIA/tulipan/tulipan-4.png',
      'assets/img/GALERIA/tulipan/tulipan-5.png',
      'assets/img/GALERIA/tulipan/tulipan-6.png',
      'assets/img/GALERIA/tulipan/tulipan-7.png',
      'assets/img/GALERIA/tulipan/tulipan-8.png',
      'assets/img/GALERIA/tulipan/tulipan-9.png',
      'assets/img/GALERIA/tulipan/tulipan-10.png',
      'assets/img/GALERIA/tulipan/tulipan-11.png',
      'assets/img/GALERIA/tulipan/tulipan-12.png'
    ],
    'Girasol': [
      'assets/img/GALERIA/girasol/girasol-1.png',
      'assets/img/GALERIA/girasol/girasol-2.png',
      'assets/img/GALERIA/girasol/girasol-3.png',
      'assets/img/GALERIA/girasol/girasol-4.png',
      'assets/img/GALERIA/girasol/girasol-5.png',
      'assets/img/GALERIA/girasol/girasol-6.png',
      'assets/img/GALERIA/girasol/girasol-7.png',
      'assets/img/GALERIA/girasol/girasol-8.png',
      'assets/img/GALERIA/girasol/girasol-9.png',
      'assets/img/GALERIA/girasol/girasol-10.png',
      'assets/img/GALERIA/girasol/girasol-11.png',
      'assets/img/GALERIA/girasol/girasol-12.png'
    ],
    'Dalia House': [
      'assets/img/GALERIA/DaliaHouse/daliahouse-1.png',
      'assets/img/GALERIA/DaliaHouse/daliahouse-2.png',
      'assets/img/GALERIA/DaliaHouse/daliahouse-3.png',
      'assets/img/GALERIA/DaliaHouse/daliahouse-4.png',
      'assets/img/GALERIA/DaliaHouse/daliahouse-5.png',
      'assets/img/GALERIA/DaliaHouse/daliahouse-6.png'
    ],
    'Magnolia House': [
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-1.png',
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-2.png',
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-3.png',
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-4.png',
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-5.png',
      'assets/img/GALERIA/MagnoliaHouse/magnoliahouse-6.png'
    ],
    'Exterior': [
      'assets/img/GALERIA/exterior/exterior-1.png',
      'assets/img/GALERIA/exterior/exterior-2.png',
      'assets/img/GALERIA/exterior/exterior-3.png',
      'assets/img/GALERIA/exterior/exterior-4.png',
      'assets/img/GALERIA/exterior/exterior-5.png',
      'assets/img/GALERIA/exterior/exterior-6.png',
      'assets/img/GALERIA/exterior/exterior-7.png',
      'assets/img/GALERIA/exterior/exterior-8.png',
      'assets/img/GALERIA/exterior/exterior-9.png',
      'assets/img/GALERIA/exterior/exterior-10.png',
      'assets/img/GALERIA/exterior/exterior-11.png',
      'assets/img/GALERIA/exterior/exterior-12.png'
    ]
  });

  testimonials = signal([
    { img: 'assets/img/GALERIA/cliente1.png', alt: 'Cliente 1', text: 'Increible lugar para disfrutar de la naturaleza.' },
    { img: 'assets/img/GALERIA/cliente2.png', alt: 'Cliente 2', text: 'Una escapada inolvidable. El despertar con el sonido de la naturaleza y la vista de las montañas fue justo lo que necesitábamos para desconectarnos de la ciudad.' },
    { img: 'assets/img/GALERIA/cliente3.png', alt: 'Cliente 3', text: 'Las instalaciones son impecables y el diseño de las cabañas te hace sentir en un refugio de lujo en medio del bosque. ¡Altamente recomendadas!' },
    { img: 'assets/img/GALERIA/cliente4.png', alt: 'Cliente 4', text: 'Paz total. Es el lugar perfecto para leer un libro frente a la chimenea y disfrutar del aire puro de la sierra.' },
    { img: 'assets/img/GALERIA/cliente5.png', alt: 'Cliente 5', text: 'Una escapada inolvidable. El despertar con el sonido de la naturaleza y la vista de las montañas fue justo lo que necesitábamos para desconectarnos de la ciudad.' },
  ]);


  extendedTestimonials = computed(() => {
    const items = this.testimonials();
    // Duplicamos el array para que nunca se vea el fondo blanco
    return [...items, ...items, ...items];
  });

  images() {
    return this.galeriaData()[this.cabanaSeleccionada()] || [];
  }

  setCabana(nombre: string): void {
    this.cabanaSeleccionada.set(nombre);
  }

  openModal(index: number): void {
    this.currentIndex2.set(index);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  prevImage(): void {
    const total = this.images().length;
    this.currentIndex2.update(idx => (idx === 0 ? total - 1 : idx - 1));
  }

  nextImage(): void {
    const total = this.images().length;
    this.currentIndex2.update(idx => (idx === total - 1 ? 0 : idx + 1));
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
