import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
    @ApiProperty()
    patientId: string;

    @ApiPropertyOptional()
    doctorId?: string;

    @ApiProperty()
    start: Date;

    @ApiProperty()
    end: Date;

    @ApiPropertyOptional()
    title?: string;

    @ApiPropertyOptional()
    type?: string;

    @ApiPropertyOptional()
    notes?: string;

    @ApiPropertyOptional()
    reason?: string;

    @ApiPropertyOptional()
    notificationStatus?: { whatsapp: boolean; email: boolean };
}
