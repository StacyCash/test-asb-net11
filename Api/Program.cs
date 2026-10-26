var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var app = builder.Build();

WeatherForecast[] forecasts =
[
    new(new DateOnly(2022, 1, 6), 1, "Freezing"),
    new(new DateOnly(2022, 1, 7), 14, "Bracing"),
    new(new DateOnly(2022, 1, 8), -13, "Freezing"),
    new(new DateOnly(2022, 1, 9), -16, "Balmy"),
    new(new DateOnly(2022, 1, 10), -2, "Chilly"),
];

app.MapGet("/api/Weather", () => forecasts)
    .Produces<WeatherForecast[]>();

app.MapGet("/api/health", () => Results.Ok())
    .Produces(StatusCodes.Status200OK);

app.Run();

public record WeatherForecast(DateOnly Date, int TemperatureC, string Summary);

public partial class Program;
