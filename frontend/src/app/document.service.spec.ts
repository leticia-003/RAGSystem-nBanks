import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://ragsystem-nbanks.onrender.com/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDocumentsByIds should POST with ids array', () => {
    const ids = ['id1', 'id2'];
    service.getDocumentsByIds(ids).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/Documents/by-ids`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(ids);
    req.flush([]);
  });

  it('previewFile should encode fileName and return correct URL', () => {
    const chatId = 'chat1';
    const fileName = 'file name.pdf';
    const expectedUrl = `${baseUrl}/ChatHistory/preview?chatId=${chatId}&fileName=file%20name.pdf`;
    expect(service.previewFile(chatId, fileName)).toBe(expectedUrl);
  });

  it('uploadFile should POST FormData', () => {
    const formData = new FormData();
    service.uploadFile(formData).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/Documents/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);
    req.flush({ id: '123', fileName: 'file.pdf' });
  });

  it('attachFileToChat should PUT fileId with chatId param and JSON header', () => {
    const chatId = 'chat1';
    const fileId = 'file123';

    service.attachFileToChat(chatId, fileId).subscribe();

    const req = httpMock.expectOne(
      r => r.method === 'PUT' && r.url === `${baseUrl}/ChatHistory/file` && r.params.get('chatId') === chatId
    );

    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toBe(JSON.stringify(fileId));
    req.flush({});
  });

  it('deleteFileByName should DELETE with fileName param', () => {
  const fileName = 'file.pdf';

  service.deleteFileByName(fileName).subscribe(response => {
    expect(response).toBeDefined(); // or expect(response).toEqual(...) if you know the exact response
  });

  const req = httpMock.expectOne(
    r => r.method === 'DELETE' && r.url === `${baseUrl}/Documents/delete` && r.params.get('name') === fileName
  );

  req.flush({}); // mock empty response
});


  it('deleteFileFromChat should DELETE with chatId and fileId params', () => {
  const chatId = 'chat1';
  const fileId = 'file123';

  service.deleteFileFromChat(chatId, fileId).subscribe(response => {
    expect(response).toBeTruthy();  // <-- add an expectation here
  });

  const req = httpMock.expectOne(
    r =>
      r.method === 'DELETE' &&
      r.url === `${baseUrl}/ChatHistory/file` &&
      r.params.get('chatId') === chatId &&
      r.params.get('fileId') === fileId
  );

  req.flush({}); // mock response
});


  // ✅ Backend status/integration tests
  describe('backend integration', () => {
    it('should return 200 OK on successful file upload', () => {
      const formData = new FormData();
      service.uploadFile(formData).subscribe(res => {
        expect(res).toEqual({ id: 'abc123', fileName: 'test.pdf' });
      });

      const req = httpMock.expectOne(`${baseUrl}/Documents/upload`);
      req.flush({ id: 'abc123', fileName: 'test.pdf' }, { status: 200, statusText: 'OK' });
    });

    it('should handle 400 Bad Request on upload (non-PDF)', () => {
      const formData = new FormData();
      service.uploadFile(formData).subscribe({
        next: () => fail('should have thrown 400'),
        error: err => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/Documents/upload`);
      req.flush({ message: 'Only PDF files are allowed.' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should return 404 if no documents found by IDs', () => {
      const ids = ['nonexistent-id'];

      service.getDocumentsByIds(ids).subscribe({
        next: () => fail('should have failed with 404'),
        error: err => {
          expect(err.status).toBe(404);
          expect(err.error.message).toContain('No documents found');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/Documents/by-ids`);
      req.flush({ message: 'No documents found for the given IDs.' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle error on deleteFileByName not found', () => {
      const fileName = 'ghost.pdf';

      service.deleteFileByName(fileName).subscribe({
        next: () => fail('should have failed with 404'),
        error: err => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/Documents/delete?name=${fileName}`);
      req.flush({ message: 'File not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle unexpected 500 error on deleteFileFromChat', () => {
      const chatId = 'chat1';
      const fileId = 'badfile';

      service.deleteFileFromChat(chatId, fileId).subscribe({
        next: () => fail('should have failed with 500'),
        error: err => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${baseUrl}/ChatHistory/file?chatId=${chatId}&fileId=${fileId}`
      );
      req.flush({ message: 'Unexpected server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
