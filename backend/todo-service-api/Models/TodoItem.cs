namespace todo_service_api.Models;

public class TodoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public List<Tag> Tags { get; set; } = [];

    public DueStatus DueStatus => (IsCompleted, DueDate) switch
    {
        (true, _)                                     => DueStatus.Completed,
        (false, null)                                 => DueStatus.NoDueDate,
        (false, var d) when d!.Value.Date == DateTime.UtcNow.Date => DueStatus.DueToday,
        (false, var d) when d!.Value.Date < DateTime.UtcNow.Date  => DueStatus.Overdue,
        _                                             => DueStatus.Upcoming,
    };
}
