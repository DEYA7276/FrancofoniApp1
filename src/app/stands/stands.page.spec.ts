import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StandsPage } from './stands.page';

describe('StandsPage', () => {
  let component: StandsPage;
  let fixture: ComponentFixture<StandsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StandsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
