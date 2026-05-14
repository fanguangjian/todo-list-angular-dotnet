/*
 * @Author: G.F
 * @Date: 2026-05-13 22:15:44
 * @LastEditTime: 2026-05-13 22:19:32
 * @LastEditors: GF
 * @Description:
 * @FilePath: /todo-list-angular-dotnet/backend/todo-service-api.Tests/TagsControllerTests.cs
 */
using System.Net;
using System.Net.Http.Json;
using todo_service_api.DTOs;
using todo_service_api.Tests.Helpers;

namespace todo_service_api.Tests;

public class TagsControllerTests : IClassFixture<TodoApiFactory>
{
    private readonly HttpClient _client;

    public TagsControllerTests(TodoApiFactory factory) =>
        _client = factory.CreateClient();

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoTags()
    {
        var user = await CreateUser();
        var tags = await _client.GetDataAsync<List<TagDto>>($"/api/users/{user.Id}/tags");
        Assert.Empty(tags!);
    }

    [Fact]
    public async Task Create_ReturnsCreatedTag()
    {
        var user = await CreateUser();
        var response = await _client.PostAsJsonAsync($"/api/users/{user.Id}/tags", new CreateTagDto("Work", "#FF5733"));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var tag = await response.ReadDataAsync<TagDto>();
        Assert.Equal("Work", tag!.Name);
        Assert.Equal("#FF5733", tag.Color);
        Assert.Equal(user.Id, tag.UserId);
    }

    [Fact]
    public async Task Create_ReturnsNotFound_WhenUserMissing()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/users/{Guid.NewGuid()}/tags",
            new CreateTagDto("Test", "#000000"));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesTag()
    {
        var user = await CreateUser();
        var tag = await CreateTag(user.Id, "Personal");
        var deleteResponse = await _client.DeleteAsync($"/api/users/{user.Id}/tags/{tag.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        var tags = await _client.GetDataAsync<List<TagDto>>($"/api/users/{user.Id}/tags");
        Assert.DoesNotContain(tags!, t => t.Id == tag.Id);
    }

    private async Task<UserDto> CreateUser()
    {
        var response = await _client.PostAsJsonAsync("/api/users",
            new CreateUserDto($"User_{Guid.NewGuid():N}", $"{Guid.NewGuid():N}@test.com"));
        return (await response.ReadDataAsync<UserDto>())!;
    }

    private async Task<TagDto> CreateTag(Guid userId, string name)
    {
        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/tags",
            new CreateTagDto(name, "#3B82F6"));
        return (await response.ReadDataAsync<TagDto>())!;
    }
}
