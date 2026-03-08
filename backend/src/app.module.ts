import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'; // Trigger Reload - Retry 2
import { ScheduleModule } from '@nestjs/schedule'; // 👈 Added ScheduleModule
import { APP_GUARD } from '@nestjs/core'; // 👈 Moved here
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // 👈 Moved here
import { SubscriptionGuard } from './auth/guards/subscription.guard'; // 👈 Moved here
import { RolesGuard } from './auth/guards/roles.guard'; // 👈 Imported
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';

// ENTIDADES
import { Tenant } from './tenants/entities/tenant.entity';
import { User } from './users/entities/user.entity';
import { AuditLog } from './audit/audit-log.entity';
import { MarketplaceModule as MarketplaceModuleEntity } from './marketplace/entities/marketplace-module.entity'; // Renamed Entity
import { TenantModule as TenantModuleEntity } from './tenants/entities/tenant-module.entity';
import { Patient } from './entities/patient.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { Subscription } from './billing/entities/subscription.entity';
import { Appointment } from './appointments/entities/appointment.entity'; // 👈 Import Entity
import { BusinessProfile } from './marketplace/entities/business-profile.entity';
import { SubscriptionPlan } from './marketplace/entities/subscription-plan.entity';
import { Plan } from './saas/entities/plan.entity'; // 👈 Added
import { IndustryTemplate } from './saas/entities/industry-template.entity'; // 👈 Added

// MÓDULOS
import { PatientsModule } from './patients/patients.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { BackupModule } from './backup/backup.module';
import { SaasModule } from './saas/saas.module';
import { InventoryModule } from './inventory/inventory.module'; // 👈 Added
import { BillingModule } from './billing/billing.module';
import { Product } from './inventory/entities/product.entity';

// MIDDLEWARE
import { TenancyMiddleware } from './tenants/tenancy.middleware';

// CONTROLADORES Y SERVICIOS GLOBALES
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MigrationController } from './migration/migration.controller';
import { ExcelMigrationService } from './migration/migration.service';
import { StorageService } from './common/services/storage.service';
import { SeedService } from './common/services/seed.service';
import { MediaController } from './common/controllers/media.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root_password_segura',
      database: process.env.DB_NAME || 'aleg_global',
      entities: [
        Tenant, User, AuditLog, MarketplaceModuleEntity, TenantModuleEntity,
        Patient, MedicalRecord, Subscription, Appointment, BusinessProfile, SubscriptionPlan,
        Plan, IndustryTemplate, Product // 👈 Added Product
      ],
      // Appointment is loaded via autoLoadEntities? No, explicitly.
      // Wait, imported Appointment at top first

      // autoLoadEntities: true, 
      synchronize: true,
    }),

    // Módulos funcionales
    PatientsModule,
    TenantsModule,
    AuthModule,
    AuditModule,
    UsersModule,
    MarketplaceModule,
    AppointmentsModule,
    ScheduleModule.forRoot(),
    NotificationsModule,
    SearchModule,
    NotificationsModule,
    SearchModule,
    BackupModule,
    SaasModule,
    InventoryModule, // 👈 Added InventoryModule
    BillingModule,
    TypeOrmModule.forFeature([TenantModuleEntity, Tenant]),
  ],
  controllers: [AppController, MigrationController, MediaController],

  // ... (previous providers)

  providers: [
    AppService,
    ExcelMigrationService,
    StorageService,
    SeedService, // 👈 Automatic Seeding
    // 🛡️ GLOBAL GATEKEEPERS
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 1. First Validate Identity
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard, // 2. Then Check Subscription
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 3. Finally Validate Roles
    },
  ],
  exports: [StorageService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenancyMiddleware)
      .forRoutes('*'); // 👈 Aplicar a TODAS las rutas para que CLS siempre tenga el Tenant si se envía el header
  }
}