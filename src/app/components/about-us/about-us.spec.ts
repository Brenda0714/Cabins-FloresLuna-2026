import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUs } from './about-us';

describe('AboutUs', () => {
  let component: AboutUs;
  let fixture: ComponentFixture<AboutUs>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AboutUs]
    });
    fixture = TestBed.createComponent(AboutUs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
