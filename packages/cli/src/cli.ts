#!/usr/bin/env node
import { run } from './index';

try {
  process.exit(run(process.argv.slice(2)));
} catch (e) {
  console.error(`brand-kit: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
