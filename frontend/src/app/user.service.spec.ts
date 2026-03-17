import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { HttpErrorResponse } from '@angular/common/http';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://ragsystem-nbanks.onrender.com/api/Users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkVat', () => {
    const vat = '123456789';

    it('should GET user by VAT (200)', () => {
      const mockResponse = { name: 'Test User', vat };

      service.checkVat(vat).subscribe((res: any) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(
        r => r.method === 'GET' && r.url === `${apiUrl}/vat` && r.params.get('vat') === vat
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse, { status: 200, statusText: 'OK' });
    });

    it('should return 404 if user not found', () => {
      service.checkVat(vat).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/vat?vat=${vat}`);
      req.flush({ message: 'User not found.' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createUser', () => {
    const vat = ' 123456789 ';
    const trimmedVat = vat.trim();
    const body = { VATNumber: trimmedVat };

    it('should POST to create user (200)', () => {
      const mockResponse = { id: 'u123', vat: trimmedVat };

      service.createUser(vat).subscribe((res: any) => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/create`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush(mockResponse, { status: 200, statusText: 'OK' });
    });

    it('should return 400 if VAT already exists', () => {
      const errorMsg = { message: 'User with this VAT already exists.' };

      service.createUser(vat).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(400);
          expect(error.error).toEqual(errorMsg);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/create`);
      req.flush(errorMsg, { status: 400, statusText: 'Bad Request' });
    });

    it('should return 500 on unexpected server error', () => {
      service.createUser(vat).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/create`);
      req.flush({ message: 'Unexpected error.' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  
});
