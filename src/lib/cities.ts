export type City = {
  name: string;
  countryCode: string;
  flag: string;
};

export const CITIES: City[] = [
  { name: 'Paris', countryCode: 'FR', flag: '🇫🇷' },
  { name: 'Istanbul', countryCode: 'TR', flag: '🇹🇷' },
  { name: 'Tokyo', countryCode: 'JP', flag: '🇯🇵' },
  { name: 'São Paulo', countryCode: 'BR', flag: '🇧🇷' },
  { name: 'New York', countryCode: 'US', flag: '🇺🇸' },
  { name: 'Londres', countryCode: 'GB', flag: '🇬🇧' },
  { name: 'Berlin', countryCode: 'DE', flag: '🇩🇪' },
  { name: 'Séoul', countryCode: 'KR', flag: '🇰🇷' },
  { name: 'Mexico', countryCode: 'MX', flag: '🇲🇽' },
  { name: 'Lagos', countryCode: 'NG', flag: '🇳🇬' },
  { name: 'Le Caire', countryCode: 'EG', flag: '🇪🇬' },
  { name: 'Mumbai', countryCode: 'IN', flag: '🇮🇳' },
  { name: 'Buenos Aires', countryCode: 'AR', flag: '🇦🇷' },
  { name: 'Montréal', countryCode: 'CA', flag: '🇨🇦' },
  { name: 'Sydney', countryCode: 'AU', flag: '🇦🇺' },
  { name: 'Lisbonne', countryCode: 'PT', flag: '🇵🇹' },
  { name: 'Amsterdam', countryCode: 'NL', flag: '🇳🇱' },
  { name: 'Dakar', countryCode: 'SN', flag: '🇸🇳' },
  { name: 'Bangkok', countryCode: 'TH', flag: '🇹🇭' },
  { name: 'Beyrouth', countryCode: 'LB', flag: '🇱🇧' },
];

export function cityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

export function flagFor(countryCode: string): string {
  return CITIES.find((c) => c.countryCode === countryCode)?.flag ?? '🌍';
}

export function randomCityExcluding(excludeName?: string): City {
  const pool = excludeName ? CITIES.filter((c) => c.name !== excludeName) : CITIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const MOODS = [
  { key: 'insomnie', emoji: '🌙', label: 'Insomnie' },
  { key: 'nostalgie', emoji: '🍂', label: 'Nostalgie' },
  { key: 'joie', emoji: '✨', label: 'Joie' },
  { key: 'amour', emoji: '💛', label: 'Amour' },
  { key: 'tristesse', emoji: '🌧️', label: 'Tristesse' },
  { key: 'espoir', emoji: '🌱', label: 'Espoir' },
  { key: 'colere', emoji: '🔥', label: 'Colère' },
  { key: 'calme', emoji: '🌊', label: 'Calme' },
] as const;

export function moodEmoji(key: string): string {
  return MOODS.find((m) => m.key === key)?.emoji ?? '🎵';
}
