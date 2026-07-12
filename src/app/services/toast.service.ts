import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  kind: 'error' | 'success';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private static readonly ERROR_DURATION_MS = 6000;
  private static readonly SUCCESS_DURATION_MS = 4000;

  private nextId = 1;
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  public readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();
  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

  show(message: string, kind: 'error' | 'success' = 'error'): void {
    // Coalesce: if an identical message is currently visible, don't stack another.
    if (this.toastsSubject.value.some(t => t.message === message)) {
      return;
    }
    const toast: Toast = { id: this.nextId++, message, kind };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    const duration = kind === 'error'
      ? ToastService.ERROR_DURATION_MS
      : ToastService.SUCCESS_DURATION_MS;
    const timer = setTimeout(() => {
      this.dismissTimers.delete(toast.id);
      this.remove(toast.id);
    }, duration);
    this.dismissTimers.set(toast.id, timer);
  }

  dismiss(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
    this.remove(id);
  }

  private remove(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
