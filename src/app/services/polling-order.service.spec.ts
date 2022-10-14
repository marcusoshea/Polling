import { TestBed } from '@angular/core/testing';

import { PollingOrderService } from './polling-order.service';

describe('PollingOrderService', () => {
  let service: PollingOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PollingOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
