# TEAM TASK SYNC (Diario de Ingeniería)

Este documento sirve como canal de comunicación asíncrona entre IAs (Gemini, Jules, Antigravity) y el equipo humano.

## 📡 Sensor Analysis (Jules)
*Updated: 2026-02-10*

## 🕵️‍♂️ Intelligence Analysis (Antigravity)
*Updated: 2026-02-10 | Operación New PC Ready*

**Objective:** Audit system for "Universal Bootloader" readiness and persistence integrity.

**Critical Findings:**
1.  **Persistence Risk (HIGH):** `docker-compose.yml` is missing the bind mount for `backend/storage`. Data written to the "Digital Twin" is currently trapped inside the container's ephemeral layer or an anonymous volume.
    - *Fix Required:* Map `./backend/storage:/home/node/app/storage`.
2.  **Path Mismatch:**
    - `Dockerfile` declares `VOLUME ["/app/storage"]`.
    - `Dockerfile` sets `WORKDIR /home/node/app`.
    - `StorageService` writes to `process.cwd() + '/storage'` -> `/home/node/app/storage`.
    - *Result:* The declared volume `/app/storage` is unused and misleading.
3.  **Missing Bootloader:** `install.bat` does not exist.
4.  **Scripts:** `/scripts` directory contains valuable automation (`seed.js`, `bootstrap.js`) that must be preserved and integrated into the bootloader.

**Action Plan & Resolution:**
1.  **Fix Docker:** ✅ Aligned paths and added bind mounts (`./storage:/home/node/app/storage`).
2.  **Create Bootloader:** ✅ Implemented `install.bat` with retry loops and checks.
3.  **Update Config:** ✅ Verified `.env.example` generic coverage.
4.  **Documentation:** ✅ Updated `ALEG_APP_BLUEPRINT.md` to v2.17.0.

**Status:** 🟢 **READY FOR DEPLOYMENT**


**Investigation:** Searched codebase for "sensor", "alert", "monitor" keywords to identify the source of console logs reported by the Architect.

**Findings:**
- **No direct references:** The terms "sensor" or "alarm" do not appear in the backend source code logic.
- **Console Logs:** The logs likely originate from standard `Logger` services in NestJS or `console.log` statements in Guards (`SubscriptionGuard`, `JwtStrategy`) added recently for debugging.
- **Hypothesis:** The "sensor" logs might be a metaphorical description by the user referring to the `SubscriptionGuard` or `AuditInterceptor` logging activity, or they come from an external container not in `backend/src` (e.g., MySQL healthchecks or Docker events).
- **Action:** No specific "sensor" code needs deletion or modification as none exists. The system relies on standard `Logger` output.

## ✅ Identidad de Sara Unificada (Jules)
*Updated: 2026-02-08*
- **Acción:** Refactor completo de la identidad del tenant "El Mundo de Sara".
- **Cambios:**
    - Slug actualizado de `aspeten-events` a `el-mundo-de-sara`.
    - Industria cambiada de `EVENTS` a `CRAFT`.
    - Terminología personalizada: Alumna, Proyecto, Detalles del Kit.
    - Sincronización en `SeedService`, `scripts/seed.js` y `ALEG_APP_BLUEPRINT.md`.
    - Limpieza de directorios legacy completada.

## 🎨 Phase 3: Craft Identity Implementation (Pencil & Jules)
*Updated: 2026-02-08 | v2.15.0*
- **Frontend (Pencil):**
    - LoginPage: "Eventos" -> Dinámico (`useTerminology`). Botón Dev actualizado.
    - MarketplacePage: Sección de Planes (Basic, Emprendedor, Pro) agregada.
    - Sidebar: Iconos CRAFT (Tijeras, Paleta, Hilos) implementados.
- **Backend (Jules):**
    - Endpoints de activación verificados (`/marketplace/subscribe`).
- **Estado:** ✅ DESPLEGADO.

## 🕵️‍♂️ AUDITORÍA PRE-MARKETPLACE (Jules)
*Updated: 2026-02-01*

**Estado Actual:** El sistema tiene un comportamiento de "Marketplace Híbrido".

### 1. Frontend (Visual)
- **Dinámico:** `Sidebar.tsx` filtra elementos usando `config.active_modules`.
- **Estructura:** El menú está hardcodeado en `CLINIC_SECTIONS` dentro del componente, mapeando rutas a claves de módulos (`core-std`, `mod_logistics`, etc.).
- **Deuda:** No hay un endpoint que entregue el "Menú" dinámicamente; el Frontend tiene la lógica de qué módulo habilita qué ruta.

### 2. Backend (Datos)
- **Almacenamiento Híbrido:**
    - **Legacy:** Columna JSON `config.active_modules` en tabla `Tenant` (Fuente de verdad para el Guard actual).
    - **Modern:** Tabla `tenant_modules` (Relacional).
- **Sincronización:** `TenantsController.myConfig` fusiona ambas fuentes para el Frontend, pero existe redundancia.

### 3. Seguridad (Guards)
- **FeatureGuard:** Existe y es funcional.
- **Cobertura:** **BAJA**. Solo se aplica explícitamente en `MigrationController`.
- **Riesgo:** Rutas como `/patients` (Core), `/appointments`, o `/billing` no tienen `FeatureGuard` explícito. Si un usuario conoce la URL, podría acceder aunque no tenga el módulo contratado (Seguridad por Oscuridad).

### 4. Roadmap Técnico (Deuda Identificada)
1.  **Seguridad:** Aplicar `FeatureGuard` globalmente o en cada Controlador crítico.
2.  **Limpieza:** Migrar totalmente a `tenant_modules` y eliminar la dependencia de `config.active_modules` JSON para evitar desincronización.
3.  **Frontend:** Mover la definición del menú (`CLINIC_SECTIONS`) a un archivo de configuración o recibirla del Backend para verdadera flexibilidad.

## 🗓️ Epic: Visual Migration (Design System 2.0) (Gemini Architect)
*Updated: 2026-02-16 | v3.5.0*
- **Estado:** ✅ **DONE** (Deployed)
- **Logros:**
    - **Dashboard Visual Update:** Migración a "Glassmorphism" y `DashboardWidgetCard`.
    - **Clinical Modules:** Monitor de Agenda, KPIs y Auditoría estilizados.
    - **Billing & POS:** Implementación completa del módulo de Caja con interfaz táctil/POS y servicios mock.
    - **Agenda v2:** Consolidación de Wizard y Calendar Page con nuevos estilos.
- **Pendiente:**
    - [ ] Conexión real de inventario (Fase 3).

## 🚀 Fase 6: Despliegue/Producción (Gemini Architect)
*Updated: 2026-02-16*

- [ ] **Critical:** Generar migración de consolidación (Schema Sync). Desactivar `synchronize: true` en `app.module` antes de deploy.

## 🚀 Fase 5: Prototype UI/UX Transplant (Project Manager)
*Updated: 2026-02-18 | v4.6.0*

### ✅ DONE
- **Fix Super Admin 403 / RBAC:** Solucionado mediante `JwtStrategy` bypass y whitelist en `TenancyMiddleware`.
- **Fase 5.0: Security Cleanup:** Purga de debugs y validación de seguridad completada.

### 🚧 IN PROGRESS
- **Fase 5.1: Foundation Sync:** Porting de Tailwind, CSS Global y Componentes Base.

### 🔮 BACKLOG
- **Fase 5.2:** Super Admin UI (Perfiles, Planes).
- **Fase 5.3:** Shared Modules (Agenda, Billing).
- **Fase 5.4:** Clinical Core.
- **Fase 5.5:** Public SaaS Onboarding.

## 🔮 Backlog & Roadmap (Prioridad Revisada)

### 🛣️ Fase 3: Conexión de Datos & Inventario
* [ ] **Integración Inventario Real:** Conectar POS con `mod_logistics` (Stock decrement).
* [ ] **Reportes Financieros:** Exportables reales (Excel/PDF) desde Billing.

### 🧊 Fase 6: Backlog Futuro
* [ ] **Epic:** Firma Digital (SignaturePad).
* [ ] **Infra:** Storage Agnostic & Cloud Ready.
