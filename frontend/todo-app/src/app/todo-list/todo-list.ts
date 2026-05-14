import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { DueStatus, TodoItemDto, UserDto } from '../api/models';
import { TagSession } from '../api/tag-session';
import { TodoApi } from '../api/todo-api';
import { UserSession } from '../api/user-session';

type Filter = 'all' | 'active' | 'completed';
type SortDir = 'soonest' | 'latest';

type Section =
  | { kind: 'header'; label: string; status: 'in-progress' | 'completed' }
  | { kind: 'item'; item: TodoItemDto };

const DEFAULT_ROW_COLOR = '#c4c4c4';

@Component({
  selector: 'app-todo-list',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.scss',
})
export class TodoList implements OnInit {
  private readonly todoApi = inject(TodoApi);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly session = inject(UserSession);
  protected readonly tagSession = inject(TagSession);

  protected readonly draft = signal('');
  protected readonly draftDue = signal<Date | null>(null);
  protected readonly draftTime = signal<string>('');
  protected readonly minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  protected readonly draftPriorityId = signal<string>('');
  protected readonly draftTradeIds = signal<string[]>([]);

  protected readonly timeOptions: ReadonlyArray<{ value: string; label: string }> =
    (() => {
      const out: { value: string; label: string }[] = [];
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
          const hh = String(h).padStart(2, '0');
          const mm = String(m).padStart(2, '0');
          const period = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 === 0 ? 12 : h % 12;
          out.push({ value: `${hh}:${mm}`, label: `${h12}:${mm} ${period}` });
        }
      }
      return out;
    })();
  protected readonly filter = signal<Filter>('all');
  protected readonly sortDir = signal<SortDir>('soonest');
  protected readonly items = signal<TodoItemDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly pendingDeleteId = signal<string | null>(null);

  protected readonly newUserName = signal('');
  protected readonly newUserEmail = signal('');
  protected readonly creatingUser = signal(false);

  protected readonly visibleItems = computed(() => {
    const all = this.items();
    switch (this.filter()) {
      case 'active':
        return all.filter((i) => !i.isCompleted);
      case 'completed':
        return all.filter((i) => i.isCompleted);
      default:
        return all;
    }
  });

  protected readonly sections = computed<Section[]>(() => {
    const all = this.items();
    const filter = this.filter();
    const dir = this.sortDir();
    const cmp = (a: TodoItemDto, b: TodoItemDto) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : null;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : null;
      if (aDue === null && bDue === null) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (aDue === null) {
        return 1;
      }
      if (bDue === null) {
        return -1;
      }
      const diff = aDue - bDue;
      return dir === 'soonest' ? diff : -diff;
    };
    const active = all.filter((i) => !i.isCompleted).sort(cmp);
    const completed = all.filter((i) => i.isCompleted).sort(cmp);
    const out: Section[] = [];
    const showHeaders = filter === 'all' && active.length > 0 && completed.length > 0;
    if (filter !== 'completed' && active.length > 0) {
      if (showHeaders) {
        out.push({ kind: 'header', label: 'Open Jobs', status: 'in-progress' });
      }
      for (const item of active) {
        out.push({ kind: 'item', item });
      }
    }
    if (filter !== 'active' && completed.length > 0) {
      if (showHeaders) {
        out.push({ kind: 'header', label: 'Closed Jobs', status: 'completed' });
      }
      for (const item of completed) {
        out.push({ kind: 'item', item });
      }
    }
    return out;
  });

  protected readonly remaining = computed(
    () => this.items().filter((i) => !i.isCompleted).length,
  );

  protected readonly hasCompleted = computed(
    () => this.items().some((i) => i.isCompleted),
  );

  protected readonly isFormPristine = computed(
    () =>
      !this.draft().trim() &&
      this.draftDue() === null &&
      !this.draftTime() &&
      !this.draftPriorityId() &&
      this.draftTradeIds().length === 0,
  );

  async ngOnInit(): Promise<void> {
    try {
      await this.session.bootstrap();
    } catch (err) {
      this.toast('Could not reach the API. Is the backend running on :5057?');
      return;
    }
    const user = this.session.currentUser();
    if (user) {
      await this.loadUserData(user.id);
    }
  }

  protected async onUserChange(user: UserDto): Promise<void> {
    this.session.select(user);
    await this.loadUserData(user.id);
  }

  private async loadUserData(userId: string): Promise<void> {
    await Promise.all([this.refresh(), this.loadTags(userId)]);
  }

  private async loadTags(userId: string): Promise<void> {
    try {
      await this.tagSession.loadForUser(userId);
    } catch (err) {
      this.toast('Failed to load tags.');
    }
  }

  protected async createUser(): Promise<void> {
    const name = this.newUserName().trim();
    const email = this.newUserEmail().trim();
    if (!name || !email) {
      return;
    }
    this.creatingUser.set(true);
    try {
      const user = await this.session.create({ name, email });
      this.newUserName.set('');
      this.newUserEmail.set('');
      await this.loadUserData(user.id);
    } catch (err) {
      this.toast('Failed to create user.');
    } finally {
      this.creatingUser.set(false);
    }
  }

  protected async refresh(): Promise<void> {
    const user = this.session.currentUser();
    if (!user) {
      return;
    }
    this.loading.set(true);
    try {
      const todos = await firstValueFrom(this.todoApi.list(user.id));
      this.items.set(todos);
    } catch (err) {
      this.toast('Failed to load todos.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async add(): Promise<void> {
    const user = this.session.currentUser();
    const title = this.draft().trim();
    if (!user || !title || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    try {
      const due = this.draftDue();
      const dueIso = due ? this.combineDateTime(due, this.draftTime()) : null;
      const priorityId = this.draftPriorityId();
      const tradeIds = this.draftTradeIds();
      const tagIds = [priorityId, ...tradeIds].filter((id) => !!id);
      const created = await firstValueFrom(
        this.todoApi.create(user.id, {
          title,
          dueDate: dueIso,
          tagIds: tagIds.length > 0 ? tagIds : undefined,
        }),
      );
      this.items.update((list) => [...list, created]);
      this.draft.set('');
      this.draftDue.set(null);
      this.draftTime.set('');
      this.draftPriorityId.set('');
      this.draftTradeIds.set([]);
    } catch (err) {
      this.toast('Failed to create todo.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async toggle(item: TodoItemDto): Promise<void> {
    const user = this.session.currentUser();
    if (!user) {
      return;
    }
    try {
      const updated = await firstValueFrom(
        this.todoApi.toggleComplete(user.id, item.id),
      );
      this.items.update((list) =>
        list.map((i) => (i.id === item.id ? updated : i)),
      );
    } catch (err) {
      this.toast('Failed to update todo.');
    }
  }

  protected async remove(item: TodoItemDto): Promise<void> {
    const user = this.session.currentUser();
    if (!user) return;
    this.pendingDeleteId.set(null);
    try {
      await firstValueFrom(this.todoApi.delete(user.id, item.id));
      this.items.update((list) => list.filter((i) => i.id !== item.id));
      this.toast(`Removed "${item.title}"`);
    } catch (err) {
      this.toast('Failed to delete todo.');
    }
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected async clearCompleted(): Promise<void> {
    const user = this.session.currentUser();
    if (!user) {
      return;
    }
    const completed = this.items().filter((i) => i.isCompleted);
    if (completed.length === 0) {
      return;
    }
    try {
      await Promise.all(
        completed.map((i) => firstValueFrom(this.todoApi.delete(user.id, i.id))),
      );
      this.items.update((list) => list.filter((i) => !i.isCompleted));
      this.toast(`Cleared ${completed.length} completed`);
    } catch (err) {
      this.toast('Some todos could not be cleared.');
      await this.refresh();
    }
  }

  protected setFilter(value: Filter): void {
    this.filter.set(value);
  }

  protected setSortDir(value: SortDir): void {
    this.sortDir.set(value);
  }

  protected resetForm(): void {
    this.draft.set('');
    this.draftDue.set(null);
    this.draftTime.set('');
    this.draftPriorityId.set('');
    this.draftTradeIds.set([]);
  }

  protected dueLabel(status: DueStatus): string {
    switch (status) {
      case DueStatus.Overdue:
        return 'Overdue';
      case DueStatus.DueToday:
        return 'Due today';
      case DueStatus.DueSoon:
        return 'Due soon';
      case DueStatus.NotDueYet:
        return 'Upcoming';
      default:
        return '';
    }
  }

  protected dueClass(status: DueStatus): string {
    switch (status) {
      case DueStatus.Overdue:
        return 'due overdue';
      case DueStatus.DueToday:
        return 'due today';
      case DueStatus.DueSoon:
        return 'due soon';
      case DueStatus.NotDueYet:
        return 'due upcoming';
      default:
        return 'due';
    }
  }

  protected compareUsers(a: UserDto | null, b: UserDto | null): boolean {
    return a?.id === b?.id;
  }

  protected itemColor(item: TodoItemDto): string {
    const tags = item.tags ?? [];
    const priority = tags.find((t) => this.tagSession.isPriorityTag(t));
    return priority?.color || tags[0]?.color || DEFAULT_ROW_COLOR;
  }

  protected hasTime(iso: string | null): boolean {
    if (!iso) {
      return false;
    }
    const d = new Date(iso);
    return d.getHours() !== 0 || d.getMinutes() !== 0;
  }

  protected sectionTrack(_: number, sec: Section): string {
    return sec.kind === 'item' ? `i:${sec.item.id}` : `h:${sec.label}`;
  }

  private combineDateTime(date: Date, time: string): string {
    const combined = new Date(date);
    const [h, m] = time ? time.split(':').map(Number) : [0, 0];
    combined.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
    return combined.toISOString();
  }

  private toast(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 2500 });
  }
}
