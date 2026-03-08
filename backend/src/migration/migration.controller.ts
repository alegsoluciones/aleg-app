import { Controller, Post, Get, UseInterceptors, UploadedFiles, Query, BadRequestException, Param, Body, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ExcelMigrationService } from './migration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { ModuleCode } from '../common/enums/modules.enum';

@Controller('migration')
@UseGuards(JwtAuthGuard, FeatureGuard(ModuleCode.UTIL_IMPORTER))
export class MigrationController {
  constructor(private readonly migrationService: ExcelMigrationService) {}

  @Post('import')
  @UseInterceptors(FilesInterceptor('files'))
  async importFiles(@UploadedFiles() files: Array<Express.Multer.File>, @Query('tenant') tenant: string) {
    if (!tenant) throw new BadRequestException('Tenant es requerido');
    if (!files || files.length === 0) throw new BadRequestException('No se enviaron archivos');
    return this.migrationService.importPatients(files, tenant);
  }

  @Post('mark-ready/:id')
  async markReady(@Param('id') id: string) { // 👈 CAMBIO PROFESIONAL: Aceptamos UUID (string)
      // Eliminamos la conversión forzada a Number(). Pasamos el UUID limpio.
      return this.migrationService.markAsReady(id);
  }

  @Post('mark-ready-batch')
  async markReadyBatch(@Body() body: { ids: string[] }) { // 👈 CAMBIO PROFESIONAL: Array de UUIDs
      if (!body.ids || !Array.isArray(body.ids)) throw new BadRequestException('IDs requeridos');
      
      const results: any[] = [];
      
      for (const id of body.ids) {
          try {
              // El servicio ya espera string, así que esto ahora encaja perfectamente
              await this.migrationService.markAsReady(id);
              results.push({ id, status: 'ok' });
          } catch (e) {
              results.push({ id, status: 'error', error: e.message });
          }
      }
      return { results };
  }

  @Post('finalize-batch')
  async finalizeBatch(@Query('tenant') tenant: string) {
      if (!tenant) throw new BadRequestException('Tenant es requerido');
      return this.migrationService.finalizeBatch(tenant);
  }

  @Get('debug')
  async debug(@Query('tenant') tenant: string) {
      if (!tenant) throw new BadRequestException('Tenant es requerido');
      return this.migrationService.runDiagnostics(tenant);
  }
}