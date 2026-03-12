import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute'; // Import ProtectedRoute
import { DashboardLayout } from './layouts/DashboardLayout';

// Páginas
// import { SuperAdminHome } from './pages/SuperAdminHome';
import { TenantHome } from './pages/TenantHome';
import { TenantsPage } from './pages/TenantsPage';
import { LegacyExcelImporter } from './pages/services/migration/LegacyExcelImporter';
import { ClinicalRecordsPage } from './pages/clinical/ClinicalRecordsPage';
import { StaffPage } from './pages/StaffPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';
import { PatientDetailPage } from './pages/clinical/PatientDetailPage';

// ... existing imports ...

import { BillingPage } from './pages/billing/BillingPage';
import { CalendarPage } from './pages/CalendarPage';
import { TenantAudit } from './pages/TenantAudit';
import { SettingsPage } from './pages/SettingsPage';
import { PlansPage } from './pages/admin/PlansPage'; // 👈 Import PlansPage
import { IndustriesPage } from './pages/admin/IndustriesPage'; // 👈 Import IndustriesPage

// Módulos
import { TelemedicinaPage } from './pages/modules/TelemedicinaPage';
import { MarketingPage } from './pages/modules/MarketingPage';
import { LogisticsPage } from './pages/modules/LogisticsPage';
import { LaboratoryPage } from './pages/modules/LaboratoryPage';
import { InventoryPage } from './pages/inventory/InventoryPage'; // 👈 Updated path

// ...

<Route path="/dashboard/inventory" element={<DashboardLayout><InventoryPage /></DashboardLayout>} />
import { PharmacyPage } from './pages/modules/PharmacyPage';
import { FinancePage } from './pages/modules/FinancePage';
import { VeterinaryPage } from './pages/modules/VeterinaryPage';

import { AdminDashboard } from './pages/admin/AdminDashboard';

// Componente para decidir qué Home mostrar según el rol
const DashboardHome = () => {
  const { user } = useAuth();
  const isMasquerading = localStorage.getItem('currentTenantSlug');

  // Si soy Admin y NO estoy en modo "Ver como Cliente", muestro panel global
  if (user?.role === 'SUPER_ADMIN' && !isMasquerading) {
    return <AdminDashboard />;
  }

  // De lo contrario (Cliente normal O Admin masquerading), muestro panel de Tenant
  return <TenantHome />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TenantProvider>
          <Routes>
            {/* 1. Ruta Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* 2. Rutas del Dashboard */}

            {/* Inicio */}
            <Route path="/dashboard" element={
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            } />

            {/* Super Admin: Gestión de Empresas */}
            <Route path="/dashboard/tenants" element={
              <DashboardLayout>
                <TenantsPage />
              </DashboardLayout>
            } />

            {/* Super Admin: Rutas Protegidas */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              {/* Motor de Planes (SaaS Pricing) */}
              <Route path="/admin/plans" element={
                <DashboardLayout>
                  <PlansPage />
                </DashboardLayout>
              } />

              {/* Perfiles de Industria */}
              <Route path="/admin/industries" element={
                <DashboardLayout>
                  <IndustriesPage />
                </DashboardLayout>
              } />
            </Route>

            {/* 🚨 CORRECCIÓN: Ruta de Pacientes (Historias Clínicas) 
              La definimos explícitamente para que el Sidebar la encuentre */}
            <Route path="/dashboard/patients" element={
              <DashboardLayout>
                <ClinicalRecordsPage />
              </DashboardLayout>
            } />
            <Route path="/dashboard/patients/:id" element={
              <DashboardLayout>
                <PatientDetailPage />
              </DashboardLayout>
            } />

            {/* Gestión de Equipo (Staff) */}
            <Route path="/dashboard/staff" element={
              <DashboardLayout>
                <StaffPage />
              </DashboardLayout>
            } />

            {/* AUDITORÍA (The Glass Room) */}
            <Route path="/dashboard/audit" element={
              <DashboardLayout>
                <TenantAudit />
              </DashboardLayout>
            } />

            {/* AGENDA (Protocol Chronos) */}
            <Route path="/dashboard/calendar" element={
              <DashboardLayout>
                <CalendarPage />
              </DashboardLayout>
            } />

            {/* MARKETPLACE (Nueva Tienda) */}
            <Route path="/dashboard/marketplace" element={
              <DashboardLayout>
                <MarketplacePage />
              </DashboardLayout>
            } />

            {/* SUSCRIPCIÓN (SaaS) */}
            <Route path="/dashboard/subscription" element={
              <DashboardLayout>
                <SubscriptionPage />
              </DashboardLayout>
            } />

            {/* BILLING (POS - Nuevo) */}
            <Route path="/dashboard/billing" element={
              <DashboardLayout>
                <BillingPage />
              </DashboardLayout>
            } />

            {/* SETTINGS (Protocol Narciso) */}
            <Route path="/dashboard/settings" element={
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            } />

            {/* Importador Legacy */}
            <Route path="/dashboard/services/migration" element={
              <DashboardLayout>
                <LegacyExcelImporter />
              </DashboardLayout>
            } />

            {/* 🧩 RUTAS DE MÓDULOS ACTIVABLES */}
            <Route path="/dashboard/laboratory" element={<DashboardLayout><LaboratoryPage /></DashboardLayout>} />
            <Route path="/dashboard/pharmacy" element={<DashboardLayout><PharmacyPage /></DashboardLayout>} />
            <Route path="/dashboard/finance" element={<DashboardLayout><FinancePage /></DashboardLayout>} />
            <Route path="/dashboard/logistics" element={<DashboardLayout><LogisticsPage /></DashboardLayout>} />
            <Route path="/dashboard/marketing" element={<DashboardLayout><MarketingPage /></DashboardLayout>} />
            <Route path="/dashboard/telemed" element={<DashboardLayout><TelemedicinaPage /></DashboardLayout>} />
            <Route path="/dashboard/vet" element={<DashboardLayout><VeterinaryPage /></DashboardLayout>} />
            <Route path="/dashboard/inventory" element={<DashboardLayout><InventoryPage /></DashboardLayout>} />

            {/* 3. Redirecciones por defecto (Fallback) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </TenantProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;