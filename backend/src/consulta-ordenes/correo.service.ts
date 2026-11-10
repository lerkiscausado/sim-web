import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Envío del resultado por correo (frmMail). Se configura en backend/.env:
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE (true para 465), SMTP_USER,
 *   SMTP_PASS, SMTP_FROM ("Patología Oncológica <correo@dominio>")
 */
@Injectable()
export class CorreoService {
  configurado(): boolean {
    return Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim(),
    );
  }

  async enviar(opciones: {
    para: string;
    asunto: string;
    mensaje: string;
    adjuntos: { nombre: string; contenido: Buffer }[];
  }) {
    if (!this.configurado()) {
      throw new ServiceUnavailableException(
        'El envío de correo no está configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM en backend/.env',
      );
    }
    const destinatarios = opciones.para
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const valido = /^([\w-]+\.)*?[\w-]+@[\w-]+\.([\w-]+\.)*?[\w]+$/; // misma expresión de frmMail.ValidarMail
    if (
      destinatarios.length === 0 ||
      destinatarios.some((d) => !valido.test(d))
    ) {
      throw new BadRequestException(
        'Correo electrónico del destinatario no válido',
      );
    }
    const puerto = Number(process.env.SMTP_PORT || 587);
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === 'true'
        : puerto === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    try {
      const info = await transporte.sendMail({
        from: process.env.SMTP_FROM,
        to: destinatarios.join(', '),
        subject: opciones.asunto,
        text: opciones.mensaje,
        attachments: opciones.adjuntos.map((a) => ({
          filename: a.nombre,
          content: a.contenido,
          contentType: 'application/pdf',
        })),
      });
      return { enviado: true, para: destinatarios, id: info.messageId };
    } catch (e) {
      throw new ServiceUnavailableException(
        `No se pudo enviar el correo: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
