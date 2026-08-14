import { NextResponse } from 'next/server';
import { ensureIdentity } from '@/lib/identity';
import { propagateEchoes, getJourney } from '@/lib/echoes';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await ensureIdentity();
  await propagateEchoes();
  const { id } = await params;
  const journey = await getJourney(id);
  if (!journey) return NextResponse.json({ error: 'Écho introuvable.' }, { status: 404 });
  const hops = journey.hops.map((h) => ({ ...h, isMine: h.recipient_id === user.id }));
  return NextResponse.json({ echo: journey.echo, hops });
}
