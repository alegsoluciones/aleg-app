import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user } = req;

    // 🛑 FILTROS: Ignorar peticiones de lectura masiva o streaming
    if (method === 'GET' || method === 'OPTIONS') return next.handle();
    if (url.includes('/media/stream')) return next.handle();

    return next.handle().pipe(
      tap(async () => {
        try {
          const isLogin = url.includes('/auth/login');

          if (user || isLogin) {
            let level = 'INFO';
            if (method === 'DELETE') level = 'CRITICAL';
            if (method === 'PATCH' || method === 'PUT') level = 'WARNING';

            // 1. SANITIZAR BODY (LIMPIEZA PROFUNDA)
            const safeBody = { ...body };
            if (safeBody.password) safeBody.password = '***HIDDEN***';

            // Ocultar archivos
            if (safeBody.files || safeBody.uploadedFiles || req.files) {
              if (req.files && Array.isArray(req.files)) {
                safeBody.uploadedFiles = req.files.map((f: any) => f.originalname);
              } else {
                safeBody.uploadedFiles = '[BINARY_FILES_HIDDEN]';
              }
              delete safeBody.files;
              delete safeBody.images;
              delete safeBody.attachment;
            }

            // 2. EXTRAER DATOS DEL USUARIO & REQUEST
            const userId = user ? user.id : (isLogin ? 'SYSTEM' : null);
            const userEmail = user ? user.email : (body?.email || 'Anonymous');
            const tenantId = user?.tenantId ? String(user.tenantId) : undefined; // Fix: undefined matches Partial type better if null is issue
            const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // Inferir Recurso
            // /api/patients/123 -> patients
            const pathParts = url.split('/').filter(p => p && p !== 'api');
            const resource = pathParts.length > 0 ? pathParts[0] : 'unknown';

            // 3. GUARDAR A TRAVÉS DEL SERVICIO
            await this.auditService.create({
              action: `${method} ${resource.toUpperCase()}`,
              method: method,
              path: url,
              resource: resource,
              userId: userId,
              userEmail: userEmail,
              tenantId: tenantId,
              metadata: safeBody, // Mapeamos body a metadata
              ip: ip,
              userAgent: userAgent,
              level: level,
            });

            this.logger.log(`📝 Auditoría: ${userEmail} -> ${method} ${url}`);
          }
        } catch (err) {
          this.logger.error(`Error silencioso en interceptor: ${err.message}`);
        }
      }),
    );
  }
}