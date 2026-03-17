import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChatHistoryService } from './chat-history.service';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://ragsystem-nbanks.onrender.com/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChatHistoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ChatHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUserByVat should call correct URL with params', () => {
    const vat = '123456789';
    service.getUserByVat(vat).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/Users/vat?vat=${vat}`);
    expect(req.request.method).toBe('GET');
    req.flush({}); // mock response
  });

  it('getChatHistories should call correct URL with params', () => {
    const userId = 'user1';
    service.getChatHistories(userId).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ChatHistory/user?userId=${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush([]); // mock response
  });

  it('deleteChatHistory should call delete with correct URL', () => {
    const id = 'chat1';
    service.deleteChatHistory(id).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ChatHistory/delete?id=${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null); // mock response
  });

  it('createChatHistory should POST dto with correct headers', () => {
    const dto = { chatId: 'chat1', message: 'hello' };
    service.createChatHistory(dto).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ChatHistory/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual(dto);
    req.flush({}); // mock response
  });

  it('askQuestion should POST question with correct body and headers', () => {
    const chatId = 'chat1';
    const question = 'What time is it?';
    service.askQuestion(chatId, question).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/ChatHistory/ask`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.body).toEqual({ chatId, question });
    req.flush([]); // mock response
  });

  // Additional integration tests simulating backend responses
  describe('backend integration', () => {
    it('should handle successful createChatHistory (200 OK)', () => {
      const dto = { chatId: 'chat1', message: 'hello' };
      service.createChatHistory(dto).subscribe(response => {
        expect(response).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${baseUrl}/ChatHistory/create`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true }, { status: 200, statusText: 'OK' });
    });

    it('should handle failed createChatHistory (400 Bad Request)', () => {
      const dto = { chatId: '', message: '' };
      service.createChatHistory(dto).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: err => {
          expect(err.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ChatHistory/create`);
      req.flush({ message: 'Invalid data' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle failed askQuestion (500 Internal Server Error)', () => {
      service.askQuestion('chat1', 'Why?').subscribe({
        next: () => fail('should have failed with 500 error'),
        error: err => {
          expect(err.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ChatHistory/ask`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return 404 when chat history is not found', () => {
      const userId = 'nonexistent-user';
      service.getChatHistories(userId).subscribe({
        next: () => fail('should have failed with 404'),
        error: err => {
          expect(err.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/ChatHistory/user?userId=${userId}`);
      req.flush({ message: 'No chat histories found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
