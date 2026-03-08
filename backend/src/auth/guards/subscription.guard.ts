import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantStatus } from '../../tenants/entities/tenant.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const tenant = request.tenant || (request.user && request.user.tenant); // Adjust based on how auth guard attaches tenant

        console.log(`[SubscriptionGuard] Checking ${request.url}. Tenant detected: ${tenant?.id} (Status: ${tenant?.status})`);

        // 1. If no tenant context (e.g. Public route, SuperAdmin, or Auth), pass.
        // We assume strictly that if there is a tenant, we check.
        if (!tenant) return true;

        // 2. WHITELIST (Escape Routes)
        const path = request.route ? request.route.path : request.url;
        // Allow billing to pay, auth to logout/login, and config to see status.
        if (
            path.includes('/billing') ||
            path.includes('/auth') ||
            path.includes('/tenants/my-config') ||
            path.includes('/tenants/config')
        ) {
            return true;
        }

        // 3. IRON RULE (Suspension Check)
        // Check both 'status' enum and 'isActive' boolean just in case
        if (tenant.status === TenantStatus.SUSPENDED) {
            console.error(`[SubscriptionGuard] Tenant Suspended: ${tenant.slug}`);
            throw new ForbiddenException({
                message: 'ACCOUNT_SUSPENDED',
                error: 'Payment Required',
                help: 'Please contact support or go to /billing to regularize your status.'
            });
        }

        return true;
    }
}
