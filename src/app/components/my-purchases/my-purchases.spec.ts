import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPurchases } from './my-purchases';

describe('MyPurchases', () => {
  let component: MyPurchases;
  let fixture: ComponentFixture<MyPurchases>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPurchases],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPurchases);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
