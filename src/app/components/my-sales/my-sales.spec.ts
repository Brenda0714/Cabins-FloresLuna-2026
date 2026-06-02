import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySales } from './my-sales';

describe('MySales', () => {
  let component: MySales;
  let fixture: ComponentFixture<MySales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySales],
    }).compileComponents();

    fixture = TestBed.createComponent(MySales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
