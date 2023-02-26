import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateImagesComponent } from './candidate-images.component';

describe('AdminComponent', () => {
  let component: CandidateImagesComponent;
  let fixture: ComponentFixture<CandidateImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CandidateImagesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
