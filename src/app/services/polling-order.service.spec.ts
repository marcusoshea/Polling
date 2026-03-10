import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PollingOrderService } from './polling-order.service';

describe('PollingOrderService', () => {
  let service: PollingOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PollingOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
