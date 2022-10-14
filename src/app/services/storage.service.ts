import { Injectable } from '@angular/core';

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

  public saveMember(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getMember(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }

    return {};
  }


  public savePollingOrder(order: any): void {
    window.sessionStorage.removeItem(POLLING_ORDER);
    window.sessionStorage.setItem(POLLING_ORDER, JSON.stringify(order));
  }

  public getPollingOrder(): any {
    const pollingOrder = window.sessionStorage.getItem(POLLING_ORDER);
    if (pollingOrder) {
      return JSON.parse(pollingOrder);
    }

    return {};
  }

  public isLoggedIn(): boolean {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return true;
    }

    return false;
  }





  
}
