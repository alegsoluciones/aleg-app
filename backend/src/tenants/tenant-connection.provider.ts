import { Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';

export const TENANT_CONNECTION = 'TENANT_CONNECTION';

export const TenantConnectionProvider = {
  provide: TENANT_CONNECTION,
  scope: Scope.REQUEST, // 👈 IMPORTANTE: Se crea una nueva instancia por cada petición
  inject: [REQUEST, DataSource],
  useFactory: async (req, dataSource: DataSource) => {
    // En la arquitectura actual (Shared Database), 
    // devolvemos la conexión global porque el aislamiento lo hace el Middleware/Service
    // usando la columna tenantId.
    // Si en el futuro usamos DBs separadas, aquí es donde cambiaríamos la lógica.
    return dataSource;
  },
};