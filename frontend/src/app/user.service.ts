import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'https://ragsystem-nbanks.onrender.com/api/Users';

  constructor(private http: HttpClient) {}

  checkVat(vat: string) {
    return this.http.get(`${this.apiUrl}/vat`, {
      params: { vat }
    });
  }

  createUser(vat: string) {
    return this.http.post(`${this.apiUrl}/create`, { VATNumber: vat.trim() });
  }
}
