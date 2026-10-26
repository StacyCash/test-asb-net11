# .NET 10 Blazor client and minimal API for App Service Builder

This solution targets .NET 10, pinned in `global.json` (SDK `10.0.100` or any later
10.0 feature band). Node.js 22 or later is required for the test tooling.

`test-swa-net11.slnx` contains three projects:

- `Client/`: standalone Blazor WebAssembly with fingerprinted static assets in `wwwroot/`.
- `Api/`: ASP.NET Core minimal API.
  - `GET /api/Weather` returns five fixed weather forecasts.
  - `GET /api/health` returns 200.
- `Api.Tests/`: xUnit tests that host the API in-process.

## Build and run

```sh
dotnet build test-swa-net11.slnx
dotnet run --project Client --launch-profile http
```

In a second terminal:

```sh
dotnet run --project Api --launch-profile http
```

The client runs at `http://localhost:5009`. The API runs separately at
`http://localhost:7041/api/Weather`. The client's Weather page requests `/api/Weather`
on its own origin, so it fails locally: no local proxy or CORS workaround is added.
When deployed, App Service Builder routes `/api` to the API on the same origin.

The vendored Bootstrap distribution under `Client/wwwroot/lib/` is version 5.3.8.

## OpenAPI document

Every build of `Api` writes the API's OpenAPI document to `Api/openapi.json`. The file
is committed so API contract changes show up in diffs; commit it whenever it changes.

## Deployment

`builder.yaml` is the App Service Builder manifest:

| Component | Role   | Source    | Build                                              | Public path |
|-----------|--------|-----------|----------------------------------------------------|-------------|
| `client`  | static | `Client/` | `dotnet publish`, serves `wwwroot` from the output | `/`         |
| `api`     | web    | `Api/`    | `dotnet publish`, runs `dotnet Api.dll` on 8080    | `/api`      |

Deployment health is checked at `/api/health`, which must return exactly 200.

## Checks

```sh
npm ci
npx playwright install chromium
dotnet test Api.Tests          # API endpoints, in-process
npm test                       # project settings and builder.yaml contract
npm run test:e2e               # Playwright: client, API and the local Weather failure
tests/openapi-build.sh         # build writes Api/openapi.json with both endpoints
tests/manifest-build.sh        # builds and starts the api with builder.yaml's own commands, probes the health path
dotnet tool restore
(cd Api.Tests && dotnet stryker --project Api.csproj)   # Stryker.NET mutation testing
```

Playwright starts both projects automatically (or reuses existing local servers).
