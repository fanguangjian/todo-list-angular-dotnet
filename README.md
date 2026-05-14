<!--
 * @Author: G.F
 * @Date: 2026-05-12 22:04:58
 * @LastEditTime: 2026-05-13 00:08:18
 * @LastEditors: your name
 * @Description: 
 * @FilePath: /todo-list-angular-dotnet/README.md
-->
# todo-list-angular-dotnet
Simple full-stack TODO list application built with Angular and .NET Web API
<!-- intital ng -->
npx @angular/cli@21 new todo-app --routing --style=scss

<!-- intital dotnet -->
dotnet new webapi -n todo-service-api --use-controllers
<!-- run dotnet -->
dotnet run --project todo-service-api

## Running the App

### Backend
```bash
cd backend/todo-service-api
dotnet watch run
```

**Swagger UI:** http://localhost:5057/swagger  (or https://localhost:7029/swagger)

---

## Project Structure

```
todo-list-angular-dotnet/
├── frontend/                          # Angular 21 app
│   └── todo-app/
│       ├── src/
│       │   ├── app/
│       │   └── environments/
│       ├── angular.json
│       └── package.json
│
└── backend/                           # .NET 10 Web API
    └── todo-service-api/
        ├── Models/
        │   ├── DueStatus.cs           # Enum: NoDueDate / Upcoming / DueToday / Overdue / Completed
        │   ├── User.cs                # User entity
        │   ├── Tag.cs                 # Tag entity (scoped to user)
        │   └── TodoItem.cs            # TodoItem entity (DueStatus is a computed property)
        ├── DTOs/
        │   ├── UserDto.cs             # UserDto / CreateUserDto
        │   ├── TagDto.cs              # TagDto / CreateTagDto
        │   └── TodoDto.cs             # TodoItemDto / CreateTodoDto / UpdateTodoDto
        ├── Common/
        │   └── ApiResponse.cs         # Unified response wrapper: { status, message, data }
        ├── Data/
        │   └── DataStore.cs           # In-memory store, registered as Singleton
        ├── Filters/
        │   ├── ApiResponseFilter.cs   # Global result filter — wraps all responses automatically
        │   └── TagOrderFilter.cs      # Swagger document filter — sets tag order: Users → Tags → Todos
        ├── Middleware/
        │   └── ExceptionHandlingMiddleware.cs  # Global exception handler — returns consistent JSON errors
        ├── Controllers/
        │   ├── UsersController.cs     # GET / POST / DELETE  /api/users
        │   ├── TagsController.cs      # GET / POST / DELETE  /api/users/{userId}/tags
        │   └── TodosController.cs     # CRUD + PATCH toggle  /api/users/{userId}/todos
        ├── Properties/
        │   └── launchSettings.json
        ├── Program.cs
        ├── appsettings.json
        └── todo-service-api.csproj

    todo-service-api.Tests/            # Integration tests (WebApplicationFactory)
        ├── Helpers/
        │   └── HttpClientExtensions.cs  # ReadDataAsync<T> — unwraps ApiResponse envelope
        ├── TodoApiFactory.cs            # Test server setup with fresh DataStore per run
        ├── UsersControllerTests.cs      # 6 tests
        ├── TagsControllerTests.cs       # 4 tests
        └── TodosControllerTests.cs      # 8 tests
```

### Run Tests
```bash
cd backend
dotnet test todo-service-api.Tests
```

18 integration tests covering Users, Tags, and Todos controllers.

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

| Exception | Status |
|-----------|--------|
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
