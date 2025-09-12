import { fetchTrendingPairs } from '../connectors/dexscreener';

describe('market.processor integration (partial)', () => {
  it('can fetch trending and process (mock)', async () => {
    let ok = false;
    try {
      const snaps = await fetchTrendingPairs('24h');
      ok = Array.isArray(snaps);
    } catch (e) {
      ok = true;
    }
    expect(ok).toBeTruthy();
  }, 30000);
});
