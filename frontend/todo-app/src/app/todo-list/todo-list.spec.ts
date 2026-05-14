import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { TodoList } from './todo-list';
import { UserSession } from '../api/user-session';
import { TagSession } from '../api/tag-session';
import { TodoApi } from '../api/todo-api';
import { DueStatus, TodoItemDto, UserDto } from '../api/models';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTodo(overrides: Partial<TodoItemDto> = {}): TodoItemDto {
  return {
    id: 'todo-1',
    userId: 'user-1',
    title: 'Test job',
    isCompleted: false,
    dueDate: null,
    dueStatus: DueStatus.NoDueDate,
    createdAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    tags: [],
    ...overrides,
  };
}

const MOCK_USER: UserDto = {
  id: 'user-1',
  name: 'Grant',
  email: 'grant@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function buildMockUserSession(user: UserDto | null = MOCK_USER) {
  return {
    currentUser: signal(user),
    users: signal(user ? [user] : []),
    loading: signal(false),
    bootstrap: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(),
    create: vi.fn(),
  };
}

function buildMockTagSession() {
  return {
    tags: signal([]),
    loading: signal(false),
    tagsById: signal(new Map()),
    priorityTags: signal([]),
    tradeTags: signal([]),
    isPriorityTag: () => false,
    loadForUser: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  };
}

function buildMockTodoApi(todos: TodoItemDto[] = []) {
  return {
    list: vi.fn().mockReturnValue(of(todos)),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleComplete: vi.fn(),
    delete: vi.fn().mockReturnValue(of(void 0)),
  };
}

async function createComponent(
  todos: TodoItemDto[] = [],
  user: UserDto | null = MOCK_USER,
): Promise<{ fixture: ComponentFixture<TodoList>; component: TodoList }> {
  await TestBed.configureTestingModule({
    imports: [TodoList],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideNoopAnimations(),
      provideNativeDateAdapter(),
      { provide: UserSession, useValue: buildMockUserSession(user) },
      { provide: TagSession,  useValue: buildMockTagSession() },
      { provide: TodoApi,     useValue: buildMockTodoApi(todos) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TodoList);
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TodoList', () => {

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('creates the component', async () => {
      const { component } = await createComponent();
      expect(component).toBeTruthy();
    });

    it('shows the job board when a user is logged in', async () => {
      const { fixture } = await createComponent([makeTodo()]);
      expect(fixture.nativeElement.querySelector('.todo-sections')).toBeTruthy();
    });

    it('shows the welcome screen when no user is selected', async () => {
      const { fixture } = await createComponent([], null);
      expect(fixture.nativeElement.querySelector('.welcome')).toBeTruthy();
    });

    it('renders one row per todo item', async () => {
      const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2', title: 'Second job' })];
      const { fixture } = await createComponent(todos);
      const rows = fixture.nativeElement.querySelectorAll('.todo-row');
      expect(rows.length).toBe(2);
    });
  });

  // ── Delete confirmation ───────────────────────────────────────────────────

  describe('delete confirmation', () => {
    it('sets pendingDeleteId when Delete is clicked', async () => {
      const todo = makeTodo({ id: 'abc' });
      const { component, fixture } = await createComponent([todo]);

      const btn = fixture.nativeElement.querySelector('.action-delete') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect((component as any).pendingDeleteId()).toBe('abc');
    });

    it('shows confirm/cancel UI after Delete is clicked', async () => {
      const { component, fixture } = await createComponent([makeTodo({ id: 'abc' })]);

      (component as any).pendingDeleteId.set('abc');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.action-confirm')).toBeTruthy();
      expect(el.querySelector('.action-confirm-yes')).toBeTruthy();
      expect(el.querySelector('.action-confirm-no')).toBeTruthy();
    });

    it('clears pendingDeleteId when cancel is clicked', async () => {
      const { component, fixture } = await createComponent([makeTodo({ id: 'abc' })]);

      (component as any).pendingDeleteId.set('abc');
      fixture.detectChanges();

      const cancelBtn = fixture.nativeElement.querySelector('.action-confirm-no') as HTMLButtonElement;
      cancelBtn.click();
      fixture.detectChanges();

      expect((component as any).pendingDeleteId()).toBeNull();
    });

    it('removes the item and clears pendingDeleteId on confirm', async () => {
      const todo = makeTodo({ id: 'abc' });
      const { component, fixture } = await createComponent([todo]);

      (component as any).pendingDeleteId.set('abc');
      fixture.detectChanges();

      const confirmBtn = fixture.nativeElement.querySelector('.action-confirm-yes') as HTMLButtonElement;
      confirmBtn.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect((component as any).pendingDeleteId()).toBeNull();
      expect((component as any).items().find((i: TodoItemDto) => i.id === 'abc')).toBeUndefined();
    });
  });

  // ── Sections (computed signal) ────────────────────────────────────────────

  describe('sections computed signal', () => {
    it('splits active and completed into labelled sections when both exist', async () => {
      const todos = [
        makeTodo({ id: '1', isCompleted: false }),
        makeTodo({ id: '2', isCompleted: true, completedAt: new Date().toISOString() }),
      ];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);

      const headers = (component as any).sections().filter((s: any) => s.kind === 'header');
      expect(headers.length).toBe(2);
      expect(headers[0].label).toBe('Open Jobs');
      expect(headers[1].label).toBe('Closed Jobs');
    });

    it('shows no section headers when all jobs are active', async () => {
      const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2', title: 'Job 2' })];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);

      const headers = (component as any).sections().filter((s: any) => s.kind === 'header');
      expect(headers.length).toBe(0);
    });

    it('filters to active only when filter is "active"', async () => {
      const todos = [
        makeTodo({ id: '1', isCompleted: false }),
        makeTodo({ id: '2', isCompleted: true }),
      ];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);
      (component as any).filter.set('active');

      const items = (component as any).sections().filter((s: any) => s.kind === 'item');
      expect(items.length).toBe(1);
      expect(items[0].item.isCompleted).toBe(false);
    });

    it('filters to completed only when filter is "completed"', async () => {
      const todos = [
        makeTodo({ id: '1', isCompleted: false }),
        makeTodo({ id: '2', isCompleted: true }),
      ];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);
      (component as any).filter.set('completed');

      const items = (component as any).sections().filter((s: any) => s.kind === 'item');
      expect(items.length).toBe(1);
      expect(items[0].item.isCompleted).toBe(true);
    });
  });

  // ── Stats counters ────────────────────────────────────────────────────────

  describe('stats counters', () => {
    it('remaining() counts only active items', async () => {
      const todos = [
        makeTodo({ id: '1', isCompleted: false }),
        makeTodo({ id: '2', isCompleted: false }),
        makeTodo({ id: '3', isCompleted: true }),
      ];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);

      expect((component as any).remaining()).toBe(2);
    });

    it('hasCompleted() is false when no items are done', async () => {
      const todos = [makeTodo({ id: '1', isCompleted: false })];
      const { component } = await createComponent(todos);
      (component as any).items.set(todos);

      expect((component as any).hasCompleted()).toBe(false);
    });
  });
});
