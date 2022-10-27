import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollingsComponent } from './pollings.component';

describe('PollingsComponent', () => {
  let component: PollingsComponent;
  let fixture: ComponentFixture<PollingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PollingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
