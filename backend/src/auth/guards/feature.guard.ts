import { CanActivate, ExecutionContext, Injectable, mixin, UnauthorizedException, Type } from '@nestjs/common';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';
import { UserRole } from '../../users/entities/user.entity';
import { ModuleCode } from '../../common/enums/modules.enum';

export const FeatureGuard = (moduleCode: ModuleCode | string): Type<CanActivate> => {
    @Injectable()
    class FeatureGuardMixin implements CanActivate {
        constructor(private readonly cls: ClsService) { }

        async canActivate(context: ExecutionContext): Promise<boolean> {
            const req = context.switchToHttp().getRequest<Request>();
            const user = (req as any).user;

            // 1. Super Admin bypasses everything (GOD MODE)
            if (user?.role === UserRole.SUPER_ADMIN) return true;

            // 2. Get Tenant Configuration
            const tenant = this.cls.get('TENANT');

            if (!tenant) {
                // If tenant is missing, it might be a public route or middleware failed. 
                // However, for a SaaS, we default to BLOCK if tenant context is missing in a protected route.
                return false;
            }

            // 3. active_modules check
            const activeModules = tenant.config?.active_modules || [];

            if (activeModules.includes(moduleCode)) {
                return true;
            }

            throw new UnauthorizedException(`Module '${moduleCode}' is not active for this tenant.`);
        }
    }

    return mixin(FeatureGuardMixin);
};
