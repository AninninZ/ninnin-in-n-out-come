import { describe, expect, it } from 'vitest';
import { normalizeAppData } from './appStorage';

describe('app storage normalization', () => {
  it('adds the default payday day when existing saved data has older settings', () => {
    const data = normalizeAppData({
      transactions: [],
      categories: [],
      settings: {
        currency: 'THB',
        dateLocale: 'th-TH',
        schemaVersion: 1,
      },
    });

    expect(data.settings.paydayDay).toBe(1);
  });

  it('keeps a valid payday day from imported data', () => {
    const data = normalizeAppData({
      transactions: [],
      categories: [],
      settings: {
        currency: 'THB',
        dateLocale: 'th-TH',
        paydayDay: 25,
        schemaVersion: 1,
      },
    });

    expect(data.settings.paydayDay).toBe(25);
  });
});
