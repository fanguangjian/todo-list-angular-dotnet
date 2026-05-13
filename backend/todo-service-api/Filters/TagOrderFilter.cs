using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace todo_service_api.Filters;

public class TagOrderFilter : IDocumentFilter
{
    private static readonly string[] Order = ["Users", "Tags", "Todos"];

    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var existing = swaggerDoc.Tags.ToDictionary(t => t.Name);

        // Explicitly define top-level tags in desired order so Swagger UI respects it
        swaggerDoc.Tags = Order
            .Select(name => existing.TryGetValue(name, out var tag) ? tag : new OpenApiTag { Name = name })
            .ToList();
    }
}
