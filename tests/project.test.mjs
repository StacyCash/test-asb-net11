import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

for (const project of ['Client', 'Api']) {
  test(`${project} targets .NET 11`, () => {
    assert.match(read(`${project}/${project}.csproj`), /<TargetFramework>net11\.0<\/TargetFramework>/);
  });
}

test('the SDK is pinned to .NET 11 with prerelease selection enabled', () => {
  const { sdk } = JSON.parse(read('global.json'));
  assert.match(sdk.version, /^11\.0\.100-rc\.3\./);
  assert.equal(sdk.allowPrerelease, true);
});

test('Blazor uses matching .NET 11 packages and SDK-provided hot reload', () => {
  const project = read('Client/Client.csproj');
  for (const name of ['WebAssembly', 'Gateway']) {
    assert.ok(project.includes(`Include="Microsoft.AspNetCore.Components.${name}" Version="11.0.0-rc.3.26522.148"`));
  }
  assert.doesNotMatch(project, /Microsoft\.DotNet\.HotReload\.WebAssembly\.Browser/);
  assert.doesNotMatch(project, /Microsoft\.AspNetCore\.Components\.WebAssembly\.DevServer/);
  assert.match(project, /<OverrideHtmlAssetPlaceholders>true<\/OverrideHtmlAssetPlaceholders>/);
  assert.match(project, /<StaticWebAssetSpaFallbackEnabled>true<\/StaticWebAssetSpaFallbackEnabled>/);
});

test('the client entry point uses .NET 11 static asset placeholders', () => {
  const html = read('Client/wwwroot/index.html');
  assert.ok(html.includes('<link rel="preload" id="webassembly" />'));
  assert.ok(html.includes('<script type="importmap"></script>'));
  assert.ok(html.includes('_framework/blazor.webassembly#[.{fingerprint}].js'));
});

test('the solution contains the separate client and Functions API', () => {
  const solution = read('test-swa-net11.slnx');
  assert.match(solution, /Path="Client\/Client\.csproj"/);
  assert.match(solution, /Path="Api\/Api\.csproj"/);
});

test('the API uses the .NET 11-compatible Functions MSBuild SDK', () => {
  const project = read('Api/Api.csproj');
  assert.match(project, /<Project Sdk="Azure\.Functions\.Sdk\/1\.0\.1">/);
  assert.doesNotMatch(project, /PackageReference Include="Microsoft\.Azure\.Functions\.Worker\.Sdk"/);
});
