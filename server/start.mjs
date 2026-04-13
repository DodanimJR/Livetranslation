/**
 * cPanel Node.js Selector startup file.
 *
 * cPanel requires a plain .js or .mjs entry point. This file registers
 * the tsx ESM loader so Node.js can import the TypeScript backend files
 * directly without a separate build step.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('tsx/esm', pathToFileURL('./'));

const { default: _ } = await import('./index.ts');
