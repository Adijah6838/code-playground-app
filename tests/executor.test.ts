import { describe, it, expect } from 'vitest';
import { executeCode } from '../src/executor';

describe('Code Execution Sandbox', () => {
  it('should execute valid JavaScript and capture console logs', () => {
    const result = executeCode('console.log("Hello"); const x = 5 + 5; x;');
    expect(result.success).toBe(true);
    expect(result.logs).toContain('Hello');
    expect(result.result).toBe('10');
  });

  it('should catch syntax errors and return an error message', () => {
    const result = executeCode('const x = ;');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should timeout infinite loops (security)', () => {
    const result = executeCode('while(true) {}');
    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });
});