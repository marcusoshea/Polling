import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { HomeComponent } from './home.component';
import { StorageService } from '../services/storage.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getPollingOrder', 'getMember', 'isLoggedIn']);
    storageServiceSpy.getPollingOrder.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterModule.forRoot([])],
      providers: [
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
