## Purpose

Defines the `builder.yaml` manifest that tells App Service Builder how to build the Blazor client and the API and which public paths each one owns.

## ADDED Requirements

### Requirement: Manifest location and shape
The repository SHALL contain `builder.yaml` at its root with a `components` list of exactly two components, named `client` and `api`, and no keys other than `name` and `components` at the top level.

#### Scenario: Manifest parses
- **WHEN** `builder.yaml` is parsed as YAML
- **THEN** it has a `components` list with components named `client` and `api`
- **AND** it has no duplicate keys and no top-level keys other than `name` and `components`

### Requirement: Client is static output at the root
The `client` component SHALL be `role: static`, `platform: dotnet`, `platformVersion: "10.0"`, `rootDirectory: Client`, with a custom `build` command that publishes the client into `$DESTINATION_DIR`, `output: wwwroot`, `path: /`, and no `run` block.

#### Scenario: Client component fields
- **WHEN** the `client` component is read
- **THEN** `role` is `static`, `platform` is `dotnet`, `platformVersion` is `"10.0"`, `rootDirectory` is `Client`, `output` is `wwwroot` and `path` is `/`
- **AND** `build` contains `dotnet publish` and `$DESTINATION_DIR`
- **AND** there is no `run` key

### Requirement: API is web compute under /api
The `api` component SHALL be `role: web`, `platform: dotnet`, `platformVersion: "10.0"`, `rootDirectory: Api`, with a custom `build` command that publishes the API into `$DESTINATION_DIR`, `path: /api`, and a `run` block with `port: 8080`, a `start` command that runs `Api.dll` bound to port 8080, and `healthCheckPath: /api/health`.

#### Scenario: API component fields
- **WHEN** the `api` component is read
- **THEN** `role` is `web`, `platform` is `dotnet`, `platformVersion` is `"10.0"`, `rootDirectory` is `Api` and `path` is `/api`
- **AND** `build` contains `dotnet publish` and `$DESTINATION_DIR`
- **AND** `run.port` is 8080, `run.start` runs `Api.dll` with a URL on port 8080, and `run.healthCheckPath` is `/api/health`
- **AND** there is no `output` key

### Requirement: Manifest follows the Builder contract
Every component SHALL use only the documented component keys (`name`, `role`, `platform`, `platformVersion`, `rootDirectory`, `build`, `output`, `run`, `path`) and run keys (`port`, `start`, `healthCheckPath`, `healthCheckStatusCodes`). Component names and paths SHALL be unique, only one component SHALL own `/`, and `rootDirectory` and `output` SHALL be safe relative paths with no `..` segment.

#### Scenario: Contract checks
- **WHEN** each component is inspected
- **THEN** it has no undocumented keys
- **AND** names and paths are unique, exactly one path is `/`
- **AND** no `rootDirectory` or `output` is absolute or contains `..`

### Requirement: Built API serves the health path
The API built by the manifest's `api` build command and started with its `run.start` command SHALL return HTTP 200 at `run.healthCheckPath` on `run.port`.

#### Scenario: Local build-and-run check
- **WHEN** the `api` build command is run locally with `DESTINATION_DIR` set to an empty directory, and `run.start` is run from that directory
- **THEN** `GET http://localhost:8080/api/health` returns 200
