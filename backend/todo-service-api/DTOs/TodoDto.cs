using todo_service_api.Models;

namespace todo_service_api.DTOs;

public record TodoItemDto(
    Guid Id,
    Guid UserId,
    string Title,
    bool IsCompleted,
    DateTime? DueDate,
    DueStatus DueStatus,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    List<TagDto> Tags
);

public record CreateTodoDto(
    string Title,
    DateTime? DueDate = null,
    List<Guid>? TagIds = null
);

public record UpdateTodoDto(
    string? Title = null,
    DateTime? DueDate = null,
    List<Guid>? TagIds = null
);
