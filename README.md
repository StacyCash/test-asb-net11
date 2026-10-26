# Static Web Apps .NET 11 test application

This solution uses .NET 11 RC3 (prerelease), pinned in `global.json`.
Install SDK **11.0.100-rc.3.26522.148** and Azure Functions Core Tools **4.16.0**
or later.

`test-swa-net11.slnx` contains two independent projects:

- `Client/`: standalone Blazor WebAssembly, using the .NET 11 Components
  Gateway development server and fingerprinted static assets in `wwwroot/`.
- `Api/`: Azure Functions v4 isolated worker using `Azure.Functions.Sdk/1.0.1`
  with ASP.NET Core HTTP integration.
  Its host configuration remains in `host.json`; do not move it into `wwwroot/`.

## Build and run

```sh
dotnet build test-swa-net11.slnx
cp Api/local.settings.json.example Api/local.settings.json
dotnet run --project Client --launch-profile http
```

In a second terminal:

```sh
cd Api
func start --port 7041
```

The client runs at `http://localhost:5009`; the API is independently accessible at
`http://localhost:7041/api/Weather` and returns five fixed weather forecasts.
The client's Weather page intentionally requests `/api/Weather` on its own origin.
It fails when run outside Azure Static Web Apps because the API proxy is absent.
No local proxy or CORS workaround is added.

The vendored Bootstrap distribution under `Client/wwwroot/lib/` is version 5.3.8.

The Azure deployment host must support the .NET 11 isolated worker runtime.
Local validation does not establish .NET 11 support for managed Static Web Apps APIs.

## Regression checks

Node.js 22 or later is required for the test tooling.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:e2e
```

Playwright starts both projects automatically (or reuses existing local servers).
It verifies the rendered home page, interactive counter, exact API response, and
the expected Weather-page failure without Static Web Apps routing.
