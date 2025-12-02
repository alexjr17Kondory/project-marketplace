import nodemailer from 'nodemailer';

// Configuración del transporter de nodemailer
const createTransporter = () => {
  // Si hay credenciales de Gmail configuradas
  if (process.env['SMTP_HOST'] && process.env['SMTP_USER']) {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  // Fallback: Ethereal (para desarrollo/testing)
  // Crea una cuenta de prueba automáticamente
  console.log('⚠️ No hay configuración SMTP. Los emails se simularán.');
  return null;
};

export const transporter = createTransporter();

export const EMAIL_FROM = process.env['EMAIL_FROM'] || 'Marketplace <noreply@marketplace.com>';

// Templates de email
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_STATUS_UPDATE: 'order_status_update',
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
} as const;
