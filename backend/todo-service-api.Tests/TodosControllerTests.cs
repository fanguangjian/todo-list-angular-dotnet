/*
 * @Author: G.F
 * @Date: 2026-05-13 22:16:08
 * @LastEditTime: 2026-05-13 22:20:03
 * @LastEditors: GF
 * @Description: 
 * @FilePath: /todo-list-angular-dotnet/backend/todo-service-api.Tests/TodosControllerTests.cs
 */
using System.Net;
using System.Net.Http.Json;
using todo_service_api.DTOs;
using todo_service_api.Models;

namespace todo_service_api.Tests;

public class TodosControllerTests : IClassFixture<TodoApiFactory>
{
    private readonly HttpClient _client;

    public TodosControllerTests(TodoApiFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoTodos()
    {
        var user = await CreateUser();
        var todos = await _client.GetFromJsonAsync<List<TodoItemDto>>($"/api/users/{user.Id}/todos");
        Assert.Empty(todos!);
    }

    [Fact]
    public async Task Create_ReturnsCreatedTodo()
    {
        var user = await CreateUser();
        var dto = new CreateTodoDto("Buy groceries");
        var response = await _client.PostAsJsonAsync($"/api/users/{user.Id}/todos", dto);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var todo = await response.Content.ReadFromJsonAsync<TodoItemDto>();
        Assert.Equal("Buy groceries", todo!.Title);
        Assert.False(todo.IsCompleted);
        Assert.Equal(DueStatus.NoDueDate, todo.DueStatus);
    }

    [Fact]
    public async Task Create_WithDueDate_ReturnsCorrectDueStatus()
    {
        var user = await CreateUser();
        var dto = new CreateTodoDto("Future task", DateTime.UtcNow.AddDays(3));
        var response = await _client.PostAsJsonAsync($"/api/users/{user.Id}/todos", dto);
        var todo = await response.Content.ReadFromJsonAsync<TodoItemDto>();
        Assert.Equal(DueStatus.Upcoming, todo!.DueStatus);
    }

    [Fact]
    public async Task Complete_TogglesIsCompleted()
    {
        var user = await CreateUser();
        var todo = await CreateTodo(user.Id, "Read a book");
        Assert.False(todo.IsCompleted);

        var response = await _client.PatchAsync($"/api/users/{user.Id}/todos/{todo.Id}/complete", null);
        var updated = await response.Content.ReadFromJsonAsync<TodoItemDto>();
        Assert.True(updated!.IsCompleted);
        Assert.Equal(DueStatus.Completed, updated.DueStatus);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task Complete_TogglesBackToIncomplete()
    {
        var user = await CreateUser();
        var todo = await CreateTodo(user.Id, "Exercise");
        await _client.PatchAsync($"/api/users/{user.Id}/todos/{todo.Id}/complete", null);
        var response = await _client.PatchAsync($"/api/users/{user.Id}/todos/{todo.Id}/complete", null);
        var updated = await response.Content.ReadFromJsonAsync<TodoItemDto>();
        Assert.False(updated!.IsCompleted);
        Assert.Null(updated.CompletedAt);
    }

    [Fact]
    public async Task Update_ChangesTitleAndDueDate()
    {
        var user = await CreateUser();
        var todo = await CreateTodo(user.Id, "Old title");
        var updateDto = new UpdateTodoDto("New title", DateTime.UtcNow.AddDays(1));
        var response = await _client.PutAsJsonAsync($"/api/users/{user.Id}/todos/{todo.Id}", updateDto);
        var updated = await response.Content.ReadFromJsonAsync<TodoItemDto>();
        Assert.Equal("New title", updated!.Title);
        Assert.Equal(DueStatus.Upcoming, updated.DueStatus);
    }

    [Fact]
    public async Task Delete_RemovesTodo()
    {
        var user = await CreateUser();
        var todo = await CreateTodo(user.Id, "Delete me");
        var deleteResponse = await _client.DeleteAsync($"/api/users/{user.Id}/todos/{todo.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var getResponse = await _client.GetAsync($"/api/users/{user.Id}/todos/{todo.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task GetAll_FilterByTag_ReturnsMatchingTodos()
    {
        var user = await CreateUser();
        var tagResponse = await _client.PostAsJsonAsync($"/api/users/{user.Id}/tags",
            new CreateTagDto("Work", "#FF0000"));
        var tag = (await tagResponse.Content.ReadFromJsonAsync<TagDto>())!;

        await CreateTodo(user.Id, "No tag todo");
        await _client.PostAsJsonAsync($"/api/users/{user.Id}/todos",
            new CreateTodoDto("Tagged todo", null, [tag.Id]));

        var todos = await _client.GetFromJsonAsync<List<TodoItemDto>>(
            $"/api/users/{user.Id}/todos?tagId={tag.Id}");
        Assert.Single(todos!);
        Assert.Equal("Tagged todo", todos![0].Title);
    }

    private async Task<UserDto> CreateUser()
    {
        var response = await _client.PostAsJsonAsync("/api/users",
            new CreateUserDto($"User_{Guid.NewGuid():N}", $"{Guid.NewGuid():N}@test.com"));
        return (await response.Content.ReadFromJsonAsync<UserDto>())!;
    }

    private async Task<TodoItemDto> CreateTodo(Guid userId, string title)
    {
        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/todos",
            new CreateTodoDto(title));
        return (await response.Content.ReadFromJsonAsync<TodoItemDto>())!;
    }
}
