import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { propagateEchoes, getJourney } from '@/lib/echoes';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureIdentity();
  await propagateEchoes();
  const { id } = await params;
  const journey = await getJourney(id);
  if (!journey) return NextResponse.json({ error: 'Écho introuvable.' }, { status: 404 });
  return NextResponse.json(journey);
}
