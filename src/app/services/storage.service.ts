import { Injectable } from '@angular/core';
import { AuthUser } from '../interfaces/auth-user';
import { PollingOrder } from '../interfaces/polling-order';

const USER_KEY = 'auth-user';
const POLLING_ORDER = 'polling-order';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  clean(): void {
    window.sessionStorage.clear();
  }

  public saveMember(user: AuthUser): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getMember(): AuthUser | null {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user) as AuthUser;
    }

    return null;
  }

  public savePollingOrder(order: PollingOrder): void {
    window.sessionStorage.removeItem(POLLING_ORDER);
    window.sessionStorage.setItem(POLLING_ORDER, JSON.stringify(order));
  }

  public getPollingOrder(): PollingOrder | null {
    const pollingOrder = window.sessionStorage.getItem(POLLING_ORDER);
    if (pollingOrder) {
      return JSON.parse(pollingOrder) as PollingOrder;
    }

    return null;
  }

  public isLoggedIn(): boolean {
    const user = window.sessionStorage.getItem(USER_KEY);
    return !!user;
  }
}
