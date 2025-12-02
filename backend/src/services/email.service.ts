import { transporter, EMAIL_FROM } from '../config/email';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
}

export interface StatusUpdateEmailData {
  orderNumber: string;
  customerName: string;
  newStatus: string;
  statusLabel: string;
  trackingNumber?: string;
  trackingUrl?: string;
  message?: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

/**
 * Enviar email genérico
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    console.log(`📧 [SIMULADO] Email a ${options.to}: ${options.subject}`);
    console.log(`   Contenido: ${options.text || options.html.substring(0, 100)}...`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`✅ Email enviado a ${options.to}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando email a ${options.to}:`, error);
    return false;
  }
}

/**
 * Enviar confirmación de pedido
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
        .total { font-size: 1.2em; font-weight: bold; color: #f97316; }
        .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Gracias por tu pedido!</h1>
          <p>Pedido #${data.orderNumber}</p>
        </div>
        <div class="content">
          <p>Hola <strong>${data.customerName}</strong>,</p>
          <p>Hemos recibido tu pedido y lo estamos procesando. Aquí está el resumen:</p>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;">Subtotal:</td>
                <td style="padding: 10px; text-align: right;">$${data.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;">Envío:</td>
                <td style="padding: 10px; text-align: right;">$${data.shipping.toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 10px; text-align: right;" class="total">$${data.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <h3>Dirección de envío:</h3>
          <p>${data.shippingAddress}</p>

          <h3>Método de pago:</h3>
          <p>${data.paymentMethod}</p>

          <p style="margin-top: 20px;">Te notificaremos cuando tu pedido sea enviado.</p>
        </div>
        <div class="footer">
          <p>Si tienes preguntas, responde a este email.</p>
          <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} Marketplace</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `Confirmación de pedido #${data.orderNumber}`,
    html,
    text: `Gracias por tu pedido #${data.orderNumber}. Total: $${data.total.toLocaleString()}`,
  });
}

/**
 * Enviar actualización de estado del pedido
 */
export async function sendOrderStatusUpdate(
  email: string,
  data: StatusUpdateEmailData
): Promise<boolean> {
  let trackingInfo = '';
  if (data.trackingNumber) {
    trackingInfo = `
      <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #0369a1;">Información de seguimiento</h3>
        <p style="margin: 0;"><strong>Número de guía:</strong> ${data.trackingNumber}</p>
        ${data.trackingUrl ? `<p style="margin: 5px 0 0 0;"><a href="${data.trackingUrl}" style="color: #0369a1;">Rastrear mi pedido</a></p>` : ''}
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .status-badge { display: inline-block; background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Actualización de tu pedido</h1>
          <p>Pedido #${data.orderNumber}</p>
        </div>
        <div class="content">
          <p>Hola <strong>${data.customerName}</strong>,</p>
          <p>El estado de tu pedido ha sido actualizado:</p>

          <p style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${data.statusLabel}</span>
          </p>

          ${data.message ? `<p>${data.message}</p>` : ''}

          ${trackingInfo}

          <p style="margin-top: 20px;">Gracias por tu compra.</p>
        </div>
        <div class="footer">
          <p>Si tienes preguntas, responde a este email.</p>
          <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} Marketplace</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Tu pedido #${data.orderNumber} - ${data.statusLabel}`,
    html,
    text: `Tu pedido #${data.orderNumber} ahora está: ${data.statusLabel}`,
  });
}

/**
 * Enviar email de restablecimiento de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  data: PasswordResetEmailData
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Restablecer contraseña</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${data.userName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

          <p style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Restablecer contraseña</a>
          </p>

          <div class="warning">
            <p style="margin: 0;"><strong>⚠️ Este enlace expira en ${data.expiresIn}.</strong></p>
          </div>

          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>

          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${data.resetUrl}" style="word-break: break-all;">${data.resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} Marketplace</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Restablecer tu contraseña - Marketplace',
    html,
    text: `Hola ${data.userName}, usa este enlace para restablecer tu contraseña: ${data.resetUrl}. Expira en ${data.expiresIn}.`,
  });
}

/**
 * Enviar email de bienvenida
 */
export async function sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; }
        .footer { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Bienvenido a Marketplace!</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Gracias por registrarte! Tu cuenta ha sido creada exitosamente.</p>

          <p>Ahora puedes:</p>
          <ul>
            <li>Explorar nuestros productos</li>
            <li>Personalizar tus diseños</li>
            <li>Realizar pedidos</li>
            <li>Rastrear tus envíos</li>
          </ul>

          <p style="text-align: center;">
            <a href="${process.env['FRONTEND_URL'] || 'http://localhost:5173'}" class="button">Ir a la tienda</a>
          </p>
        </div>
        <div class="footer">
          <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} Marketplace</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '¡Bienvenido a Marketplace!',
    html,
    text: `Hola ${userName}, bienvenido a Marketplace. Tu cuenta ha sido creada exitosamente.`,
  });
}
