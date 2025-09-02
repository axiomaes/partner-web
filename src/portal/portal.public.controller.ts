// src/portal/portal.public.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

type OtpRec = { code: string; expires: number };
const otpStore = new Map<string, OtpRec>(); // memoria (demo)

@Controller('portal')
export class PortalPublicController {
  /** POST /portal/otp/request  { contact: "+34..." | "email@..." } */
  @Post('otp/request')
  async requestOtp(@Body() body: { contact?: string }) {
    const contact = (body?.contact || '').trim();
    if (!contact) throw new BadRequestException('contact is required');

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
    const expires = Date.now() + 5 * 60 * 1000; // 5 min

    otpStore.set(contact, { code, expires });

    // En desarrollo, devolvemos el código para probar sin proveedor externo
    const devCode = process.env.NODE_ENV !== 'production' ? code : undefined;
    return { ok: true, devCode };
  }

  /** POST /portal/otp/verify  { contact, code } */
  @Post('otp/verify')
  async verifyOtp(@Body() body: { contact?: string; code?: string }) {
    const contact = (body?.contact || '').trim();
    const code = (body?.code || '').trim();
    const rec = otpStore.get(contact);

    if (!rec || rec.expires < Date.now() || rec.code !== code) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    otpStore.delete(contact);
    return { ok: true };
  }
}
