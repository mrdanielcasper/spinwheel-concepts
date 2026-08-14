import { openApiSpec } from '../backend/src/openapi';
import fs from 'fs';
import path from 'path';

const outPath = path.resolve(__dirname, 'openapi-spec.json');
fs.writeFileSync(outPath, JSON.stringify(openApiSpec, null, 2));
console.log('Saved openapi-spec.json successfully');
