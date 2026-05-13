import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CreateTagDto, TagDto } from './models';

@Injectable({ providedIn: 'root' })
export class TagApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/users`;

  list(userId: string): Observable<TagDto[]> {
    return this.http.get<TagDto[]>(`${this.baseUrl}/${userId}/tags`);
  }

  create(userId: string, body: CreateTagDto): Observable<TagDto> {
    return this.http.post<TagDto>(`${this.baseUrl}/${userId}/tags`, body);
  }

  delete(userId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/tags/${id}`);
  }
}
