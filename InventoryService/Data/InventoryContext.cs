using Microsoft.EntityFrameworkCore;

namespace InventoryService.Data;

public class InventoryContext : DbContext
{
    public InventoryContext(DbContextOptions<InventoryContext> options) : base(options) { }

    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
}

public class InventoryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProductId { get; set; } = string.Empty;
    public int Stock { get; set; }
}