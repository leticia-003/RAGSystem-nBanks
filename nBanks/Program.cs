using Infrastructure.Mongo;
using Infrastructure.Qdrant;
using Infrastructure.OpenAI;
using Microsoft.Extensions.Options;
using Domain.Models.Users;
using Infrastructure.Mongo.Users;
using nBanks.Application.Users;
using Domain.Models.Documents;
using Infrastructure.Mongo.Documents;
using nBanks.Application.Documents;
using Domain.Models.ChatHistories;
using Infrastructure.Mongo.ChatHistories;
using nBanks.Application.ChatHistories;
using Domain.Models.RagServer;
using Infrastructure.RagServer;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<MongoSettings>(
    builder.Configuration.GetSection("MongoSettings"));

builder.Services.AddSingleton<MongoDbContext>();


builder.Services.Configure<QdrantSettings>(
    builder.Configuration.GetSection("QdrantSettings"));

builder.Services.AddSingleton<QdrantClientProvider>();


builder.Services.Configure<OpenAISettings>(
    builder.Configuration.GetSection("OpenAISettings"));

builder.Services.AddSingleton<OpenAIService>();

builder.Services.AddHttpClient(); 

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<UserService>();

builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<DocumentService>();

builder.Services.AddScoped<IChatHistoryRepository, ChatHistoryRepository>();
builder.Services.AddScoped<ChatHistoryService>();

builder.Services.AddHttpClient<IRagServerRepository, RagServerRepository>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins(
                "http://localhost:4200",
                "https://ragsystem-nbanks-1.onrender.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));

app.Run();