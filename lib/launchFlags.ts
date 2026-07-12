// lib/launchFlags.ts
//
// In-memory flags scoped to a single cold JS launch. They reset to false on a
// fresh launch (module re-evaluation), which is exactly the "once per cold app
// open" semantics the gift popup needs — no MMKV persistence wanted here.

let _giftShown = false;
let _firstRunPaywallSeen = false;

export const launchFlags = {
  get giftShown(): boolean { return _giftShown; },
  markGiftShown(): void { _giftShown = true; },

  get firstRunPaywallSeen(): boolean { return _firstRunPaywallSeen; },
  markFirstRunPaywallSeen(): void { _firstRunPaywallSeen = true; },
};
