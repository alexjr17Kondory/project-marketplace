import type { Design } from '../types/design';
import type { ProductType } from '../types/product';

/**
 * Service para manejar el canvas de personalización de productos
 */
export class CanvasService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /**
   * Inicializar el canvas
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas');
    }
  }

  /**
   * Limpiar el canvas
   */
  clear(): void {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Dibujar el producto base (placeholder)
   */
  drawProductBase(productType: ProductType, color: string, view: 'front' | 'back'): void {
    if (!this.canvas || !this.ctx) return;

    this.clear();

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Dibujar fondo
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Dibujar silueta del producto (simplificado)
    ctx.fillStyle = color;

    switch (productType) {
      case 'tshirt':
        this.drawTShirt(ctx, width, height);
        break;
      case 'hoodie':
        this.drawHoodie(ctx, width, height);
        break;
      case 'cap':
        this.drawCap(ctx, width, height);
        break;
      case 'bottle':
        this.drawBottle(ctx, width, height);
        break;
      case 'mug':
        this.drawMug(ctx, width, height);
        break;
      case 'pillow':
        this.drawPillow(ctx, width, height);
        break;
    }

    // Agregar texto de vista
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(view === 'front' ? 'Vista Frontal' : 'Vista Trasera', width / 2, height - 20);
  }

  /**
   * Dibujar camiseta (forma simplificada)
   */
  private drawTShirt(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    // Cuello
    ctx.moveTo(centerX - 30, centerY - 120);
    ctx.lineTo(centerX + 30, centerY - 120);
    // Hombro derecho
    ctx.lineTo(centerX + 80, centerY - 100);
    ctx.lineTo(centerX + 100, centerY - 80);
    // Lado derecho
    ctx.lineTo(centerX + 100, centerY + 100);
    ctx.lineTo(centerX + 80, centerY + 120);
    // Parte inferior
    ctx.lineTo(centerX - 80, centerY + 120);
    // Lado izquierdo
    ctx.lineTo(centerX - 100, centerY + 100);
    ctx.lineTo(centerX - 100, centerY - 80);
    ctx.lineTo(centerX - 80, centerY - 100);
    ctx.closePath();
    ctx.fill();

    // Sombra
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar hoodie (forma simplificada)
   */
  private drawHoodie(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    // Capucha
    ctx.arc(centerX, centerY - 100, 50, Math.PI, 0);
    // Hombro derecho
    ctx.lineTo(centerX + 120, centerY - 80);
    // Lado derecho
    ctx.lineTo(centerX + 120, centerY + 120);
    ctx.lineTo(centerX + 100, centerY + 140);
    // Parte inferior
    ctx.lineTo(centerX - 100, centerY + 140);
    // Lado izquierdo
    ctx.lineTo(centerX - 120, centerY + 120);
    ctx.lineTo(centerX - 120, centerY - 80);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar gorra (forma simplificada)
   */
  private drawCap(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Visera
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 40, 120, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Parte superior
    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar botella (forma simplificada)
   */
  private drawBottle(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    // Tapa
    ctx.rect(centerX - 20, centerY - 140, 40, 20);
    // Cuello
    ctx.rect(centerX - 25, centerY - 120, 50, 30);
    // Cuerpo
    ctx.roundRect(centerX - 50, centerY - 90, 100, 200, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar taza (forma simplificada)
   */
  private drawMug(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Cuerpo de la taza
    ctx.beginPath();
    ctx.roundRect(centerX - 70, centerY - 60, 140, 120, 5);
    ctx.fill();

    // Asa
    ctx.beginPath();
    ctx.arc(centerX + 90, centerY, 35, Math.PI * 0.3, Math.PI * 1.7, false);
    ctx.lineWidth = 15;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    // Borde
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar almohada (forma simplificada)
   */
  private drawPillow(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.roundRect(centerX - 120, centerY - 120, 240, 240, 20);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Dibujar un diseño en el canvas
   */
  async drawDesign(design: Design): Promise<void> {
    if (!this.ctx) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = design.imageUrl || design.imageData || '';
      });

      const ctx = this.ctx;
      ctx.save();

      // Aplicar transformaciones
      ctx.globalAlpha = design.opacity;
      ctx.translate(design.position.x + design.size.width / 2, design.position.y + design.size.height / 2);
      ctx.rotate((design.rotation * Math.PI) / 180);
      ctx.translate(-(design.position.x + design.size.width / 2), -(design.position.y + design.size.height / 2));

      // Aplicar filtros si existen
      if (design.filters) {
        if (design.filters.brightness !== undefined) {
          ctx.filter = `brightness(${design.filters.brightness}%)`;
        }
        if (design.filters.grayscale) {
          ctx.filter += ' grayscale(100%)';
        }
      }

      // Dibujar imagen
      ctx.drawImage(img, design.position.x, design.position.y, design.size.width, design.size.height);

      ctx.restore();
    } catch (error) {
      console.error('Error dibujando diseño:', error);
    }
  }

  /**
   * Exportar canvas como imagen
   */
  exportAsImage(format: 'png' | 'jpeg' = 'png', quality = 0.95): string | null {
    if (!this.canvas) return null;
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Redimensionar canvas
   */
  resize(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

// Instancia singleton
export const canvasService = new CanvasService();
