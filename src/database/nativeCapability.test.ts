import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('permissões nativas do banco', () => {
  it('permite as escritas locais usadas pelos repositórios', () => {
    const capabilityPath = resolve('src-tauri/capabilities/default.json');
    const capability = JSON.parse(readFileSync(capabilityPath, 'utf8')) as {
      permissions: string[];
    };

    expect(capability.permissions).toContain('sql:default');
    expect(capability.permissions).toContain('sql:allow-execute');
  });
});
