## Purpose

Defines the HTTP endpoints the API serves to the Blazor client and to the deployment platform's health probes.

## ADDED Requirements

### Requirement: Weather forecasts endpoint
The API SHALL respond to `GET /api/Weather` with HTTP 200 and a JSON array of exactly these five forecasts, in this order, each with `date` (ISO `yyyy-MM-dd`), `temperatureC` and `summary` properties:
`2022-01-06, 1, Freezing`; `2022-01-07, 14, Bracing`; `2022-01-08, -13, Freezing`; `2022-01-09, -16, Balmy`; `2022-01-10, -2, Chilly`.

#### Scenario: Client requests forecasts
- **WHEN** a client sends `GET /api/Weather`
- **THEN** the response status is 200
- **AND** the content type is `application/json`
- **AND** the body is the five forecasts above, in order

#### Scenario: No access key required
- **WHEN** a client sends `GET /api/Weather` with no key, code query parameter or authentication header
- **THEN** the response status is 200

### Requirement: Health endpoint
The API SHALL respond to `GET /api/health` with HTTP 200.

#### Scenario: Health probe
- **WHEN** a client sends `GET /api/health`
- **THEN** the response status is 200

### Requirement: OpenAPI document generated at build
Every build of the API project SHALL write the API's OpenAPI document to `Api/openapi.json`, and that file SHALL be committed to the repository so that changes to the API's contract appear in source control diffs.

#### Scenario: Build produces the document
- **WHEN** `Api/openapi.json` is deleted and the API project is built
- **THEN** `Api/openapi.json` exists after the build
- **AND** it is valid OpenAPI 3 JSON

#### Scenario: Document describes the endpoints
- **WHEN** `Api/openapi.json` is read after a build
- **THEN** it contains a `get` operation for `/api/Weather` whose 200 response is an array of objects with `date`, `temperatureC` and `summary`
- **AND** it contains a `get` operation for `/api/health`

#### Scenario: Committed document matches the code
- **WHEN** the API project is built from a clean checkout
- **THEN** `git diff --exit-code Api/openapi.json` reports no changes

### Requirement: Listening port from configuration
The API SHALL listen on the address given by standard ASP.NET Core URL configuration (`--urls` or `ASPNETCORE_URLS`), so the deployed start command can bind it to port 8080.

#### Scenario: Started with an explicit URL
- **WHEN** the API is started with `--urls http://0.0.0.0:8080`
- **THEN** `GET http://localhost:8080/api/health` returns 200
