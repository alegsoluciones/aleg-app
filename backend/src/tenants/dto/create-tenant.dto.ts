export class CreateTenantDto {
  name: string;
  slug: string;
  adminEmail: string; // New: We need the admin email to link or create user
  // Optional: Industry for default config
  industry?: string;
  config?: any;
}