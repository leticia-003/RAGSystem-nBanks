import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private baseUrl = 'https://ragsystem-nbanks.onrender.com/api';

    constructor(private http: HttpClient) {}

  getDocumentsByIds(ids: string[]): Observable<{ id: string; fileName: string }[]> {
    return this.http.post<{ id: string; fileName: string }[]>(
        `${this.baseUrl}/Documents/by-ids`,
        ids
      );
  }

  previewFile(chatId: string, fileName: string): string {
    const encodedFileName = encodeURIComponent(fileName);
    return `${this.baseUrl}/ChatHistory/preview?chatId=${chatId}&fileName=${encodedFileName}`;
  }

  uploadFile(formData: FormData): Observable<{ id: string; fileName: string }> {
    return this.http.post<{ id: string; fileName: string }>(
      'ragsystem-nbanks.onrender.com/api/Documents/upload',
      formData
    );
  }
  
  attachFileToChat(chatId: string, fileId: string): Observable<any> {
    return this.http.put(
      'ragsystem-nbanks.onrender.com/api/ChatHistory/file',
      JSON.stringify(fileId),
      {
        params: { chatId },
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  deleteFileByName(fileName: string) {
    return this.http.delete<any>(`ragsystem-nbanks.onrender.com/api/Documents/delete`, {
      params: { name: fileName }
    });
  }
  
  deleteFileFromChat(chatId: string, fileId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ChatHistory/file`, {
      params: {
        chatId: chatId,
        fileId: fileId
      }
    });
  }
  
  
  
  
}
