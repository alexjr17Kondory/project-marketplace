import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Transporter lazy-loaded (se crea en el primer uso, después de cargar .env)
let _transporter: Transporter | null | undefined;

const getTransporter = (): Transporter | null => {
  // Si ya fue inicializado, retornarlo
  if (_transporter !== undefined) {
    return _transporter;
  }

  // Si hay credenciales de Gmail configuradas
  if (process.env['SMTP_HOST'] && process.env['SMTP_USER']) {
    console.log('✅ Configuración SMTP cargada correctamente');
    _transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
    return _transporter;
  }

  // Fallback: sin SMTP configurado
  console.log('⚠️ No hay configuración SMTP. Los emails se simularán.');
  _transporter = null;
  return _transporter;
};

// Getter para el transporter (lazy)
export const transporter = {
  get instance(): Transporter | null {
    return getTransporter();
  }
};

export const getEmailFrom = (): string => {
  return process.env['EMAIL_FROM'] || 'Marketplace <noreply@marketplace.com>';
};

// Templates de email
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_STATUS_UPDATE: 'order_status_update',
  PASSWORD_RESET: 'password_reset',
  WELCOME: 'welcome',
} as const;
