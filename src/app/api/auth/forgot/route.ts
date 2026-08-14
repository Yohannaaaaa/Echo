import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/identity';
import { sendPasswordResetEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim();
  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
  }

  const token = await requestPasswordReset(email);
  if (token) {
    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  // Always a generic success message — never reveals whether this email has an account.
  return NextResponse.json({ ok: true });
}
