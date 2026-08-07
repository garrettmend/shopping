using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using InventoryService.Data;
using StackExchange.Redis;

namespace InventoryService;

public class InventoryWorker : BackgroundService
{
    private readonly ILogger<InventoryWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly string _bootstrapServers = "localhost:9092";
    private static readonly Lazy<ConnectionMultiplexer> LazyRedis = new(() =>
        ConnectionMultiplexer.Connect("localhost:6379"));

    private static ConnectionMultiplexer Redis => LazyRedis.Value;

    public InventoryWorker(ILogger<InventoryWorker> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var config = new ConsumerConfig
        {
            BootstrapServers = _bootstrapServers,
            GroupId = "inventory-service-group",
            AutoOffsetReset = AutoOffsetReset.Earliest
        };

        var producerConfig = new ProducerConfig { BootstrapServers = _bootstrapServers };

        using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();
        using var producer = new ProducerBuilder<Null, string>(producerConfig).Build();
        
        consumer.Subscribe("order-created");

        _logger.LogInformation("[Inventory Service] Kafka Consumer started, listening to 'order-created'...");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var consumeResult = consumer.Consume(stoppingToken);
                if (consumeResult?.Message?.Value == null) continue;

var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                var orderEvent = JsonSerializer.Deserialize<OrderEvent>(consumeResult.Message.Value, options);
                if (orderEvent == null) continue;

                _logger.LogInformation("[Inventory Service] Processing Order ID: {orderId}", orderEvent.OrderId);

                // --- Redis idempotency check before deducting stock ---
                var redis = ConnectionMultiplexer.Connect("localhost:6379");
                var db = redis.GetDatabase();

                string idempotencyKey = $"processed-order:{orderEvent.OrderId}";

                // Redis SETNX: Sets the key only if it does not already exist (returns true if newly set)
                bool isNewEvent = await db.StringSetAsync(idempotencyKey, "processed", TimeSpan.FromHours(24), When.NotExists);

                if (!isNewEvent)
                {
                    _logger.LogWarning("[Idempotency] Order {orderId} was already processed. Skipping duplicate message.", orderEvent.OrderId);
                    continue; // Skip processing this duplicate event entirely
                }

                // Safe to process stock reduction because we hold the unique Redis lock for this order ID

                // Scope to resolve scoped DbContext inside a background service
                using (var scope = _serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<InventoryContext>();
                    bool success = true;

                    try
                    {
                        foreach (var item in orderEvent.Items)
                        {
                            var inventory = await dbContext.InventoryItems
                                .FirstOrDefaultAsync(i => i.ProductId == item.ProductId, stoppingToken);

                            if (inventory == null || inventory.Stock < item.Quantity)
                            {
                                success = false;
                                break;
                            }

                            inventory.Stock -= item.Quantity;
                        }

if (success)
                        {
                            await dbContext.SaveChangesAsync(stoppingToken);
                            
                            // Publish success event back to Kafka (include userEmail for email receipts)
                            var successPayload = JsonSerializer.Serialize(new { orderId = orderEvent.OrderId, status = "CONFIRMED", userEmail = orderEvent.UserEmail });
                            await producer.ProduceAsync("inventory-updated", new Message<Null, string> { Value = successPayload }, stoppingToken);
                            _logger.LogInformation("[Inventory Service] Stock successfully updated for Order ID: {orderId}", orderEvent.OrderId);
                        }
                        else
                        {
                            // Publish failure/compensation event back to Kafka
                            var failPayload = JsonSerializer.Serialize(new { orderId = orderEvent.OrderId, reason = "Out of stock" });
                            await producer.ProduceAsync("order-failed", new Message<Null, string> { Value = failPayload }, stoppingToken);
                            _logger.LogWarning("[Inventory Service] Stock deduction failed (Out of stock) for Order ID: {orderId}", orderEvent.OrderId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Inventory Service] Error updating inventory database for Order ID: {orderId}", orderEvent.OrderId);
                    }
                }
            }
        }
        catch (OperationCanceledException)
        {
            consumer.Close();
        }
    }
}

public class OrderEvent
{
    public string OrderId { get; set; } = string.Empty;
    public List<OrderItem> Items { get; set; } = new();
    public string? UserEmail { get; set; }
}

public class OrderItem
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
}