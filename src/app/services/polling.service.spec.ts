import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PollingService } from './polling.service';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;
const TOKEN = 'test-bearer-token';

describe('PollingService', () => {
  let service: PollingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PollingService]
    });
    service = TestBed.inject(PollingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllPollings', () => {
    it('should GET /polling/all/:orderId with Bearer auth header', () => {
      service.getAllPollings(5, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/all/5`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush([]);
    });
  });

  describe('getPolling', () => {
    it('should GET /polling/:pollingId with Bearer auth header', () => {
      service.getPolling(10, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });

  describe('getCurrentPolling', () => {
    it('should GET /polling/currentpolling/:orderId with Bearer auth header', () => {
      service.getCurrentPolling(3, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/currentpolling/3`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });

  describe('getPollingSummary', () => {
    it('should GET /polling/pollingsummary/:pollingId/:memberId with auth header', () => {
      service.getPollingSummary(7, '42', TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/pollingsummary/7/42`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });

  describe('removePolling', () => {
    it('should DELETE /polling/delete with polling_id and authToken in body', () => {
      service.removePolling('99', TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/delete`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      expect(req.request.body).toEqual({ polling_id: '99', authToken: TOKEN });
      req.flush({});
    });
  });

  describe('createPolling', () => {
    it('should POST to /polling/create with polling data and auth header', () => {
      service.createPolling('Test Polling', '1', '2024-01-01', '2024-12-31', TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      expect(req.request.body).toEqual({
        name: 'Test Polling',
        polling_order_id: '1',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        authToken: TOKEN
      });
      req.flush({});
    });
  });

  describe('editPolling', () => {
    it('should PUT to /polling/edit with updated polling data and auth header', () => {
      service.editPolling('Updated Polling', '1', '5', '2024-01-01', '2024-12-31', TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/edit`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      expect(req.request.body).toEqual({
        name: 'Updated Polling',
        polling_order_id: '1',
        polling_id: '5',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        authToken: TOKEN
      });
      req.flush({});
    });
  });

  describe('createPollingCandidates', () => {
    it('should POST to /polling/candidates with candidates array', () => {
      const candidates = ['candidate1', 'candidate2'];
      service.createPollingCandidates(candidates, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/candidates`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      expect(req.request.body).toEqual(candidates);
      req.flush({});
    });
  });

  describe('createPollingNotes', () => {
    it('should POST to /pollingnote/create and inject authToken and memberId into body[0]', () => {
      const body = [{ note: 'Test note' }];
      service.createPollingNotes(body, TOKEN, 42).subscribe();

      const req = httpMock.expectOne(`${API_URL}/pollingnote/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      expect(req.request.body[0].authToken).toBe(TOKEN);
      expect(req.request.body[0].polling_order_member_id).toBe(42);
      req.flush({});
    });
  });

  describe('getPollingReport', () => {
    it('should GET /polling/pollingreport/:orderId with auth header', () => {
      service.getPollingReport(2, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/pollingreport/2`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });

  describe('getInProcessPollingReport', () => {
    it('should GET /polling/inprocesspollingreport/:orderId with auth header', () => {
      service.getInProcessPollingReport(3, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/inprocesspollingreport/3`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });

  describe('getMissingVotesReport', () => {
    it('should GET /polling/missingvotes/:orderId/:number with auth header', () => {
      service.getMissingVotesReport(4, 10, TOKEN).subscribe();

      const req = httpMock.expectOne(`${API_URL}/polling/missingvotes/4/10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ' + TOKEN);
      req.flush({});
    });
  });
});
