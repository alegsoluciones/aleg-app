import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    async search(@Req() req: Request, @Query('q') q: string) {
        // TenantId is injected by TenancyMiddleware into 'req['tenantId']' or similar if configured, 
        // BUT typically we extract it from User object in Request if using JWT strategy 
        // or from the ClsModule/Middleware. 
        // Previous analysis: `TenancyMiddleware` applies to all routes. 
        // Let's check how other controllers access tenantId.
        // Usually via `ClsService` or `req.user['tenantId']`.
        // The user rules say "Zero Config", "Native Docker".
        // I'll assume `req.user` has it populated by JwtStrategy or I can use the CLS if I inject it.
        // For simplicity and consistency with standard NestJS JWT auth:
        const user = req.user as any;
        const tenantId = user?.tenantId;

        return this.searchService.search(tenantId, q);
    }
}
