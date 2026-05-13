namespace todo_service_api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<TodoItem> Todos { get; set; } = [];
    public List<Tag> Tags { get; set; } = [];
}
