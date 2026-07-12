import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { Toast, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let current: Toast[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    current = [];
    service.toasts$.subscribe(toasts => {
      current = toasts;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('show emits a toast on toasts$ (error kind by default)', fakeAsync(() => {
    service.show('Something failed');
    expect(current.length).toBe(1);
    expect(current[0].message).toBe('Something failed');
    expect(current[0].kind).toBe('error');
    tick(6000);
  }));

  it('error toasts auto-dismiss after 6000ms', fakeAsync(() => {
    service.show('Something failed');
    tick(5999);
    expect(current.length).toBe(1);
    tick(1);
    expect(current.length).toBe(0);
  }));

  it('success toasts auto-dismiss after 4000ms', fakeAsync(() => {
    service.show('Saved', 'success');
    expect(current[0].kind).toBe('success');
    tick(3999);
    expect(current.length).toBe(1);
    tick(1);
    expect(current.length).toBe(0);
  }));

  it('an identical message while visible does not stack a duplicate', fakeAsync(() => {
    service.show('Same message');
    service.show('Same message');
    expect(current.length).toBe(1);
    tick(6000);
    expect(current.length).toBe(0);
    // Once dismissed, the same message can be shown again.
    service.show('Same message');
    expect(current.length).toBe(1);
    tick(6000);
  }));

  it('different messages stack', fakeAsync(() => {
    service.show('First');
    service.show('Second');
    expect(current.length).toBe(2);
    tick(6000);
  }));

  it('dismiss removes the toast and cancels its timer', fakeAsync(() => {
    service.show('Something failed');
    const id = current[0].id;
    service.dismiss(id);
    expect(current.length).toBe(0);
    // No pending timer should fire or throw later.
    tick(6000);
    expect(current.length).toBe(0);
  }));
});
