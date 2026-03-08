import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 👇 CORRECCIÓN: Ruta apuntando a la carpeta 'entities'
import { User } from '../users/entities/user.entity';
import { TenantsService } from '../tenants/tenants.service'; // 👈 Import

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private tenantsService: TenantsService, // 👈 Inject
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'CLAVE_SECRETA_SUPER_SEGURA_DEV',
    });
  }

  async validate(payload: any) {
    const { sub: id } = payload;
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenant', 'tenant.subscriptions'] // 👈 Load subscriptions
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    // 🏆 SUPER ADMIN BYPASS RULE
    // Avoids locking out the system owner due to data irregularities
    if (user.role === 'SUPER_ADMIN') {
      return user;
    }

    // 🕵️ ENRICHMENT LAYER (GATEKEEPER)
    if (user.tenant) {
      // 1. Determine Subscription Status
      const subs = user.tenant.subscriptions || [];

      // Filter for valid dates (Optional: Add date check logic here if needed)
      // const validSubs = subs.filter(s => new Date(s.endDate) > new Date());

      // Priority: ACTIVE > TRIAL > PAST_DUE > CANCELLED
      // Fix: Ensure we pick the *best* status, not just the first found
      const bestSub = subs.find(s => s.status === 'ACTIVE')
        || subs.find(s => s.status === 'TRIAL')
        || subs.find(s => s.status === 'PAST_DUE')
        || subs[0];

      // Attach to user object for Guards
      (user as any).subscriptionStatus = bestSub ? bestSub.status : 'CANCELLED';

      if (process.env.NODE_ENV !== 'production') {

      }

      // 2. Load Active Modules
      this.tenantsService.getActiveModules(user.tenant.id).then(modules => {
        (user as any).modules = modules;
      });
      // Await finding modules might slow down every request slightly, but is safer. 
      // For now, let's keep it async but awaited to ensure guards have data.
      (user as any).modules = await this.tenantsService.getActiveModules(user.tenant.id);
    }

    return user;
  }
}