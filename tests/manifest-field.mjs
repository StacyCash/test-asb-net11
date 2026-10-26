// Prints one field of a builder.yaml component: node manifest-field.mjs <manifest> <component> <dotted.field>
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const [manifestPath, name, field] = process.argv.slice(2);
const component = parse(readFileSync(manifestPath, 'utf8'), { uniqueKeys: true })
  .components.find((c) => c.name === name);
const value = field.split('.').reduce((v, key) => v?.[key], component);
if (value === undefined) {
  console.error(`${name}.${field} is not set in ${manifestPath}`);
  process.exit(1);
}
console.log(value);
