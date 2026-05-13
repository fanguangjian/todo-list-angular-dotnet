import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CreateTodoDto,
  DueStatus,
  TodoItemDto,
  UpdateTodoDto,
} from './models';

@Injectable({ providedIn: 'root' })
export class TodoApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/users`;

  list(
    userId: string,
    options: { tagId?: string; dueStatus?: DueStatus } = {},
  ): Observable<TodoItemDto[]> {
    let params = new HttpParams();
    if (options.tagId) {
      params = params.set('tagId', options.tagId);
    }
    if (options.dueStatus !== undefined) {
      params = params.set('dueStatus', String(options.dueStatus));
    }
    return this.http.get<TodoItemDto[]>(`${this.baseUrl}/${userId}/todos`, { params });
  }

  get(userId: string, id: string): Observable<TodoItemDto> {
    return this.http.get<TodoItemDto>(`${this.baseUrl}/${userId}/todos/${id}`);
  }

  create(userId: string, body: CreateTodoDto): Observable<TodoItemDto> {
    return this.http.post<TodoItemDto>(`${this.baseUrl}/${userId}/todos`, body);
  }

  update(userId: string, id: string, body: UpdateTodoDto): Observable<TodoItemDto> {
    return this.http.put<TodoItemDto>(`${this.baseUrl}/${userId}/todos/${id}`, body);
  }

  toggleComplete(userId: string, id: string): Observable<TodoItemDto> {
    return this.http.patch<TodoItemDto>(
      `${this.baseUrl}/${userId}/todos/${id}/complete`,
      {},
    );
  }

  delete(userId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/todos/${id}`);
  }
}
