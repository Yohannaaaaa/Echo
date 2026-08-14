import { NextResponse } from 'next/server';
import { ensureIdentity, setUserCity } from '@/lib/identity';
import { cityByName } from '@/lib/cities';

export async function POST(req: Request) {
  const user = await ensureIdentity();
  const body = await req.json().catch(() => ({}));
  const city = cityByName(body.city);
  if (!city) {
    return NextResponse.json({ error: 'Ville inconnue.' }, { status: 400 });
  }
  await setUserCity(user.id, city.name, city.countryCode);
  return NextResponse.json({ user: { ...user, city: city.name, countryCode: city.countryCode } });
}
