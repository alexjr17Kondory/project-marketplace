import { transporter, getEmailFrom } from '../config/email';
import { prisma } from '../config/database';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

/**
 * Convertir imagen base64 a escala de grises para impresión térmica
 */
async function convertToGrayscale(base64Image: string): Promise<Buffer> {
  // Extraer el contenido base64 sin el prefijo data:image/...
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Convertir a escala de grises usando sharp
  const grayscaleBuffer = await sharp(imageBuffer)
    .grayscale()
    .png() // Convertir a PNG para mejor compatibilidad con PDFKit
    .toBuffer();

  return grayscaleBuffer;
}

// Cache de branding (expira cada 5 minutos)
let brandingCache: { data: BrandingData; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export interface FiscalData {
  nit?: string;
  taxRegime?: string;
  legalName?: string;
}

export interface BrandingData {
  primary: string;
  secondary: string;
  buttonColor: string;
  storeName: string;
  logo: string;
  slogan: string;
  contactEmail: string;
  contactPhone: string;
  fiscal: FiscalData;
}

/**
 * Obtener datos de branding desde la configuración
 */
async function getBrandColors(): Promise<BrandingData> {
  // Verificar cache
  if (brandingCache && Date.now() - brandingCache.timestamp < CACHE_TTL) {
    return brandingCache.data;
  }

  // Valores por defecto
  const defaultBranding: BrandingData = {
    primary: '#4f46e5',
    secondary: '#9333ea',
    buttonColor: '#ea580c',
    storeName: 'Marketplace',
    logo: '',
    slogan: '',
    contactEmail: '',
    contactPhone: '',
    fiscal: {},
  };

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['general_settings', 'appearance_settings'] },
      },
    });

    const branding = { ...defaultBranding };

    settings.forEach((s) => {
      if (s.key === 'general_settings' && typeof s.value === 'object' && s.value !== null) {
        const general = s.value as Record<string, unknown>;
        if (general.siteName) branding.storeName = String(general.siteName);
        if (general.logo) branding.logo = String(general.logo);
        if (general.slogan) branding.slogan = String(general.slogan);
        if (general.contactEmail) branding.contactEmail = String(general.contactEmail);
        if (general.contactPhone) branding.contactPhone = String(general.contactPhone);
        // Datos fiscales
        if (general.fiscal && typeof general.fiscal === 'object') {
          const fiscal = general.fiscal as Record<string, unknown>;
          branding.fiscal = {
            nit: fiscal.nit ? String(fiscal.nit) : undefined,
            taxRegime: fiscal.taxRegime ? String(fiscal.taxRegime) : undefined,
            legalName: fiscal.legalName ? String(fiscal.legalName) : undefined,
          };
        }
      }
      if (s.key === 'appearance_settings' && typeof s.value === 'object' && s.value !== null) {
        const appearance = s.value as Record<string, unknown>;
        if (appearance.buttonColor) branding.buttonColor = String(appearance.buttonColor);
        if (appearance.brandColors && typeof appearance.brandColors === 'object') {
          const colors = appearance.brandColors as Record<string, string>;
          if (colors.primary) branding.primary = colors.primary;
          if (colors.secondary) branding.secondary = colors.secondary;
        }
      }
    });

    // Actualizar cache
    brandingCache = { data: branding, timestamp: Date.now() };

    return branding;
  } catch (error) {
    console.error('Error obteniendo datos de branding:', error);
    return defaultBranding;
  }
}

/**
 * Generar header del email con logo y título
 */
function generateEmailHeader(brand: BrandingData, title: string, subtitle?: string): string {
  const logoHtml = brand.logo
    ? `<img src="${brand.logo}" alt="${brand.storeName}" style="max-height: 60px; margin-bottom: 15px;" />`
    : '';

  const subtitleHtml = subtitle
    ? `<p style="margin: 10px 0 0 0; opacity: 0.9;">${subtitle}</p>`
    : '';

  return `
    <div style="background: linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      ${logoHtml}
      <h1 style="margin: 0; font-size: 24px;">${title}</h1>
      ${subtitleHtml}
    </div>
  `;
}

/**
 * Generar footer del email
 */
function generateEmailFooter(brand: BrandingData): string {
  const contactInfo = brand.contactEmail || brand.contactPhone
    ? `<p style="margin: 0 0 10px 0;">¿Tienes preguntas? Contáctanos${brand.contactEmail ? ` en <a href="mailto:${brand.contactEmail}" style="color: ${brand.primary};">${brand.contactEmail}</a>` : ''}${brand.contactPhone ? ` o al ${brand.contactPhone}` : ''}</p>`
    : '<p style="margin: 0 0 10px 0;">Si tienes preguntas, responde a este email.</p>';

  return `
    <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
      ${contactInfo}
      <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${brand.storeName}${brand.slogan ? ` - ${brand.slogan}` : ''}</p>
    </div>
  `;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
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
  const emailTransporter = transporter.instance;

  if (!emailTransporter) {
    console.log(`📧 [SIMULADO] Email a ${options.to}: ${options.subject}`);
    console.log(`   Contenido: ${options.text || options.html.substring(0, 100)}...`);
    if (options.attachments?.length) {
      console.log(`   Adjuntos: ${options.attachments.map((a) => a.filename).join(', ')}`);
    }
    return true;
  }

  try {
    // Convertir attachments al formato de nodemailer
    const nodemailerAttachments = options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }));

    await emailTransporter.sendMail({
      from: getEmailFrom(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: nodemailerAttachments,
    });
    console.log(`✅ Email enviado a ${options.to}${options.attachments?.length ? ` con ${options.attachments.length} adjunto(s)` : ''}`);
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
  const brand = await getBrandColors();

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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${generateEmailHeader(brand, '¡Gracias por tu pedido!', `Pedido #${data.orderNumber}`)}
        <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
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
                <td style="padding: 10px; text-align: right; font-size: 1.2em; font-weight: bold; color: ${brand.buttonColor};">$${data.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <h3>Dirección de envío:</h3>
          <p>${data.shippingAddress}</p>

          <h3>Método de pago:</h3>
          <p>${data.paymentMethod}</p>

          <p style="margin-top: 20px;">Te notificaremos cuando tu pedido sea enviado.</p>
        </div>
        ${generateEmailFooter(brand)}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.customerEmail,
    subject: `Confirmación de pedido #${data.orderNumber} - ${brand.storeName}`,
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
  const brand = await getBrandColors();

  let trackingInfo = '';
  if (data.trackingNumber) {
    trackingInfo = `
      <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: ${brand.primary};">Información de seguimiento</h3>
        <p style="margin: 0;"><strong>Número de guía:</strong> ${data.trackingNumber}</p>
        ${data.trackingUrl ? `<p style="margin: 5px 0 0 0;"><a href="${data.trackingUrl}" style="color: ${brand.primary};">Rastrear mi pedido</a></p>` : ''}
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${generateEmailHeader(brand, 'Actualización de tu pedido', `Pedido #${data.orderNumber}`)}
        <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
          <p>Hola <strong>${data.customerName}</strong>,</p>
          <p>El estado de tu pedido ha sido actualizado:</p>

          <p style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; background: ${brand.buttonColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">${data.statusLabel}</span>
          </p>

          ${data.message ? `<p>${data.message}</p>` : ''}

          ${trackingInfo}

          <p style="margin-top: 20px;">Gracias por tu compra.</p>
        </div>
        ${generateEmailFooter(brand)}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Tu pedido #${data.orderNumber} - ${data.statusLabel} | ${brand.storeName}`,
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
  const brand = await getBrandColors();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${generateEmailHeader(brand, 'Restablecer contraseña')}
        <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
          <p>Hola <strong>${data.userName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

          <p style="text-align: center;">
            <a href="${data.resetUrl}" style="display: inline-block; background: ${brand.buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Restablecer contraseña</a>
          </p>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Este enlace expira en ${data.expiresIn}.</strong></p>
          </div>

          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>

          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${data.resetUrl}" style="word-break: break-all; color: ${brand.primary};">${data.resetUrl}</a>
          </p>
        </div>
        ${generateEmailFooter(brand)}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Restablecer tu contraseña - ${brand.storeName}`,
    html,
    text: `Hola ${data.userName}, usa este enlace para restablecer tu contraseña: ${data.resetUrl}. Expira en ${data.expiresIn}.`,
  });
}

/**
 * Enviar email de bienvenida
 */
export async function sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
  const brand = await getBrandColors();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${generateEmailHeader(brand, `¡Bienvenido a ${brand.storeName}!`)}
        <div style="background: #fff; padding: 30px; border: 1px solid #eee;">
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
            <a href="${process.env['FRONTEND_URL'] || 'http://localhost:5173'}" style="display: inline-block; background: ${brand.buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">Ir a la tienda</a>
          </p>
        </div>
        ${generateEmailFooter(brand)}
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `¡Bienvenido a ${brand.storeName}!`,
    html,
    text: `Hola ${userName}, bienvenido a ${brand.storeName}. Tu cuenta ha sido creada exitosamente.`,
  });
}

/**
 * Datos para email de factura POS
 */
export interface POSInvoiceEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: Date;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashAmount?: number;
  cardAmount?: number;
  change?: number;
  sellerName: string;
}

/**
 * Obtener etiqueta de régimen tributario
 */
function getTaxRegimeLabel(taxRegime?: string): string {
  switch (taxRegime) {
    case 'responsable_iva':
      return 'Responsable de IVA';
    case 'no_responsable':
      return 'No Responsable de IVA';
    case 'regimen_simple':
      return 'Régimen Simple de Tributación';
    default:
      return '';
  }
}

/**
 * Formatear moneda COP
 */
function formatCurrencyPDF(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

/**
 * Convertir mm a puntos (1mm = 2.83465 puntos)
 */
function mmToPoints(mm: number): number {
  return mm * 2.83465;
}

/**
 * Generar PDF de factura POS (formato ticket configurable)
 */
async function generateInvoicePDF(
  data: POSInvoiceEmailData,
  brand: BrandingData,
  printSettings?: {
    ticketWidth?: number;
    ticketMargins?: { top: number; right: number; bottom: number; left: number };
    fontSize?: 'small' | 'medium' | 'large';
    showLogo?: boolean;
    showStoreName?: boolean;
    showNit?: boolean;
    ticketLogo?: string;
  }
): Promise<Buffer> {
  // Preparar el logo en escala de grises si existe y está habilitado
  let logoBuffer: Buffer | null = null;
  const showLogo = printSettings?.showLogo ?? true;
  const logoSource = printSettings?.ticketLogo || brand.logo;

  if (showLogo && logoSource && logoSource.startsWith('data:image')) {
    try {
      logoBuffer = await convertToGrayscale(logoSource);
    } catch (error) {
      console.error('Error convirtiendo logo a escala de grises:', error);
      // Continuar sin logo si hay error
    }
  }

  return new Promise((resolve, reject) => {
    try {
      // Usar configuración de impresión o valores por defecto (80mm)
      const ticketWidthMm = printSettings?.ticketWidth || 80;
      const ticketWidth = mmToPoints(ticketWidthMm); // Convertir mm a puntos
      const margins = printSettings?.ticketMargins || { top: 5, right: 5, bottom: 10, left: 5 };
      const margin = mmToPoints(margins.left);
      const marginRight = mmToPoints(margins.right);
      const contentWidth = ticketWidth - margin - marginRight;

      // Opciones de visibilidad del header (por defecto true para compatibilidad)
      const showStoreName = printSettings?.showStoreName ?? true;
      const showNit = printSettings?.showNit ?? true;

      // Calcular altura estimada del documento más precisa para ahorrar papel
      // Logo: ~40 si existe
      // Header (tienda, fiscal, separador): ~80 (ajustar según opciones)
      // Factura título + número: ~40
      // Info (fecha, cliente, vendedor): ~50
      // Items: ~30 por item
      // Totales: ~70
      // Pago + cambio: ~60
      // Footer (gracias, tel, generado): ~50
      // Margen inferior: ~15
      const logoHeight = logoBuffer ? 45 : 0; // altura del logo si existe
      const headerHeight = logoHeight + (showStoreName ? 18 : 0) + (showNit ? 30 : 0) + 15;
      const baseHeight = 200 + headerHeight; // Contenido fijo sin items
      const itemHeight = 30; // Por cada item (más preciso)
      const paymentExtraHeight = (data.cashAmount && data.cashAmount > 0 ? 11 : 0) +
                                 (data.cardAmount && data.cardAmount > 0 ? 11 : 0) +
                                 (data.change && data.change > 0 ? 30 : 0);
      const discountTaxHeight = (data.discount > 0 ? 11 : 0) + (data.tax > 0 ? 11 : 0);
      const estimatedHeight = baseHeight + data.items.length * itemHeight + paymentExtraHeight + discountTaxHeight + 20;

      const doc = new PDFDocument({
        size: [ticketWidth, Math.max(estimatedHeight, 250)], // Mínimo reducido para ahorrar papel
        margin: margin,
        info: {
          Title: `Ticket ${data.orderNumber}`,
          Author: brand.storeName,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colores
      const textColor = '#000000';
      let yPos = mmToPoints(margins.top);

      // Factor de escala de fuente basado en configuración
      const fontScale = printSettings?.fontSize === 'small' ? 0.85 : printSettings?.fontSize === 'large' ? 1.15 : 1;
      const fs = (size: number) => Math.round(size * fontScale);

      // ==================== HEADER ====================
      // Logo (si existe y está habilitado)
      if (logoBuffer) {
        try {
          // Calcular dimensiones del logo para que quepa en el ancho del ticket
          const maxLogoWidth = contentWidth * 0.7; // 70% del ancho
          const maxLogoHeight = 35; // altura máxima en puntos

          doc.image(logoBuffer, margin + (contentWidth - maxLogoWidth) / 2, yPos, {
            fit: [maxLogoWidth, maxLogoHeight],
            align: 'center',
          });
          yPos += 40; // Espacio después del logo
        } catch (logoError) {
          console.error('Error insertando logo en PDF:', logoError);
        }
      }

      // Nombre de la tienda (condicional)
      if (showStoreName) {
        doc.fillColor(textColor)
          .fontSize(fs(14))
          .font('Helvetica-Bold')
          .text(brand.storeName.toUpperCase(), margin, yPos, {
            width: contentWidth,
            align: 'center',
          });
        yPos += 18;
      }

      // Datos fiscales (condicional)
      if (showNit) {
        const fiscalNit = brand.fiscal.nit || '';
        const fiscalLegalName = brand.fiscal.legalName || '';
        const fiscalTaxRegimeLabel = getTaxRegimeLabel(brand.fiscal.taxRegime);

        if (fiscalLegalName && fiscalLegalName !== brand.storeName) {
          doc.fontSize(8).font('Helvetica').text(fiscalLegalName, margin, yPos, {
            width: contentWidth,
            align: 'center',
          });
          yPos += 10;
        }
        if (fiscalNit) {
          doc.fontSize(8).text(`NIT: ${fiscalNit}`, margin, yPos, {
            width: contentWidth,
            align: 'center',
          });
          yPos += 10;
        }
        if (fiscalTaxRegimeLabel) {
          doc.fontSize(7).text(fiscalTaxRegimeLabel, margin, yPos, {
            width: contentWidth,
            align: 'center',
          });
          yPos += 10;
        }
      }

      // Solo agregar espacio si se mostró algo en el header
      if (showStoreName || showNit) {
        yPos += 5;
      }

      // Línea separadora
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).lineWidth(1).stroke(textColor);
      yPos += 8;

      // Título
      doc.fontSize(10).font('Helvetica-Bold').text('FACTURA DE VENTA', margin, yPos, {
        width: contentWidth,
        align: 'center',
      });
      yPos += 14;

      doc.fontSize(9).font('Helvetica').text(`#${data.orderNumber}`, margin, yPos, {
        width: contentWidth,
        align: 'center',
      });
      yPos += 14;

      // Línea separadora
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(3, { space: 2 }).stroke(textColor);
      doc.undash();
      yPos += 8;

      // ==================== INFO FACTURA ====================
      const formattedDate = new Date(data.date).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fontSize(8).font('Helvetica');

      // Fecha
      doc.text('Fecha:', margin, yPos);
      doc.text(formattedDate, margin + 45, yPos);
      yPos += 11;

      // Cliente
      doc.text('Cliente:', margin, yPos);
      doc.text(data.customerName, margin + 45, yPos, { width: contentWidth - 45 });
      yPos += 11;

      // Vendedor
      doc.text('Vendedor:', margin, yPos);
      doc.text(data.sellerName, margin + 45, yPos, { width: contentWidth - 45 });
      yPos += 14;

      // Línea separadora
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(3, { space: 2 }).stroke(textColor);
      doc.undash();
      yPos += 8;

      // ==================== PRODUCTOS ====================
      doc.fontSize(8).font('Helvetica');

      for (const item of data.items) {
        // Nombre del producto
        doc.font('Helvetica-Bold').text(item.name, margin, yPos, { width: contentWidth });
        yPos += 10;

        // Cantidad x Precio = Subtotal
        doc.font('Helvetica');
        const qtyPriceText = `${item.quantity} x ${formatCurrencyPDF(item.unitPrice)}`;
        const subtotalText = formatCurrencyPDF(item.subtotal);

        doc.text(qtyPriceText, margin, yPos);
        doc.text(subtotalText, margin, yPos, { width: contentWidth, align: 'right' });
        yPos += 12;

        // Línea punteada entre items
        doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(1, { space: 2 }).stroke('#cccccc');
        doc.undash();
        yPos += 6;
      }

      yPos += 4;

      // Línea separadora antes de totales
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).lineWidth(1).stroke(textColor);
      yPos += 8;

      // ==================== TOTALES ====================
      doc.fontSize(8);

      // Subtotal
      doc.font('Helvetica').text('Subtotal:', margin, yPos);
      doc.text(formatCurrencyPDF(data.subtotal), margin, yPos, { width: contentWidth, align: 'right' });
      yPos += 11;

      // Descuento (si aplica)
      if (data.discount > 0) {
        doc.text('Descuento:', margin, yPos);
        doc.text(`-${formatCurrencyPDF(data.discount)}`, margin, yPos, { width: contentWidth, align: 'right' });
        yPos += 11;
      }

      // IVA (si aplica)
      if (data.tax > 0) {
        doc.text('IVA:', margin, yPos);
        doc.text(formatCurrencyPDF(data.tax), margin, yPos, { width: contentWidth, align: 'right' });
        yPos += 11;
      }

      // Línea antes del total
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).stroke(textColor);
      yPos += 6;

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', margin, yPos);
      doc.text(formatCurrencyPDF(data.total), margin, yPos, { width: contentWidth, align: 'right' });
      yPos += 18;

      // Línea separadora
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(3, { space: 2 }).stroke(textColor);
      doc.undash();
      yPos += 8;

      // ==================== INFORMACIÓN DE PAGO ====================
      doc.fontSize(8).font('Helvetica');
      doc.text('Método de pago:', margin, yPos);
      doc.text(data.paymentMethod, margin + 70, yPos);
      yPos += 11;

      if (data.cashAmount && data.cashAmount > 0) {
        doc.text('Efectivo:', margin, yPos);
        doc.text(formatCurrencyPDF(data.cashAmount), margin + 70, yPos);
        yPos += 11;
      }

      if (data.cardAmount && data.cardAmount > 0) {
        doc.text('Tarjeta:', margin, yPos);
        doc.text(formatCurrencyPDF(data.cardAmount), margin + 70, yPos);
        yPos += 11;
      }

      if (data.change && data.change > 0) {
        yPos += 4;
        doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(3, { space: 2 }).stroke(textColor);
        doc.undash();
        yPos += 8;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('CAMBIO:', margin, yPos);
        doc.text(formatCurrencyPDF(data.change), margin, yPos, { width: contentWidth, align: 'right' });
        yPos += 14;
      }

      yPos += 8;

      // ==================== FOOTER ====================
      // Línea separadora
      doc.moveTo(margin, yPos).lineTo(ticketWidth - margin, yPos).dash(3, { space: 2 }).stroke(textColor);
      doc.undash();
      yPos += 12;

      doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
      doc.text('¡Gracias por su compra!', margin, yPos, {
        width: contentWidth,
        align: 'center',
      });
      yPos += 14;

      if (brand.contactPhone) {
        doc.fontSize(8).font('Helvetica');
        doc.text(`Tel: ${brand.contactPhone}`, margin, yPos, {
          width: contentWidth,
          align: 'center',
        });
        yPos += 10;
      }

      // Fecha de generación
      yPos += 8;
      doc.fontSize(6).fillColor('#666666');
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, margin, yPos, {
        width: contentWidth,
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generar PDF de factura POS (exportada para uso externo)
 */
export async function generatePOSInvoicePDF(data: POSInvoiceEmailData): Promise<Buffer> {
  const brand = await getBrandColors();

  // Obtener configuración de impresión
  let printSettings;
  try {
    const { getPrintingSettings } = await import('./settings.service');
    printSettings = await getPrintingSettings();
  } catch (error) {
    // Si no hay configuración, usar valores por defecto
    printSettings = {
      ticketWidth: 80,
      ticketMargins: { top: 5, right: 5, bottom: 10, left: 5 },
      fontSize: 'medium',
      showLogo: true,
    };
  }

  return await generateInvoicePDF(data, brand, printSettings);
}

/**
 * Enviar factura POS por email
 */
export async function sendPOSInvoice(data: POSInvoiceEmailData): Promise<boolean> {
  const brand = await getBrandColors();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  // Información fiscal
  const fiscalNit = brand.fiscal.nit || '';
  const fiscalLegalName = brand.fiscal.legalName || '';
  const fiscalTaxRegimeLabel = getTaxRegimeLabel(brand.fiscal.taxRegime);

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  // Información de pago
  let paymentInfo = `<strong>Método de pago:</strong> ${data.paymentMethod}`;
  if (data.cashAmount && data.cashAmount > 0) {
    paymentInfo += `<br><strong>Efectivo:</strong> ${formatCurrency(data.cashAmount)}`;
  }
  if (data.cardAmount && data.cardAmount > 0) {
    paymentInfo += `<br><strong>Tarjeta:</strong> ${formatCurrency(data.cardAmount)}`;
  }
  if (data.change && data.change > 0) {
    paymentInfo += `<br><strong>Cambio:</strong> ${formatCurrency(data.change)}`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 12px; }
      </style>
    </head>
    <body>
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        ${generateEmailHeader(brand, 'Factura de Compra', `#${data.orderNumber}`)}
        <div style="background: #fff; padding: 30px; border: 1px solid #eee;">

          <!-- Datos fiscales de la empresa -->
          ${fiscalNit || fiscalLegalName ? `
          <div style="text-align: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
            ${fiscalLegalName ? `<p style="margin: 0 0 3px 0; font-weight: bold; color: #333;">${fiscalLegalName}</p>` : ''}
            ${fiscalNit ? `<p style="margin: 0 0 3px 0; font-size: 13px; color: #666;">NIT: ${fiscalNit}</p>` : ''}
            ${fiscalTaxRegimeLabel ? `<p style="margin: 0; font-size: 12px; color: #888;">${fiscalTaxRegimeLabel}</p>` : ''}
          </div>
          ` : ''}

          <!-- Info de la factura -->
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0 0 5px 0;"><strong>Fecha:</strong> ${formatDate(data.date)}</p>
            <p style="margin: 0 0 5px 0;"><strong>Cliente:</strong> ${data.customerName}</p>
            <p style="margin: 0;"><strong>Atendido por:</strong> ${data.sellerName}</p>
          </div>

          <!-- Tabla de productos -->
          <table style="margin-bottom: 20px;">
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">P. Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totales -->
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <table style="margin: 0;">
              <tr>
                <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
                <td style="text-align: right; padding: 5px 0;">${formatCurrency(data.subtotal)}</td>
              </tr>
              ${data.discount > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: #16a34a;"><strong>Descuento:</strong></td>
                <td style="text-align: right; padding: 5px 0; color: #16a34a;">-${formatCurrency(data.discount)}</td>
              </tr>
              ` : ''}
              ${data.tax > 0 ? `
              <tr>
                <td style="padding: 5px 0;"><strong>IVA:</strong></td>
                <td style="text-align: right; padding: 5px 0;">${formatCurrency(data.tax)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #ddd;">
                <td style="padding: 10px 0; font-size: 1.2em;"><strong>TOTAL:</strong></td>
                <td style="text-align: right; padding: 10px 0; font-size: 1.2em; color: ${brand.buttonColor};"><strong>${formatCurrency(data.total)}</strong></td>
              </tr>
            </table>
          </div>

          <!-- Info de pago -->
          <div style="background: #e0f2fe; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; font-size: 14px;">
              ${paymentInfo}
            </p>
          </div>

          <p style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
            ¡Gracias por tu compra!
          </p>
        </div>
        ${generateEmailFooter(brand)}
      </div>
    </body>
    </html>
  `;

  // Generar PDF de la factura
  let pdfBuffer: Buffer | null = null;
  try {
    // Obtener configuración de impresión
    let printSettings;
    try {
      const { getPrintingSettings } = await import('./settings.service');
      printSettings = await getPrintingSettings();
    } catch {
      printSettings = {
        ticketWidth: 80,
        ticketMargins: { top: 5, right: 5, bottom: 10, left: 5 },
        fontSize: 'medium',
        showLogo: true,
      };
    }

    pdfBuffer = await generateInvoicePDF(data, brand, printSettings);
    console.log(`📄 PDF generado para factura ${data.orderNumber} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (pdfError) {
    console.error('❌ Error generando PDF de factura:', pdfError);
    // Continuar sin el PDF adjunto
  }

  return sendEmail({
    to: data.customerEmail,
    subject: `Factura #${data.orderNumber} - ${brand.storeName}`,
    html,
    text: `Factura #${data.orderNumber}. Total: ${formatCurrency(data.total)}. Gracias por tu compra en ${brand.storeName}.`,
    attachments: pdfBuffer
      ? [
          {
            filename: `Factura_${data.orderNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : undefined,
  });
}
