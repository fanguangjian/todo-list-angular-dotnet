export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export enum DueStatus {
  NoDueDate = 0,
  Overdue = 1,
  DueToday = 2,
  DueSoon = 3,
  NotDueYet = 4,
}

export interface UserDto {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
}

export interface TagDto {
  id: string;
  userId: string;
  name: string | null;
  color: string | null;
}

export interface CreateTagDto {
  name: string;
  color: string;
}

export interface TodoItemDto {
  id: string;
  userId: string;
  title: string | null;
  isCompleted: boolean;
  dueDate: string | null;
  dueStatus: DueStatus;
  createdAt: string;
  completedAt: string | null;
  tags: TagDto[] | null;
}

export interface CreateTodoDto {
  title: string;
  dueDate?: string | null;
  tagIds?: string[];
}

export interface UpdateTodoDto {
  title?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
}
