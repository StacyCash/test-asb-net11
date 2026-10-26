using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests;

// Each test starts its own host so that startup code runs inside the test.
public class WeatherEndpointTests
{
    [Fact]
    public async Task Weather_returns_200_as_json_without_a_key()
    {
        await using var factory = new WebApplicationFactory<Program>();

        var response = await factory.CreateClient().GetAsync("/api/Weather");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Weather_returns_the_five_fixed_forecasts_in_order()
    {
        await using var factory = new WebApplicationFactory<Program>();

        var body = await factory.CreateClient().GetStringAsync("/api/Weather");

        using var expected = JsonDocument.Parse("""
            [
              { "date": "2022-01-06", "temperatureC": 1, "summary": "Freezing" },
              { "date": "2022-01-07", "temperatureC": 14, "summary": "Bracing" },
              { "date": "2022-01-08", "temperatureC": -13, "summary": "Freezing" },
              { "date": "2022-01-09", "temperatureC": -16, "summary": "Balmy" },
              { "date": "2022-01-10", "temperatureC": -2, "summary": "Chilly" }
            ]
            """);
        using var actual = JsonDocument.Parse(body);

        Assert.True(JsonElement.DeepEquals(expected.RootElement, actual.RootElement), body);
    }
}
