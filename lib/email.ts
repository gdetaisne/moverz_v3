import { randomBytes } from 'crypto';

/**
 * Service d'envoi d'emails
 * Utilise Resend (moderne et simple) ou Nodemailer en fallback
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY non configuré, email non envoyé');
    console.log('📧 Email (mode dev):', options);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Moverz <noreply@moverz.fr>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur Resend:', error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Email envoyé via Resend:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
}

/**
 * Génère un token sécurisé pour le lien de continuation
 */
export function generateContinuationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Génère le HTML de l'email de continuation
 */
export function generateContinuationEmailHtml(params: {
  continuationUrl: string;
  projectId: string;
  photosCount: number;
}): string {
  const { continuationUrl, projectId, photosCount } = params;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continuez votre devis Moverz</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
          📦 Moverz
        </h1>
        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
          Votre déménagement simplifié
        </p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
          Bonjour 👋
        </h2>
        
        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
          Vous avez commencé un devis pour votre déménagement. Nous avons sauvegardé votre progression :
        </p>

        <!-- Stats Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600;">
                📊 Votre progression
              </p>
              <p style="margin: 0; color: #666666; font-size: 14px;">
                ✅ <strong>${photosCount}</strong> photo(s) analysée(s)<br>
                📦 Inventaire en cours de validation
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
          Cliquez sur le bouton ci-dessous pour continuer votre devis sur n'importe quel appareil :
        </p>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="${continuationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🚀 Continuer mon devis
              </a>
            </td>
          </tr>
        </table>

        <!-- Link fallback -->
        <p style="margin: 20px 0; color: #999999; font-size: 14px; line-height: 1.6;">
          Ou copiez ce lien dans votre navigateur :<br>
          <a href="${continuationUrl}" style="color: #667eea; word-break: break-all;">
            ${continuationUrl}
          </a>
        </p>

        <!-- Security note -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <tr>
            <td style="padding: 15px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                🔒 <strong>Lien sécurisé</strong><br>
                Ce lien est personnel et expire dans 30 jours. Ne le partagez pas.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
          Vous avez des questions ? Répondez à cet email, nous sommes là pour vous aider ! 💬
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
        <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
          📦 Moverz - Votre déménagement simplifié
        </p>
        <p style="margin: 0; color: #cccccc; font-size: 12px;">
          ${new Date().getFullYear()} Moverz. Tous droits réservés.
        </p>
      </td>
    </tr>
  </table>

  <!-- Debug info (dev only) -->
  ${process.env.NODE_ENV === 'development' ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f8f9fa; border: 2px dashed #dee2e6;">
    <tr>
      <td>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; font-weight: 600;">🔧 DEBUG INFO (dev only)</p>
        <p style="margin: 0; color: #999; font-size: 11px; font-family: monospace;">
          Project ID: ${projectId}<br>
          Photos: ${photosCount}<br>
          Token: ${continuationUrl.split('token=')[1]?.substring(0, 20)}...
        </p>
      </td>
    </tr>
  </table>
  ` : ''}
</body>
</html>
  `.trim();
}

