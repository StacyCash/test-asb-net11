## Why

The API is an Azure Functions isolated-worker app that only runs under the Functions host. App Service Builder deploys source build units described in a `builder.yaml` manifest with at most one static output and one public compute output, so the API must be a self-hosted HTTP app and the repository needs a manifest describing both the Blazor client and the API. App Service Builder is a preview resource, so the solution targets the released .NET 10 rather than a .NET 11 prerelease, removing any question of which runtime the target provides.

## What Changes

- **BREAKING** Replace the Azure Functions project in `Api/` with an ASP.NET Core minimal API. The Functions host, `host.json`, `local.settings.json.example` and the Visual Studio service dependency files are removed.
- **BREAKING** Retarget the whole solution from .NET 11 RC3 to .NET 10: `global.json`, `Client`, `Api` and the new test project. The client's .NET 11-only packages are replaced with their .NET 10 equivalents.
- `GET /api/Weather` returns the same five fixed forecasts as JSON, without a Functions key.
- Add `GET /api/health`, returning HTTP 200, for deployment health checks.
- Every build of `Api` writes the API's OpenAPI document to a committed file, as the baseline for future breaking-change tests.
- Add an `Api.Tests` xUnit project that exercises the API in-process, and add it to the solution.
- Add `builder.yaml` at the repository root with two components, each with an explicit build command: the Blazor WebAssembly client as static output at `/`, and the minimal API as web compute at `/api` with an explicit health check path.
- Update the Playwright web server configuration, existing project checks and README to run the API with `dotnet run` instead of `func start`.
- Run Stryker.NET mutation testing on `Api`.

## Capabilities

### New Capabilities
- `weather-api`: HTTP endpoints served by the API project (fixed weather forecasts, health) and the OpenAPI document generated at build.
- `deployment-manifest`: The App Service Builder manifest that builds and routes the client and API.

### Modified Capabilities

## Impact

- `Api/`: project SDK, entry point and endpoint code replaced; Functions packages and host files removed; new committed `Api/openapi.json`.
- `Client/Client.csproj`, `global.json`: .NET 10 target and packages.
- New `Api.Tests/` project; `test-swa-net11.slnx` gains a project entry.
- New `builder.yaml` at the repository root.
- `playwright.config.mjs`, `tests/project.test.mjs`, `tests/application.spec.mjs`, `README.md`.
- Azure Functions Core Tools is no longer needed to run the API locally; the .NET 11 SDK is no longer needed at all.
- `package.json` gains a YAML parser dev dependency for manifest checks; a .NET local tool manifest gains `dotnet-stryker`.
