using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace todo_service_api.Tests.Helpers;

public static class HttpClientExtensions
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<T?> ReadDataAsync<T>(this HttpResponseMessage response)
    {
        var wrapper = await response.Content.ReadFromJsonAsync<ApiWrapper<T>>(Options);
        return wrapper is null ? default : wrapper.Data;
    }

    public static async Task<T?> GetDataAsync<T>(this HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return await response.ReadDataAsync<T>();
    }

    private record ApiWrapper<T>(int Status, string Message, T? Data);
}
