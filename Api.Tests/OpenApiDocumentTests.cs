using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Tests;

// Build-time generation of Api/openapi.json reads the document from this registration.
public class OpenApiDocumentTests
{
    [Fact]
    public async Task The_v1_document_describes_both_endpoints()
    {
        await using var factory = new WebApplicationFactory<Program>();

        var provider = factory.Services.GetRequiredKeyedService<IOpenApiDocumentProvider>("v1");
        var document = await provider.GetOpenApiDocumentAsync();

        Assert.Contains("/api/Weather", document.Paths.Keys);
        Assert.Contains("/api/health", document.Paths.Keys);
    }
}
