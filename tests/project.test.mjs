import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

for (const project of ['Client', 'Api']) {
  test(`${project} targets .NET 10`, () => {
    assert.match(read(`${project}/${project}.csproj`), /<TargetFramework>net10\.0<\/TargetFramework>/);
  });
}

test('the SDK is pinned to released .NET 10', () => {
  const { sdk } = JSON.parse(read('global.json'));
  assert.equal(sdk.version, '10.0.100');
  assert.equal(sdk.rollForward, 'latestFeature');
  assert.equal(sdk.allowPrerelease, false);
});

test('Blazor uses matching .NET 10 packages and the .NET 10 dev server', () => {
  const project = read('Client/Client.csproj');
  for (const name of ['WebAssembly', 'WebAssembly.DevServer']) {
    assert.ok(project.includes(`Include="Microsoft.AspNetCore.Components.${name}" Version="10.0.14"`));
  }
  assert.doesNotMatch(project, /Microsoft\.AspNetCore\.Components\.Gateway/);
  assert.doesNotMatch(project, /StaticWebAssetSpaFallbackEnabled/);
  assert.match(project, /<OverrideHtmlAssetPlaceholders>true<\/OverrideHtmlAssetPlaceholders>/);
});

test('the client entry point uses static asset placeholders', () => {
  const html = read('Client/wwwroot/index.html');
  assert.ok(html.includes('<link rel="preload" id="webassembly" />'));
  assert.ok(html.includes('<script type="importmap"></script>'));
  assert.ok(html.includes('_framework/blazor.webassembly#[.{fingerprint}].js'));
});

test('the solution contains the client, the API and the API tests', () => {
  const solution = read('test-swa-net11.slnx');
  assert.match(solution, /Path="Client\/Client\.csproj"/);
  assert.match(solution, /Path="Api\/Api\.csproj"/);
  assert.match(solution, /Path="Api\.Tests\/Api\.Tests\.csproj"/);
});

test('the API is an ASP.NET Core web app, not an Azure Functions app', () => {
  const project = read('Api/Api.csproj');
  assert.match(project, /<Project Sdk="Microsoft\.NET\.Sdk\.Web">/);
  assert.doesNotMatch(project, /Functions/);
  assert.equal(existsSync(new URL('../Api/host.json', import.meta.url)), false);
});

const manifest = () => parse(read('builder.yaml'), { uniqueKeys: true });
const component = (name) => manifest().components.find((c) => c.name === name);

test('builder.yaml has exactly the client and api components and no other top-level keys', () => {
  const doc = manifest();
  assert.deepEqual(Object.keys(doc).filter((k) => !['name', 'components'].includes(k)), []);
  assert.deepEqual(doc.components.map((c) => c.name), ['client', 'api']);
});

test('builder.yaml rejects duplicate keys', () => {
  assert.throws(() => parse('a: 1\na: 2\n', { uniqueKeys: true }));
});

test('the client is a static .NET 10 publish served at /', () => {
  const client = component('client');
  assert.equal(client.role, 'static');
  assert.equal(client.platform, 'dotnet');
  assert.equal(client.platformVersion, '10.0');
  assert.equal(client.rootDirectory, 'Client');
  assert.equal(client.output, 'wwwroot');
  assert.equal(client.path, '/');
  assert.match(client.build, /dotnet publish/);
  assert.match(client.build, /\$DESTINATION_DIR/);
  assert.equal('run' in client, false);
});

test('the api is .NET 10 web compute under /api with an explicit health path', () => {
  const api = component('api');
  assert.equal(api.role, 'web');
  assert.equal(api.platform, 'dotnet');
  assert.equal(api.platformVersion, '10.0');
  assert.equal(api.rootDirectory, 'Api');
  assert.equal(api.path, '/api');
  assert.match(api.build, /dotnet publish/);
  assert.match(api.build, /\$DESTINATION_DIR/);
  assert.equal(api.run.port, 8080);
  assert.match(api.run.start, /dotnet Api\.dll .*:8080\b/);
  assert.equal(api.run.healthCheckPath, '/api/health');
  assert.equal('output' in api, false);
});

test('every component follows the Builder manifest contract', () => {
  const componentKeys = ['name', 'role', 'platform', 'platformVersion', 'rootDirectory', 'build', 'output', 'run', 'path'];
  const runKeys = ['port', 'start', 'healthCheckPath', 'healthCheckStatusCodes'];
  const { components } = manifest();
  for (const c of components) {
    assert.deepEqual(Object.keys(c).filter((k) => !componentKeys.includes(k)), [], c.name);
    assert.deepEqual(Object.keys(c.run ?? {}).filter((k) => !runKeys.includes(k)), [], c.name);
    for (const rel of [c.rootDirectory, c.output].filter((v) => v !== undefined)) {
      assert.equal(rel.startsWith('/'), false, `${c.name}: ${rel} is absolute`);
      assert.equal(rel.split('/').includes('..'), false, `${c.name}: ${rel} escapes with ..`);
    }
  }
  assert.equal(new Set(components.map((c) => c.name)).size, components.length);
  assert.equal(new Set(components.map((c) => c.path)).size, components.length);
  assert.equal(components.filter((c) => c.path === '/').length, 1);
});
