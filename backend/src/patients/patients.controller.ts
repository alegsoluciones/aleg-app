import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards, UnauthorizedException, BadRequestException, UploadedFiles, UseInterceptors, Headers, Logger } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TenantsService } from '../tenants/tenants.service';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(
    private readonly patientsService: PatientsService,
    private readonly tenantsService: TenantsService
  ) { }

  private async getTenantId(req: any): Promise<string> {
    const user = req.user;
    this.logger.log(`[getTenantId] User: ${user?.email}, Role: ${user?.role}, TenantId: ${user?.tenantId}`);

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Usuario sin empresa asignada.');
    }

    // 🕵️ SUPER ADMIN MASQUERADING LOGIC
    if (user.role === 'SUPER_ADMIN') {
      const slug = req.headers['x-tenant-slug'];
      this.logger.log(`[getTenantId] Super Admin detected. Slug header: ${slug}`);

      if (slug) {
        const tenant = await this.tenantsService.findOneBySlug(slug);
        if (tenant) {
          this.logger.log(`[getTenantId] Masquerading as Tenant: ${tenant.name} (${tenant.id})`);
          return tenant.id;
        } else {
          this.logger.warn(`[getTenantId] Slug provided but Tenant not found: ${slug}`);
        }
      } else {
        this.logger.log(`[getTenantId] No slug provided, using default tenant.`);
      }
    }

    this.logger.log(`[getTenantId] Returning User TenantId: ${user.tenantId}`);
    return user.tenantId;
  }

  private getTenantSlug(req: any): string {
    return req.headers['x-tenant-slug'] || 'unknown-tenant';
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo paciente' })
  async create(@Body() createPatientDto: CreatePatientDto, @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user?.email || 'SYSTEM';
    return this.patientsService.create(createPatientDto, tenantId, slug, userEmail);
  }

  @Post(':id/records')
  async createRecord(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req
  ) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user?.email || 'SYSTEM';
    return this.patientsService.createRecord(id, data, tenantId, slug, userEmail);
  }

  @Get()
  async findAll(@Req() req) {
    const tenantId = await this.getTenantId(req);
    return this.patientsService.findAll(tenantId);
  }

  @Get('stats')
  async getStats(@Req() req) {
    const tenantId = await this.getTenantId(req);
    return this.patientsService.getStats(tenantId);
  }

  @Get(':internalId')
  async findOne(@Param('internalId') internalId: string, @Req() req) {
    this.logger.log(`[GET /patients/${internalId}] HIT`);
    try {
      const tenantId = await this.getTenantId(req);
      this.logger.log(`[findOne] Resolved TenantId: ${tenantId}`);

      const result = await this.patientsService.findOne(internalId, tenantId);
      this.logger.log(`[findOne] Result found: ${!!result}`);

      return result;
    } catch (e) {
      this.logger.error(`[findOne] ERROR: ${e.message}`, e.stack);
      throw e;
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto, @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    return this.patientsService.update(id, updatePatientDto, tenantId, slug);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user?.email || 'SYSTEM';
    return this.patientsService.remove(id, tenantId, slug, userEmail);
  }

  @Post('records/:recordId/photos')
  @UseInterceptors(FilesInterceptor('files'))
  async addPhotosToRecord(
    @Param('recordId') recordId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req
  ) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user.email;

    if (!files || files.length === 0) throw new BadRequestException('No se enviaron archivos');

    return this.patientsService.addPhotosToRecord(recordId, files, tenantId, slug, userEmail);
  }

  @Delete(':patientId/records/:recordId')
  async removeRecord(@Param('recordId') recordId: string, @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user.email;
    return this.patientsService.removeRecord(recordId, tenantId, slug, userEmail);
  }

  @Delete('records/:recordId/photos')
  async deletePhoto(
    @Param('recordId') recordId: string,
    @Body('photoUrl') photoUrl: string,
    @Req() req
  ) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user.email;
    return this.patientsService.removePhoto(recordId, photoUrl, tenantId, slug, userEmail);
  }

  @Patch('records/:recordId')
  async updateRecord(
    @Param('recordId') recordId: string,
    @Body() data: { notes: string, steps: string[], date?: string, title?: string },
    @Req() req
  ) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    return this.patientsService.updateRecord(recordId, data, tenantId, slug);
  }

  @Post('bulk-delete')
  async bulkDelete(@Body('ids') ids: string[], @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    const userEmail = req.user?.email || 'SYSTEM';
    return this.patientsService.bulkDelete(ids, tenantId, slug, userEmail);
  }

  @Post(':id/revert-status')
  async revertStatus(@Param('id') id: string, @Req() req) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);
    return this.patientsService.revertStatus(id, tenantId, slug);
  }

  // 👇 PROTOCOL GUTENBERG: PDF ENDPOINT
  @Get(':id/records/:recordId/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Req() req,
    @Res() res
  ) {
    const tenantId = await this.getTenantId(req);
    const slug = this.getTenantSlug(req);

    const buffer = await this.patientsService.generatePdf(id, recordId, tenantId, slug);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Consulta-${recordId.slice(0, 8)}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}