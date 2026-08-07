using Microsoft.EntityFrameworkCore;
using InventoryService;
using InventoryService.Data;

var builder = Host.CreateDefaultBuilder(args);

builder.ConfigureServices((hostContext, services) =>
{
    var connectionString = hostContext.Configuration.GetConnectionString("DefaultConnection") 
                           ?? "Host=localhost;Port=5433;Database=inventory_db;Username=postgres;Password=password";

    services.AddDbContext<InventoryContext>(options =>
        options.UseNpgsql(connectionString));

    services.AddHostedService<InventoryWorker>();
});

var host = builder.Build();
await host.RunAsync();