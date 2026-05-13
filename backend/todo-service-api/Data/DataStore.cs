using todo_service_api.Models;

namespace todo_service_api.Data;

public class DataStore
{
    public List<User> Users { get; } = [];
    public List<TodoItem> Todos { get; } = [];
    public List<Tag> Tags { get; } = [];
}
