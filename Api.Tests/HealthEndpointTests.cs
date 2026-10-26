using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Api.Tests;

public class HealthEndpointTests
{
    [Fact]
    public async Task Health_returns_200()
    {
        await using var factory = new WebApplicationFactory<Program>();

        var response = await factory.CreateClient().GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
