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
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}
