import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let sessionStorageMock: { [key: string]: string };

  beforeEach(() => {
    sessionStorageMock = {};

    spyOn(window.sessionStorage, 'setItem').and.callFake((key: string, value: string) => {
      sessionStorageMock[key] = value;
    });
    spyOn(window.sessionStorage, 'getItem').and.callFake((key: string) => {
      return sessionStorageMock[key] ?? null;
    });
    spyOn(window.sessionStorage, 'removeItem').and.callFake((key: string) => {
      delete sessionStorageMock[key];
    });
    spyOn(window.sessionStorage, 'clear').and.callFake(() => {
      sessionStorageMock = {};
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveMember / getMember', () => {
    it('should save and retrieve a member', () => {
      const user = { name: 'Test User', email: 'test@example.com' };
      service.saveMember(user);
      expect(service.getMember()).toEqual(user);
    });

    it('should return empty object when no member is stored', () => {
      expect(service.getMember()).toEqual({});
    });

    it('should overwrite existing member on save', () => {
      service.saveMember({ name: 'Old User' });
      service.saveMember({ name: 'New User' });
      expect(service.getMember()).toEqual({ name: 'New User' });
    });

    it('should remove old entry before saving new member', () => {
      service.saveMember({ name: 'User' });
      expect(window.sessionStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('savePollingOrder / getPollingOrder', () => {
    it('should save and retrieve a polling order', () => {
      const order = { polling_order_id: 1, polling_order_name: 'Test Order' };
      service.savePollingOrder(order);
      expect(service.getPollingOrder()).toEqual(order);
    });

    it('should return empty object when no polling order is stored', () => {
      expect(service.getPollingOrder()).toEqual({});
    });

    it('should overwrite existing polling order on save', () => {
      service.savePollingOrder({ polling_order_id: 1 });
      service.savePollingOrder({ polling_order_id: 2 });
      expect(service.getPollingOrder()).toEqual({ polling_order_id: 2 });
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no user is stored', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true when a user is stored', () => {
      service.saveMember({ name: 'Test User' });
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('clean', () => {
    it('should clear session storage', () => {
      service.saveMember({ name: 'Test User' });
      service.clean();
      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    it('should result in isLoggedIn returning false after clean', () => {
      service.saveMember({ name: 'Test User' });
      service.clean();
      // After clear, sessionStorageMock is empty so getItem returns null
      expect(service.isLoggedIn()).toBeFalse();
    });
  });
});
