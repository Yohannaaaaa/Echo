import nodemailer from 'nodemailer';

const SUPPORT_EMAIL = 'support.hejecho@gmail.com';

function getTransport() {
  const user = process.env.GMAIL_USER || SUPPORT_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transport = getTransport();
  if (!transport) {
    console.error('GMAIL_APP_PASSWORD manquant — impossible d’envoyer l’email de réinitialisation.');
    return false;
  }

  await transport.sendMail({
    from: `ECHO <${SUPPORT_EMAIL}>`,
    to,
    subject: 'Réinitialise ton mot de passe ECHO',
    text: `Quelqu'un (probablement toi) a demandé à réinitialiser le mot de passe de ton identité ECHO.\n\nClique sur ce lien dans les 60 prochaines minutes pour choisir un nouveau mot de passe :\n${resetUrl}\n\nSi ce n'était pas toi, ignore simplement cet email — rien ne change.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <p>Quelqu'un (probablement toi) a demandé à réinitialiser le mot de passe de ton identité <strong>ECHO</strong>.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#7c5cff;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="font-size:13px;color:#666;">Ce lien expire dans 60 minutes. Si ce n'était pas toi, ignore cet email — rien ne change.</p>
      </div>
    `,
  });
  return true;
}
