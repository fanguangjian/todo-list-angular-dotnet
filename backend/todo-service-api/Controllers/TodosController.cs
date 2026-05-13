using Microsoft.AspNetCore.Mvc;
using todo_service_api.Data;
using todo_service_api.DTOs;
using todo_service_api.Models;

namespace todo_service_api.Controllers;

/// <summary>Manage todos scoped to a user</summary>
[ApiController]
[Route("api/users/{userId:guid}/todos")]
public class TodosController(DataStore store) : ControllerBase
{
    /// <summary>Get all todos for a user — optionally filter by tagId or dueStatus</summary>
    [HttpGet]
    public ActionResult<List<TodoItemDto>> GetAll(Guid userId, [FromQuery] Guid? tagId, [FromQuery] DueStatus? dueStatus)
    {
        if (!store.Users.Any(u => u.Id == userId)) return NotFound();

        var todos = store.Todos.Where(t => t.UserId == userId);

        if (tagId.HasValue)
            todos = todos.Where(t => t.Tags.Any(tag => tag.Id == tagId));

        if (dueStatus.HasValue)
            todos = todos.Where(t => t.DueStatus == dueStatus);

        return todos.Select(ToDto).ToList();
    }

    /// <summary>Get a single todo by ID</summary>
    [HttpGet("{id:guid}")]
    public ActionResult<TodoItemDto> GetById(Guid userId, Guid id)
    {
        var todo = store.Todos.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        return todo is null ? NotFound() : Ok(ToDto(todo));
    }

    /// <summary>Create a new todo for a user</summary>
    [HttpPost]
    public ActionResult<TodoItemDto> Create(Guid userId, CreateTodoDto dto)
    {
        if (!store.Users.Any(u => u.Id == userId)) return NotFound();

        var tags = ResolveTags(userId, dto.TagIds);
        var todo = new TodoItem
        {
            UserId = userId,
            Title = dto.Title,
            DueDate = dto.DueDate,
            Tags = tags
        };

        store.Todos.Add(todo);
        return CreatedAtAction(nameof(GetById), new { userId, id = todo.Id }, ToDto(todo));
    }

    /// <summary>Update a todo's title, due date, or tags</summary>
    [HttpPut("{id:guid}")]
    public ActionResult<TodoItemDto> Update(Guid userId, Guid id, UpdateTodoDto dto)
    {
        var todo = store.Todos.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        if (todo is null) return NotFound();

        if (dto.Title is not null) todo.Title = dto.Title;
        if (dto.DueDate is not null) todo.DueDate = dto.DueDate;
        if (dto.TagIds is not null) todo.Tags = ResolveTags(userId, dto.TagIds);

        return Ok(ToDto(todo));
    }

    /// <summary>Toggle the completed status of a todo</summary>
    [HttpPatch("{id:guid}/complete")]
    public ActionResult<TodoItemDto> Complete(Guid userId, Guid id)
    {
        var todo = store.Todos.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        if (todo is null) return NotFound();

        todo.IsCompleted = !todo.IsCompleted;
        todo.CompletedAt = todo.IsCompleted ? DateTime.UtcNow : null;

        return Ok(ToDto(todo));
    }

    /// <summary>Delete a todo</summary>
    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid userId, Guid id)
    {
        var todo = store.Todos.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        if (todo is null) return NotFound();

        store.Todos.Remove(todo);
        return NoContent();
    }

    private List<Tag> ResolveTags(Guid userId, List<Guid>? tagIds) =>
        tagIds is null ? [] : store.Tags.Where(t => t.UserId == userId && tagIds.Contains(t.Id)).ToList();

    private static TodoItemDto ToDto(TodoItem t) => new(
        t.Id, t.UserId, t.Title, t.IsCompleted,
        t.DueDate, t.DueStatus, t.CreatedAt, t.CompletedAt,
        t.Tags.Select(tag => new TagDto(tag.Id, tag.UserId, tag.Name, tag.Color)).ToList()
    );
}
