import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Regulation } from './regulation';

describe('Regulation', () => {
  let component: Regulation;
  let fixture: ComponentFixture<Regulation>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [Regulation]
    });
    fixture = TestBed.createComponent(Regulation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
