import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UserApi } from './user-api';
import { CreateUserDto, UserDto } from './models';

const STORAGE_KEY = 'todo-app:user-id';

@Injectable({ providedIn: 'root' })
export class UserSession {
  private readonly userApi = inject(UserApi);

  readonly currentUser = signal<UserDto | null>(null);
  readonly users = signal<UserDto[]>([]);
  readonly loading = signal(false);

  async bootstrap(): Promise<void> {
    this.loading.set(true);
    try {
      const users = await firstValueFrom(this.userApi.list());
      this.users.set(users);

      const storedId = localStorage.getItem(STORAGE_KEY);
      const match = storedId ? users.find((u) => u.id === storedId) : null;
      if (match) {
        this.currentUser.set(match);
      } else if (users.length > 0) {
        this.select(users[0]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  select(user: UserDto): void {
    this.currentUser.set(user);
    localStorage.setItem(STORAGE_KEY, user.id);
  }

  async create(body: CreateUserDto): Promise<UserDto> {
    const created = await firstValueFrom(this.userApi.create(body));
    this.users.update((list) => [...list, created]);
    this.select(created);
    return created;
  }
}
