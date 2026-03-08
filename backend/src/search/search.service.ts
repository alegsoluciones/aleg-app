import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Patient)
        private patientRepo: Repository<Patient>,
        @InjectRepository(Appointment)
        private appointmentRepo: Repository<Appointment>,
    ) { }

    async search(tenantId: string, query: string) {
        if (!query || query.length < 2) {
            return { patients: [], appointments: [] };
        }

        // 1. Search Patients (Name, ID, Email, Dynamic Data)
        const patients = await this.patientRepo.createQueryBuilder('p')
            .where('p.tenantId = :tenantId', { tenantId })
            .andWhere(new Brackets(qb => {
                qb.where('p.name ILIKE :q', { q: `%${query}%` }) // Note: Patient entity uses 'name', not firstName/lastName separately in previous checks, checking entity definition...
                    // Wait, previous file view of patient.entity.ts showed `name: string`. 
                    // The user prompt says firstName/lastName but the entity I read has `name`. 
                    // I will use `name` and also check `email` as added previously.
                    .orWhere('p.email ILIKE :q', { q: `%${query}%` })
                    .orWhere('CAST(p.data AS CHAR) ILIKE :q', { q: `%${query}%` }); // MySQL uses CAST(.. AS CHAR) or JSON specific functions. Postgres uses CAST(.. AS TEXT).
                // User said "CAST(p.data AS TEXT)" which implies Postgres or generic SQL. 
                // However, `docker-compose.yml` showed MySQL 8.0.
                // MySQL doesn't natively cast JSON to TEXT the same way as PG. 
                // But I can search JSON in MySQL using `JSON_SEARCH` or simply treating it as string if TypeORM supports it. 
                // Let's safe-guard for MySQL. `CAST(p.data AS CHAR)` works in MySQL.
            }))
            .take(5)
            .getMany();

        // 2. Search Appointments (By Patient Name or Title)
        const appointments = await this.appointmentRepo.createQueryBuilder('a')
            .leftJoinAndSelect('a.patient', 'patient')
            .where('a.tenantId = :tenantId', { tenantId })
            .andWhere(new Brackets(qb => {
                qb.where('patient.name ILIKE :q', { q: `%${query}%` })
                    .orWhere('a.title ILIKE :q', { q: `%${query}%` });
            }))
            .orderBy('a.start', 'DESC')
            .take(5)
            .getMany();

        return { patients, appointments };
    }
}
