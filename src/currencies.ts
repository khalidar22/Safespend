export interface Currency {
  code: string;       // ISO 4217, e.g. 'SAR'
  nameAr: string;
  nameEn: string;
  symbolAr: string;   // ما يُلحق بالرقم بالعربية
  symbolEn: string;   // ما يُلحق بالرقم بالإنجليزية
}

export const CURRENCIES: Currency[] = [
  { code: 'SAR', nameAr: 'ريال سعودي',    nameEn: 'Saudi Riyal',   symbolAr: 'ريال', symbolEn: 'SAR' },
  { code: 'USD', nameAr: 'دولار أمريكي',   nameEn: 'US Dollar',     symbolAr: 'دولار', symbolEn: 'USD' },
  { code: 'EUR', nameAr: 'يورو',           nameEn: 'Euro',          symbolAr: 'يورو', symbolEn: 'EUR' },
  { code: 'GBP', nameAr: 'جنيه إسترليني',  nameEn: 'British Pound', symbolAr: 'ج.إ', symbolEn: 'GBP' },
  { code: 'AED', nameAr: 'درهم إماراتي',   nameEn: 'UAE Dirham',    symbolAr: 'درهم', symbolEn: 'AED' },
  { code: 'EGP', nameAr: 'جنيه مصري',      nameEn: 'Egyptian Pound',symbolAr: 'ج.م', symbolEn: 'EGP' },
  { code: 'NONE', nameAr: 'بلا عملة (أرقام فقط)', nameEn: 'No currency (numbers only)', symbolAr: '', symbolEn: '' },
];

export function getCurrency(code: string): Currency {
  // M29 fix: an unrecognized code (corrupted localStorage, a bad imported
  // backup file, or a currency code added in a future version and then
  // opened in an older build) used to fall back to CURRENCIES[0] = SAR
  // silently. Silently assuming SAR is worse than showing no currency at
  // all -- it confidently displays the WRONG currency symbol on every
  // amount in the app with no indication anything is off. Falling back to
  // the explicit "NONE" entry instead means an unrecognized code shows
  // plain numbers (still correct/readable) rather than a false currency.
  return CURRENCIES.find(c => c.code === code) || CURRENCIES.find(c => c.code === 'NONE')!;
}
