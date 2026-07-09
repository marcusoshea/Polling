import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { NotesService } from './notes.service';
import { environment } from '../../environments/environment';

describe('NotesService', () => {
  let service: NotesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(NotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMyPollingNotesByCandidateId issues GET to /polling/mynotes/:id with Bearer auth header', () => {
    service.getMyPollingNotesByCandidateId(42, 'my-token').subscribe();

    const req = httpMock.expectOne(environment.apiUrl + '/polling/mynotes/42');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });
});
