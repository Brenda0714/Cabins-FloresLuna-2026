import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancellations } from './cancellations';

describe('Cancellations', () => {
  let component: Cancellations;
  let fixture: ComponentFixture<Cancellations>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Cancellations]
    });
    fixture = TestBed.createComponent(Cancellations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
