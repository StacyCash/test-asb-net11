## 1. Retarget to .NET 10

- [x] 1.1 Update `tests/project.test.mjs` to assert `net10.0` targets, `global.json` SDK `10.0.100` with prerelease disabled, and client packages `Microsoft.AspNetCore.Components.WebAssembly` + `.DevServer` at `10.0.14` with no `Gateway` package; verify `npm test` fails
- [x] 1.2 Retarget `global.json` and `Client/Client.csproj` to .NET 10 (remove `StaticWebAssetSpaFallbackEnabled`); verify `npm test` passes and `dotnet build Client` succeeds

## 2. API test project (red)

- [x] 2.1 Create `Api.Tests` (xUnit, `Microsoft.AspNetCore.Mvc.Testing` 10.0.14, `net10.0`) referencing `Api`, add it to `test-swa-net11.slnx`, and write tests for `GET /api/Weather` (status, `application/json`, exact five forecasts, no key needed) and `GET /api/health` (200); verify they fail against the Functions project
- [x] 2.2 Update `tests/project.test.mjs`: assert `Api.csproj` uses `Microsoft.NET.Sdk.Web` with no Functions packages, `host.json` is gone, and the solution lists `Api.Tests`; verify `npm test` fails

## 3. Minimal API (green)

- [x] 3.1 Replace `Api/` with a minimal API (`Microsoft.NET.Sdk.Web`, `net10.0`, `Program.cs` endpoints under `/api`, `WeatherForecast` record, `public partial class Program`); delete `Weather.cs`, `host.json`, `local.settings.json.example`, `Properties/serviceDependencies*.json`; set `launchSettings.json` to `http://localhost:7041`; verify `dotnet test` and `npm test` pass
- [x] 3.2 Switch the Playwright API web server to `dotnet run --project Api --no-launch-profile --urls http://127.0.0.1:7041` and rename the API test; verify `npm run test:e2e` passes

## 4. OpenAPI document on build

- [x] 4.1 Add `tests/openapi-build.sh`: deletes `Api/openapi.json`, builds `Api`, then uses `jq` to assert the file exists, is OpenAPI 3, has `get` on `/api/Weather` with an array-of-forecast 200 schema and `get` on `/api/health`; verify it fails
- [x] 4.2 Add `Microsoft.AspNetCore.OpenApi` and `Microsoft.Extensions.ApiDescription.Server`, `AddOpenApi()`, `Produces` metadata, and the `OpenApiDocumentsDirectory` / `--file-name openapi` build properties; commit `Api/openapi.json`; verify the script passes and `git diff --exit-code Api/openapi.json` is clean after a rebuild

## 5. Builder manifest

- [x] 5.1 Add the `yaml` dev dependency and manifest tests in `tests/project.test.mjs` covering every `deployment-manifest` scenario; verify `npm test` fails with no `builder.yaml`
- [x] 5.2 Write `builder.yaml` with the `client` and `api` components (explicit builds, `platformVersion: "10.0"`, `/api/health` health path); verify `npm test` passes
- [x] 5.3 Add `tests/manifest-build.sh` that runs the `api` component's `build` and `run.start` from `builder.yaml` (read with a small Node helper using the `yaml` package) and probes `run.healthCheckPath`; verify it exits 0, and that it exits non-zero when the health path is changed to a missing route
- [x] 5.4 Run the `client` build command into a temp `DESTINATION_DIR` and verify `<dir>/wwwroot/index.html` exists

## 6. Mutation testing

- [x] 6.1 Add `dotnet-stryker` 5.0.0 as a local tool and run Stryker.NET on `Api` with `Api.Tests`; kill every survivor with a new test or record it as equivalent with the reason; verify the final report

## 7. Documentation and wrap-up

- [x] 7.1 Update `README.md`: .NET 10, minimal API, no Functions Core Tools, how to run, `Api/openapi.json`, `builder.yaml` deployment and the check scripts; verify by reading it against the commands that were actually run
- [x] 7.2 Run the full suite (`dotnet test`, `npm test`, `npm run test:e2e`, `tests/openapi-build.sh`, `tests/manifest-build.sh`) and confirm all pass
