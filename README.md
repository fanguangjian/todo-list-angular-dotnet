<!--
 * @Author: G.F
 * @Date: 2026-05-12 22:04:58
 * @LastEditTime: 2026-05-14 22:47:21
 * @LastEditors: GF
 * @FilePath: /todo-list-angular-dotnet/README.md
-->

# Todo List — Angular + .NET

A full-stack Todo List application built with **Angular 21** (frontend) and **.NET 10 Web API** (backend).

Users can view their todo list, add items, delete items, assign tags, and track due dates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21, TypeScript, SCSS |
| Backend | .NET 10, ASP.NET Core Web API |
| Data | In-memory store (no database required) |
| Testing | xUnit, WebApplicationFactory (18 integration tests) |
| API Docs | Swagger / OpenAPI 3 |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

---

### Run the Backend

```bash
cd backend/todo-service-api
dotnet restore
dotnet watch run
```

The API starts at:
- HTTP: `http://localhost:5057`
- HTTPS: `https://localhost:7029`

**Swagger UI:** `http://localhost:5057/swagger`

---

### Run the Frontend

```bash
cd frontend/todo-app
npm install
npm start
```

The app opens at `http://localhost:4200`

> The frontend calls the backend at `http://localhost:5057`. Configured in `src/environments/environment.ts`.

---

### Run Backend Tests

```bash
cd backend
dotnet test todo-service-api.Tests
```

18 integration tests covering all endpoints for Users, Tags, and Todos.

---

## Project Structure

```
todo-list-angular-dotnet/
│
├── frontend/todo-app/                  # Angular 21 app
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   ├── models.ts           # Shared TypeScript interfaces (User, Todo, Tag, DueStatus)
│       │   │   ├── user-api.ts         # HTTP calls for /api/users
│       │   │   ├── todo-api.ts         # HTTP calls for /api/users/{userId}/todos
│       │   │   ├── tag-api.ts          # HTTP calls for /api/users/{userId}/tags
│       │   │   ├── user-session.ts     # Stores the current active user (in-memory session)
│       │   │   ├── tag-session.ts      # Stores the current user's tags
│       │   │   └── api-response.interceptor.ts  # Unwraps { status, message, data } envelope
│       │   ├── todo-list/
│       │   │   ├── todo-list.ts        # Main todo list component
│       │   │   ├── todo-list.html      # Template
│       │   │   └── todo-list.scss      # Styles
│       │   ├── app.ts                  # Root component
│       │   ├── app.routes.ts           # Route definitions
│       │   └── app.config.ts           # App bootstrap (HttpClient, interceptors)
│       ├── environments/
│       │   └── environment.ts          # API base URL config
│       └── styles.scss                 # Global styles
│
└── backend/                            # .NET 10 Web API
    ├── todo-service-api/
    │   ├── Models/
    │   │   ├── DueStatus.cs            # Enum: NoDueDate / Upcoming / DueToday / Overdue / Completed
    │   │   ├── User.cs                 # User entity
    │   │   ├── Tag.cs                  # Tag entity (scoped to user)
    │   │   └── TodoItem.cs             # TodoItem entity (DueStatus is a computed property)
    │   ├── DTOs/
    │   │   ├── UserDto.cs              # UserDto / CreateUserDto
    │   │   ├── TagDto.cs               # TagDto / CreateTagDto
    │   │   └── TodoDto.cs              # TodoItemDto / CreateTodoDto / UpdateTodoDto
    │   ├── Common/
    │   │   └── ApiResponse.cs          # Unified response wrapper: { status, message, data }
    │   ├── Data/
    │   │   └── DataStore.cs            # In-memory store, registered as Singleton
    │   ├── Filters/
    │   │   ├── ApiResponseFilter.cs    # Global result filter — wraps all responses automatically
    │   │   └── TagOrderFilter.cs       # Swagger document filter — sets tag order: Users → Tags → Todos
    │   ├── Middleware/
    │   │   └── ExceptionHandlingMiddleware.cs  # Global exception handler — returns consistent JSON errors
    │   ├── Controllers/
    │   │   ├── UsersController.cs      # GET / POST / DELETE  /api/users
    │   │   ├── TagsController.cs       # GET / POST / DELETE  /api/users/{userId}/tags
    │   │   └── TodosController.cs      # CRUD + PATCH toggle  /api/users/{userId}/todos
    │   └── Program.cs
    │
    └── todo-service-api.Tests/         # Integration tests (WebApplicationFactory)
        ├── Helpers/
        │   └── HttpClientExtensions.cs # ReadDataAsync<T> — unwraps ApiResponse envelope
        ├── TodoApiFactory.cs           # Test server setup with fresh DataStore per run
        ├── UsersControllerTests.cs     # 6 tests
        ├── TagsControllerTests.cs      # 4 tests
        └── TodosControllerTests.cs     # 8 tests
```

---

## API Response Format

All endpoints return a unified envelope:

```json
{
  "status": 200,
  "message": "Success",
  "data": { }
}
```

On error:

```json
{
  "status": 404,
  "message": "An unexpected error occurred.",
  "data": null,
  "path": "/api/users/xxx/todos"
}
```

| Exception | HTTP Status |
|-----------|-------------|
| `ArgumentException` | 400 Bad Request |
| `KeyNotFoundException` | 404 Not Found |
| `InvalidOperationException` | 409 Conflict |
| Other | 500 Internal Server Error |

---

## API Endpoints

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/{id}` | Get user by ID |
| POST | `/api/users` | Create a user |
| DELETE | `/api/users/{id}` | Delete a user |

### Tags (scoped to user)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/{userId}/tags` | Get all tags for a user |
| POST | `/api/users/{userId}/tags` | Create a tag |
| DELETE | `/api/users/{userId}/tags/{id}` | Delete a tag |

### Todos (scoped to user)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/{userId}/todos` | Get todos (supports `?tagId=` and `?dueStatus=` filters) |
| GET | `/api/users/{userId}/todos/{id}` | Get todo by ID |
| POST | `/api/users/{userId}/todos` | Create a todo |
| PUT | `/api/users/{userId}/todos/{id}` | Update a todo |
| PATCH | `/api/users/{userId}/todos/{id}/complete` | Toggle completed status |
| DELETE | `/api/users/{userId}/todos/{id}` | Delete a todo |

<img width="1082" height="904" alt="image" src="https://github.com/user-attachments/assets/5e2dd14a-a4a8-4968-87ca-73dba9420fdb" />



---

## Final Demo
<img width="1059" height="557" alt="image" src="https://github.com/user-attachments/assets/bd6192b3-4a4f-4b98-b781-df5c5190702b" />
<img width="1054" height="814" alt="image" src="https://github.com/user-attachments/assets/40691bd4-f71d-461e-bc2a-7f2aa96aa760" />




