
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const { user } = context.switchToHttp().getRequest();
        const request = context.switchToHttp().getRequest();
        console.log(`[RolesGuard] Path: ${request.url}, User: ${user?.email}, RequiredRoles: ${requiredRoles}`);

        if (!requiredRoles) {
            console.log(`[RolesGuard] No roles required. PASS.`);
            return true;
        }

        if (!user) {
            console.warn(`[RolesGuard] No user found. FAIL.`);
            return false;
        }

        // 3. GOD MODE
        if (user.role === UserRole.SUPER_ADMIN || (user.roles && user.roles.includes(UserRole.SUPER_ADMIN))) {
            console.log(`[RolesGuard] Super Admin GOD MODE. PASS.`);
            return true;
        }

        if (typeof user.role === 'string') {
            const userRole = user.role.toUpperCase();
            const hasRole = requiredRoles.some(role => role === userRole);
            if (hasRole) {
                console.log(`[RolesGuard] User has role ${userRole}. PASS.`);
                return true;
            }
        }

        if (Array.isArray(user.roles)) {
            const hasRole = requiredRoles.some((role) => user.roles.includes(role));
            if (hasRole) {
                console.log(`[RolesGuard] User has role in array. PASS.`);
                return true;
            }
        }

        console.error(`[RolesGuard] Access Denied. User Role: ${user.role}, Required: ${requiredRoles}`);
        throw new ForbiddenException(`Acceso Denegado: Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`);
    }
}
