using todo_service_api.Data;
using todo_service_api.Filters;

var builder = WebApplication.CreateBuilder(args);

// In-memory data store — replace with EF Core + database in production
builder.Services.AddSingleton<DataStore>();

// Allow all origins in development; restrict to specific frontend URL in production
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Load XML doc comments so Swagger UI shows descriptions on each endpoint
    var xml = Path.Combine(AppContext.BaseDirectory, "todo-service-api.xml");
    options.IncludeXmlComments(xml);

    // Display sections in order: Users → Tags → Todos (overrides default alpha sort)
    options.DocumentFilter<TagOrderFilter>();
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        // Disable Swagger UI's built-in alphabetical tag sorter to respect spec order
        c.ConfigObject.AdditionalItems["tagsSorter"] = "none";
    });
}

app.UseHttpsRedirection();
app.UseCors();        // Must be placed before UseAuthorization
app.UseAuthorization();
app.MapControllers();
app.Run();

// Exposes Program class to the test project (WebApplicationFactory requires it)
public partial class Program { }
