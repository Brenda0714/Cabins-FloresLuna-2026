import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HowToGet } from './how-to-get';

describe('HowToGet', () => {
  let component: HowToGet;
  let fixture: ComponentFixture<HowToGet>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HowToGet]
    });
    fixture = TestBed.createComponent(HowToGet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
