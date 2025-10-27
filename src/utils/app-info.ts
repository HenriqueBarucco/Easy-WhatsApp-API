import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | null = null;

export function getAppVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  const envVersion = process.env.npm_package_version;
  if (envVersion) {
    cachedVersion = envVersion;
    return cachedVersion;
  }

  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkgContent = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgContent) as { version?: string };
    cachedVersion = pkg.version ?? 'unknown';
  } catch {
    cachedVersion = 'unknown';
  }

  return cachedVersion;
}
