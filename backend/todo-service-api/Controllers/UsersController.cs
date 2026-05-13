using Microsoft.AspNetCore.Mvc;
using todo_service_api.Data;
using todo_service_api.DTOs;
using todo_service_api.Models;

namespace todo_service_api.Controllers;

/// <summary>Manage users</summary>
[ApiController]
[Route("api/users")]
public class UsersController(DataStore store) : ControllerBase
{
    /// <summary>Get all users</summary>
    [HttpGet]
    public ActionResult<List<UserDto>> GetAll() =>
        store.Users.Select(ToDto).ToList();

    /// <summary>Get a user by ID</summary>
    [HttpGet("{id:guid}")]
    public ActionResult<UserDto> GetById(Guid id)
    {
        var user = store.Users.FirstOrDefault(u => u.Id == id);
        return user is null ? NotFound() : Ok(ToDto(user));
    }

    /// <summary>Create a new user</summary>
    [HttpPost]
    public ActionResult<UserDto> Create(CreateUserDto dto)
    {
        if (store.Users.Any(u => u.Email == dto.Email))
            return Conflict(new { message = "Email already in use." });

        var user = new User { Name = dto.Name, Email = dto.Email };
        store.Users.Add(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, ToDto(user));
    }

    /// <summary>Delete a user and all their todos and tags</summary>
    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        var user = store.Users.FirstOrDefault(u => u.Id == id);
        if (user is null) return NotFound();

        store.Todos.RemoveAll(t => t.UserId == id);
        store.Tags.RemoveAll(t => t.UserId == id);
        store.Users.Remove(user);
        return NoContent();
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Name, u.Email, u.CreatedAt);
}
