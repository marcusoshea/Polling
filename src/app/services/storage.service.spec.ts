import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { AuthUser } from '../interfaces/auth-user';
import { PollingOrder } from '../interfaces/polling-order';

describe('StorageService', () => {
  let service: StorageService;
  let store: { [key: string]: string } = {};
  const sessionStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };

  beforeEach(() => {
    store = {};
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true, configurable: true });

    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveMember / getMember', () => {
    it('should save and retrieve a member', () => {
      const user = { name: 'Test User', email: 'test@example.com' } as AuthUser;
      service.saveMember(user);
      expect(service.getMember()).toEqual(user as any);
    });

    it('should return null when no member is stored', () => {
      expect(service.getMember()).toBeNull();
    });

    it('should overwrite existing member on save', () => {
      service.saveMember({ name: 'Old User' } as AuthUser);
      service.saveMember({ name: 'New User' } as AuthUser);
      expect(service.getMember()).toEqual({ name: 'New User' } as any);
    });

    it('should remove old entry before saving new member', () => {
      const removeItemSpy = spyOn(sessionStorageMock, 'removeItem').and.callThrough();
      service.saveMember({ name: 'User' } as AuthUser);
      expect(removeItemSpy).toHaveBeenCalled();
    });
  });

  describe('savePollingOrder / getPollingOrder', () => {
    it('should save and retrieve a polling order', () => {
      const order = { polling_order_id: 1, polling_order_name: 'Test Order' } as PollingOrder;
      service.savePollingOrder(order);
      expect(service.getPollingOrder()).toEqual(order as any);
    });

    it('should return null when no polling order is stored', () => {
      expect(service.getPollingOrder()).toBeNull();
    });

    it('should overwrite existing polling order on save', () => {
      service.savePollingOrder({ polling_order_id: 1 } as PollingOrder);
      service.savePollingOrder({ polling_order_id: 2 } as PollingOrder);
      expect(service.getPollingOrder()).toEqual({ polling_order_id: 2 } as any);
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no user is stored', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true when a user is stored', () => {
      service.saveMember({ name: 'Test User' } as AuthUser);
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('clean', () => {
    it('should clear session storage', () => {
      const clearSpy = spyOn(sessionStorageMock, 'clear').and.callThrough();
      service.saveMember({ name: 'Test User' } as AuthUser);
      service.clean();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should result in isLoggedIn returning false after clean', () => {
      service.saveMember({ name: 'Test User' } as AuthUser);
      service.clean();
      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
