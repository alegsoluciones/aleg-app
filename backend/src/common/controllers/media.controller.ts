import { Controller, Get, Post, Query, Res, UseGuards, BadRequestException, Req, UseInterceptors, UploadedFile, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StorageService } from '../services/storage.service';
import * as path from 'path';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly storageService: StorageService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('File is required');

    const user = req.user;
    const tenantSlug = user?.tenant?.slug || req.tenant?.slug;

    if (!tenantSlug) {
      // Fallback for verification if ClsMiddleware set tenant in req
      // But typically user from JwtAuthGuard has it.
      throw new BadRequestException('Tenant Context Missing');
    }

    // Save to storage/{tenantSlug}/uploads/
    const uploadPath = path.join(process.cwd(), 'storage', tenantSlug, 'uploads');
    // Ensure filename is safe and unique-ish
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Use StorageService to save (it handles mkdir recursive)
    const relativePath = this.storageService.saveFile(uploadPath, safeName, file.buffer);

    // Return the URL that can be used with /media/stream
    // The frontend expects a URL it can put in src="..."
    // If we use /media/stream?path=...
    return {
      url: `/api/media/stream?path=${encodeURIComponent(relativePath)}`,
      path: relativePath
    };
  }

  @Get('stream')
  getMedia(@Query('path') filePath: string, @Res() res: Response, @Req() req: any) {
    if (!filePath) throw new BadRequestException('Path requerido');

    // 🔒 SECURITY: Extract Tenant from Token/Request
    const user = req.user;
    const tenantSlug = user?.tenant?.slug || req.tenant?.slug;

    if (!tenantSlug) {
      throw new BadRequestException('Security Context Missing: Unable to verify Tenant ownership.');
    }

    // The streamFile checks if path is within tenant folder
    this.storageService.streamFile(filePath, res, tenantSlug);
  }
}