using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using todo_service_api.Data;

namespace todo_service_api.Tests;

public class TodoApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DataStore));
            if (descriptor != null) services.Remove(descriptor);
            services.AddSingleton<DataStore>();
        });
    }
}
