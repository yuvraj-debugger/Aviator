const { generateCrashPoint } = require('../src/utils/provablyFair');

describe('Provably Fair Algorithm', () => {
  test('should generate consistent crash point for same seeds', () => {
    const serverSeed = 'abc';
    const clientSeed = '123';
    const p1 = generateCrashPoint(serverSeed, clientSeed);
    const p2 = generateCrashPoint(serverSeed, clientSeed);
    expect(p1).toBe(p2);
  });

  test('should generate different points for different seeds', () => {
    const p1 = generateCrashPoint('seed1', 'client1');
    const p2 = generateCrashPoint('seed2', 'client1');
    expect(p1).not.toBe(p2);
  });

  test('should respect the instant crash 1.00x logic', () => {
    // We find a seed that results in intVal % 33 === 0
    // For example, if intVal is 33
    // Since we parseInt(hash.substring(0,8), 16), we can brute force a quick one
    let found = false;
    for (let i = 0; i < 1000; i++) {
        const point = generateCrashPoint('fixed', i.toString());
        if (point === 1.00) {
            found = true;
            break;
        }
    }
    expect(found).toBe(true);
  });

  test('should always return a value >= 1.00', () => {
    for (let i = 0; i < 100; i++) {
        const point = generateCrashPoint(Math.random().toString(), 'test');
        expect(point).toBeGreaterThanOrEqual(1.00);
    }
  });
});
