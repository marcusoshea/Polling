import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ToastComponent } from './toast.component';
import { ToastService } from '../services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a shown message with role="alert"', fakeAsync(() => {
    toastService.show('Your vote could not be submitted. Please try again.');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Your vote could not be submitted. Please try again.');
    expect(alert.classList).toContain('alert-danger');
    tick(6000);
  }));

  it('success toasts render with alert-success styling', fakeAsync(() => {
    toastService.show('Saved', 'success');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.classList).toContain('alert-success');
    tick(4000);
  }));

  it('clicking the dismiss button removes the toast', fakeAsync(() => {
    toastService.show('Something failed');
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
    expect(button).toBeTruthy();
    button.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    tick(6000);
  }));
});
