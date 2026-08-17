// Phase 1 — BNPL Guardian (multi-country).
//
// Earlier the app implicitly assumed a Saudi-only pay-later market (Tabby /
// Tamara). Both providers actually operate across several currencies, and
// global users need providers relevant to THEIR currency, not Saudi's. This
// file is the single source of truth for "which provider makes sense for
// which currency" — extending to a new market is a one-line addition here,
// nothing else in the app needs to change.

export interface BnplProvider {
  id: string;
  nameEn: string;
  nameAr: string;
  // ISO 4217 currency codes (matching src/currencies.ts) where this
  // provider is a real, operating option for the user.
  currencies: string[];
  color: string;
}

export const BNPL_PROVIDERS: BnplProvider[] = [
  { id: 'tabby',    nameEn: 'Tabby',    nameAr: 'تابي',    currencies: ['SAR', 'AED', 'EGP'], color: '#7C5CFC' },
  { id: 'tamara',   nameEn: 'Tamara',   nameAr: 'تمارا',   currencies: ['SAR', 'AED'],         color: '#00C08B' },
  { id: 'klarna',   nameEn: 'Klarna',   nameAr: 'كلارنا',  currencies: ['EUR', 'GBP', 'USD'],  color: '#FFB3C7' },
  { id: 'afterpay', nameEn: 'Afterpay', nameAr: 'أفترباي', currencies: ['USD', 'GBP'],         color: '#B2FCE4' },
  { id: 'creditcard', nameEn: 'Credit Card', nameAr: 'بطاقة ائتمان', currencies: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP', 'NONE'], color: '#64748B' },
  { id: 'other',    nameEn: 'Other / Manual', nameAr: 'أخرى / يدوي', currencies: ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'EGP', 'NONE'], color: '#94A3B8' },
];

/** Providers relevant to the user's selected currency, always with a manual fallback. */
export function getProvidersForCurrency(currencyCode: string): BnplProvider[] {
  return BNPL_PROVIDERS.filter(p => p.currencies.includes(currencyCode) || p.id === 'other' || p.id === 'creditcard');
}

export function getProvider(providerId: string | undefined): BnplProvider | undefined {
  return BNPL_PROVIDERS.find(p => p.id === providerId);
}
