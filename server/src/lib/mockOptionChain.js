// Generates a realistic-looking mock Nifty option chain so we can build the
// whole app WITHOUT paying for a live market-data feed during the hackathon.
// Phase 2 uses this; later you can swap this one function for a real API call
// (e.g. an NSE/broker feed) and nothing else needs to change.

export function getMockOptionChain(spot = 22500, step = 100, strikes = 11) {
  const half = Math.floor(strikes / 2);
  const chain = [];
  for (let i = -half; i <= half; i++) {
    const strike = spot + i * step;
    // Open interest tends to bunch up around round strikes — fake that shape.
    const distance = Math.abs(i);
    const callOI = Math.round((half - distance + 1) * 1500 + Math.random() * 800);
    const putOI = Math.round((half - distance + 1) * 1700 + Math.random() * 800);
    chain.push({
      strike,
      call: { oi: callOI, iv: +(12 + distance * 0.6 + Math.random()).toFixed(2) },
      put: { oi: putOI, iv: +(13 + distance * 0.6 + Math.random()).toFixed(2) },
    });
  }
  return { underlying: "NIFTY", spot, generatedAt: new Date().toISOString(), chain };
}
