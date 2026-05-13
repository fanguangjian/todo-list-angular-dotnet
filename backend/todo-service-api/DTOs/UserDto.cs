namespace todo_service_api.DTOs;

public record UserDto(Guid Id, string Name, string Email, DateTime CreatedAt);

public record CreateUserDto(string Name, string Email);
