namespace todo_service_api.DTOs;

public record TagDto(Guid Id, Guid UserId, string Name, string Color);

public record CreateTagDto(string Name, string Color = "#3B82F6");
