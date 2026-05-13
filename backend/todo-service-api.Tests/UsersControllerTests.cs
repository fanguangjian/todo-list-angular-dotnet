using System.Net;
using System.Net.Http.Json;
using todo_service_api.DTOs;

namespace todo_service_api.Tests;

public class UsersControllerTests : IClassFixture<TodoApiFactory>
{
    private readonly HttpClient _client;

    public UsersControllerTests(TodoApiFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoUsers()
    {
        var response = await _client.GetAsync("/api/users");
        response.EnsureSuccessStatusCode();
        var users = await response.Content.ReadFromJsonAsync<List<UserDto>>();
        Assert.NotNull(users);
        Assert.Empty(users);
    }

    [Fact]
    public async Task Create_ReturnsCreatedUser()
    {
        var dto = new CreateUserDto("Alice", "alice@example.com");
        var response = await _client.PostAsJsonAsync("/api/users", dto);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
        Assert.Equal("Alice", user.Name);
        Assert.Equal("alice@example.com", user.Email);
    }

    [Fact]
    public async Task Create_ReturnsConflict_WhenEmailAlreadyExists()
    {
        var dto = new CreateUserDto("Bob", "bob@example.com");
        await _client.PostAsJsonAsync("/api/users", dto);
        var response = await _client.PostAsJsonAsync("/api/users", dto);
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsUser_WhenExists()
    {
        var created = await CreateUser("Carol", "carol@example.com");
        var response = await _client.GetAsync($"/api/users/{created.Id}");
        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal(created.Id, user!.Id);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        var response = await _client.GetAsync($"/api/users/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesUser()
    {
        var user = await CreateUser("Dan", "dan@example.com");
        var deleteResponse = await _client.DeleteAsync($"/api/users/{user.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var getResponse = await _client.GetAsync($"/api/users/{user.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    private async Task<UserDto> CreateUser(string name, string email)
    {
        var response = await _client.PostAsJsonAsync("/api/users", new CreateUserDto(name, email));
        return (await response.Content.ReadFromJsonAsync<UserDto>())!;
    }
}
