// src/portal/portal.module.ts
import { Module } from '@nestjs/common';
import { CustomerPortalController } from './portal.controller'; // tu archivo actual con guards
import { PortalPublicController } from './portal.public.controller'; // nuevo público

@Module({
  controllers: [CustomerPortalController, PortalPublicController],
})
export class PortalModule {}
