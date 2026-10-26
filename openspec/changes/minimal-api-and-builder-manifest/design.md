## Context

`Api/` uses `Azure.Functions.Sdk/1.0.1` with one HTTP-triggered function (`Weather`, `AuthorizationLevel.Function`) that returns a hard-coded JSON string. The Blazor WebAssembly client (`Client/`) calls `api/Weather` on its own origin. App Service Builder routes public prefixes to components, so with the API mounted at `/api` and the client at `/`, that same-origin call reaches the API without a proxy. The solution currently pins the .NET 11 RC3 SDK in `global.json`, and the client uses .NET 11-only packages (`Microsoft.AspNetCore.Components.Gateway`). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A plain ASP.NET Core minimal API with identical `/api/Weather` output.
- A machine-readable API contract produced by every build, for later breaking-change tests.
- A manifest whose build and start commands are deterministic and can be checked locally.
- Released .NET 10 everywhere, so Builder and Stryker.NET both work with it.

**Non-Goals:**
- Changes to the Blazor client's pages or components.
- Serving the OpenAPI document at runtime, or adding Swagger UI.
- The breaking-change tests themselves.
- Authentication, CORS, Application Insights or any Builder setting outside `builder.yaml`.
- Infrastructure (ARM/Bicep) for the App Service Builder resource.
- Renaming `test-swa-net11.slnx`.

## Decisions

### .NET 10 across the solution
`global.json` pins SDK `10.0.100` with `rollForward: latestFeature` and `allowPrerelease: false`. All projects target `net10.0`; package references use `10.0.14`. In `Client.csproj`, `Microsoft.AspNetCore.Components.Gateway` is replaced by `Microsoft.AspNetCore.Components.WebAssembly.DevServer` (the .NET 10 development server), and the .NET 11 `StaticWebAssetSpaFallbackEnabled` property is removed because the dev server provides the SPA fallback. `OverrideHtmlAssetPlaceholders` and the fingerprint placeholders in `index.html` are .NET 10 features and stay.

### Minimal API in a single `Program.cs`, routes under `/api`
`Api.csproj` switches to `Microsoft.NET.Sdk.Web`, `net10.0`. `Program.cs` maps `GET /api/Weather` and `GET /api/health`. Forecasts become a `WeatherForecast(DateOnly Date, int TemperatureC, string Summary)` record array serialised by the default JSON options (camelCase, `DateOnly` as `yyyy-MM-dd`), so the content type is `application/json`. `public partial class Program;` lets the test project host it.
Routes keep the `/api` prefix inside the app. That is the convention the client already uses, and the Builder reference says the mount prefix is not removed before the request reaches the app.

### OpenAPI document written on every build
`Microsoft.AspNetCore.OpenApi` (`AddOpenApi()`) describes the endpoints; `Microsoft.Extensions.ApiDescription.Server` generates the document during build. `OpenApiDocumentsDirectory` is the project directory and `OpenApiGenerateDocumentsOptions` is `--file-name openapi`, giving `Api/openapi.json`. The file is committed so contract changes show in diffs and a later breaking-change test can compare it against a base branch. Endpoints declare `.Produces<WeatherForecast[]>()` / `.Produces(200)` so the document carries response schemas. The generator's up-to-date check only tracks `Api.dll`, so a `RegenerateMissingOpenApiDocument` target clears its cache file when `openapi.json` is missing, making every build write the document.
Alternative considered: generating only at runtime via `MapOpenApi()` - needs a running app to read the contract and gives nothing to diff in a pull request.

### Tests: xUnit with `WebApplicationFactory`
New `Api.Tests` project (xUnit, `Microsoft.AspNetCore.Mvc.Testing`) hosts the real pipeline in-process. This is the red step for each endpoint. Each test creates its own factory, so startup code (forecast data, OpenAPI registration) runs inside the test and Stryker.NET mutants in it are exercised. The OpenAPI requirement is tested by building `Api` and reading `Api/openapi.json` with `jq` in a script, plus a `git diff --exit-code` check.

### Explicit build commands with fixed output
Both components use `platform: dotnet`, `platformVersion: "10.0"` and an explicit `build: dotnet publish -c Release -o $DESTINATION_DIR`, rather than relying on repository inference (the reference only documents inference for Vite and Next.js).
- Client: Blazor WebAssembly publish puts the site under `wwwroot/` of the publish directory, so `output: wwwroot`.
- API: the publish directory contains `Api.dll`, so `run.start: dotnet Api.dll --urls http://0.0.0.0:8080` with `run.port: 8080`.

### Explicit health path `/api/health`
With an explicit path and no status list, deployment requires exact HTTP 200 from both the direct compute and the public route. Without it, `/api` would be probed and a 404 would count as healthy, which proves nothing.

### Manifest checks in the existing Node test suite
`tests/project.test.mjs` parses `builder.yaml` with the `yaml` package (`uniqueKeys` enabled, matching Builder's duplicate-key rejection) and asserts the spec. A shell script builds the API with the manifest's own `build`/`run.start` strings and probes the health path.

### Stryker.NET on `Api`
`dotnet-stryker` 5.0.0 is added as a local tool (`.config/dotnet-tools.json`) and run against `Api` with `Api.Tests`. Surviving mutants are either killed with a new test or recorded as equivalent with the reason.

## Risks / Trade-offs

- [Builder's .NET 10 SDK may be older than 10.0.14 packages need] → Packages target `net10.0` and run on any 10.0 runtime; `rollForward: latestFeature` accepts any 10.0 SDK feature band.
- [Build-time OpenAPI generation runs `Program.cs` during build] → `Program.cs` has no external dependencies at startup, so generation cannot fail on missing configuration. Any future startup dependency must tolerate the generation run.
- [`/api/Weather` loses the Functions key requirement] → The data is fixed sample data; the client never sent a key.

## Migration Plan

Deploy by creating an App Service Builder version from this repository. Rollback is redeploying the previous version; the previous Static Web Apps workflow was already removed from the repository.
