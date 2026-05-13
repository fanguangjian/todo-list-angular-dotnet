using Microsoft.AspNetCore.Mvc;
using todo_service_api.Data;
using todo_service_api.DTOs;
using todo_service_api.Models;

namespace todo_service_api.Controllers;

/// <summary>Manage tags scoped to a user</summary>
[ApiController]
[Route("api/users/{userId:guid}/tags")]
public class TagsController(DataStore store) : ControllerBase
{
    /// <summary>Get all tags for a user</summary>
    [HttpGet]
    public ActionResult<List<TagDto>> GetAll(Guid userId)
    {
        if (!store.Users.Any(u => u.Id == userId)) return NotFound();
        return store.Tags.Where(t => t.UserId == userId).Select(ToDto).ToList();
    }

    /// <summary>Create a new tag for a user</summary>
    [HttpPost]
    public ActionResult<TagDto> Create(Guid userId, CreateTagDto dto)
    {
        if (!store.Users.Any(u => u.Id == userId)) return NotFound();

        var tag = new Tag { UserId = userId, Name = dto.Name, Color = dto.Color };
        store.Tags.Add(tag);
        return CreatedAtAction(nameof(GetAll), new { userId }, ToDto(tag));
    }

    /// <summary>Delete a tag — also removes it from any todos that reference it</summary>
    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid userId, Guid id)
    {
        var tag = store.Tags.FirstOrDefault(t => t.Id == id && t.UserId == userId);
        if (tag is null) return NotFound();

        foreach (var todo in store.Todos.Where(t => t.UserId == userId))
            todo.Tags.RemoveAll(t => t.Id == id);

        store.Tags.Remove(tag);
        return NoContent();
    }

    private static TagDto ToDto(Tag t) => new(t.Id, t.UserId, t.Name, t.Color);
}
