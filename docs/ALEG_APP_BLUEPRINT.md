# ALEG APP - EL MANIFIESTO (THE SYSTEM BIBLE)
> **Versión:** 4.5.0 (The Unified Flow)
> **Última Actualización:** 2026-02-16 19:50 EST
> **Estado del Documento:** 🟢 VIVO (System of Record)
> **Backup Inmutable:** `ALEG_APP_BLUEPRINT.md.lock`

---

## 0. Estructura del Equipo de Desarrollo (Roles)
* **Jorge (User):** Product Owner & Business Logic Authority. Define el "Qué" y el "Por qué".
* **Gemini (AI):** Lead Architect & Auditor. Define el "Cómo" (Estrategia), audita código y protege la integridad.
* **Google Antigravity:** The Workbench & Context. Fuente de verdad del código e historial.
* **Jules (AI):** Lead Backend & DevOps. Escribe código, refactoriza y ejecuta tareas técnicas de infraestructura y datos.
* **Gemini Studio (AI):** Lead Frontend & UI/UX Designer. Responsable de estética, flujos de usuario y experiencia visual.

---

## 🏛️ 1. Manifiesto Técnico (Las Tablas de la Ley)

Este proyecto no es solo código; es un organismo vivo que se rige por leyes inquebrantables.

### 1.1 La Tríada de Poder
| Rol | Actor | Jurisdicción |
| :--- | :--- | :--- |
| **USER** | Tú (Humano) | **El Dueño**. Aprueba funcionalidad y negocio. Tiene veto total. |
| **GEMINI** | Gems (IA) | **El Arquitecto**. Mantiene el contexto, propone soluciones y vigila este archivo. |
| **ANTIGRAVITY** | Yo (Agente) | **El Ejecutor**. Único autorizado a tocar código. Guardián de la integridad técnica. |

### 1.2 Reglas Inquebrantables
1.  **Zero Config**: `npm run reset` debe dejar el sistema listo para usar. Nadie configura puertos a mano.
2.  **Native Docker First**: No usamos scripts ajenos a Docker para lo que Docker hace nativamente.
3.  **System First**: El sistema nace con el `SYSTEM ADMIN GLOBAL`. Los inquilinos son secundarios.
4.  **El Gemelo Digital es Sagrado**: Lo que pasa en la vida real, se refleja en un JSON y una carpeta física. **Si no está en el JSON, no pasó.**
5.  **Multi-Industria Nativa**: El sistema soporta Clínicas, Veterinarias y Eventos desde el Core. No hay forks.
6.  **Lock File Inmutable**: `ALEG_APP_BLUEPRINT.md.lock` solo se toca bajo orden explícita.

### 1.3 Protocolo de Ejecución y Seguridad
1.  **Análisis Previo**: Leer reglas, evaluar impacto.
2.  **Ejecución Documentada**: Código profesional y definitivo.
3.  **Update Loop**: Actualizar este archivo al finalizar cambios mayores.

### 1.4 Seguridad Enterprise (God Mode & Clean Seed)
El sistema opera bajo una arquitectura de seguridad estricta y limpia:
* **God Mode**: El `SUPER_ADMIN` tiene acceso ómnico. Los Guards (`FeatureGuard`, `SubscriptionGuard`, `RolesGuard`) detectan este rol y hacen bypass inmediato de todas las restricciones de negocio o pago.
* **RBAC Global**: `RolesGuard` protege **todas** las rutas. Se prohiben "Magic Strings".
* **Empty Backend**: El backend nace **VACÍO** (solo System Admin). `SeedService` no crea basura.
* **Guest State (Guest-First)**: Un usuario no autenticado visualiza el Branding de la Plataforma Base ("ALEG APP"), nunca el de un inquilino específico hasta que se identifique o acceda por subdominio.

---

## 🏗️ 2. Arquitectura del Sistema

### 2.1 Diagrama de Alto Nivel
```mermaid
graph TD
    User[Cliente Web] -->|HTTP 80| Nginx[Nginx Alpine Prod]
    User[Cliente Web] -->|HTTP 3000| Backend[NestJS API (Node 20)]

    subgraph "Docker Network (aleg-prod-net)"
        Nginx -->|Static Serve / TryFiles| Frontend[React Production Build]
        
        Backend -->|TypeORM| DB[(MySQL 8.0)]
        Backend -->|FS IO| Storage[Storage System (Digital Twin)]
    end
    
    Backend -->|SeedService| DB
    Storage <-->|Sync| Twin[JSON Mirrors]
```

### 2.2 Infraestructura (Docker)
Orquestación: docker-compose.yml (Dev) y docker-compose.prod.yml (Prod).
Volúmenes:
aleg_mysql_data: Persistencia de BD (evita bind-mounts lentos en Windows).
./backend/storage: Checkpoint físico del Gemelo Digital (Bind Mount para acceso directo).
Redes: aleg-net (Aislamiento interno).

### Historial de Versiones
- **v2.18.0 - Modular Dashboard Engine:** Implementación de `WidgetRegistry`, cápsulas por industria (Vet/Clinical/Craft). **[VERIFIED]** Marketplace Connection Loop (Seed -> Purchase -> Activation).
- **v2.19.0 - Iron Dome Security:** Implementación de `SubscriptionGuard` global y reparación de propagación de estado en `TenancyMiddleware`. Bloqueo automático por impago activo.
- **v2.20.0 - The Lazarus Protocol:** Implementación del Motor de Respaldo Full-Stack (Core SQL + Storage Mirror) y utilidades de recuperación ante desastres `scripts/generate-full-backup.js`.
- **v2.21.0 - Next-Gen Scheduling:** Reemplazo total del motor de calendario. Implementación de Wizard de 3 pasos, Grid personalizado y filtros de rango. Integración con Backend (Services) completada.
- **v3.5.0 - The Visual Update:** Migración completa al Design System 2.0 (Glassmorphism). Refactor UI de Dashboard, Agenda (Wizard + KPI Cards) y Facturación (POS Module).
- **v4.0.0 - The Commerce Release:** Activación del Nucleo Comercial. Integración Total POS-Inventario. Gestión Polimórfica (Productos/Servicios), Control de Stock en tiempo real y Transacciones Atómicas (Venta + Descuento).
- **v4.5.0 - The Unified Flow:** Cierre del ciclo de negocio (SaaS -> Clinical -> Financial -> Inventory).
  - **Agenda-Billing Bridge**: Flujo continuo desde Cita (Agenda) hacia Cobro (Caja) mediante router state.
  - **Smart POS**: Detección automática de intenciones de cobro, resolución de inventario y pre-llenado de tickets.
  - **Status**: Plataforma 100% Integrada.
- **v4.6.0 - Auth Shield & Super Admin Access:** Refactorización definitiva de `JwtStrategy` con "Bypass Rule" para el Super Admin y corrección del `SeedService` completada.

🧠 3. Lógica de Negocio y Multi-Tenancy

3.1 Identidad y Contexto (TenantContext.tsx)
El sistema resuelve "quién soy" siguiendo una jerarquía estricta gestionada reactivamente por la Cascada de Contextos:
Arquitectura de Providers (Strict Cascade):
AuthProvider (Base): Determina la identidad del usuario (user).
TenantProvider (Dependiente): Consume useAuth. Recalcula la configuración cada vez que user cambia.
Router/UI: Consume la configuración ya resuelta.
Lógica de Resolución:
Tenant Explícito (Switching): Prioridad Alta. Usado por Super Admin para impersonar (localStorage).
Usuario Logueado (Reactive): Prioridad Media. Si user.tenant.slug cambia (Login/Logout), el contexto se actualiza automáticamente sin F5.
Fallback Desarrollo: Prioridad Baja. Solo local (VITE_DEV_TENANT_ID).

3.2 Adaptación de Industria (Industry Adaptation)
El Core se adapta dinámicamente según la "Industria" del Tenant (CLINICAL | VET | EVENTS).
Terminología (useTerminology.ts):
CLINICAL (Solderma): Paciente, Historia Clínica, Médico.
VET (Dr. Pets): Mascota, Ficha Médica, Propietario.
CRAFT (El Mundo de Sara): Alumna, Proyecto, Detalles del Kit.
Detecta logos personalizados (URL en config.theme.logoUrl).
Si no hay logo, genera iconos temáticos (Azul/Naranja/Morado) dinámicamente.

3.4 Aislamiento de Módulos (Tenant Isolation)
El sistema utiliza FeatureGuard como barrera de contención para evitar la contaminación cruzada:
Lógica: FeatureGuard(moduleCode) verifica que el tenant actual tenga el módulo en active_modules.
Prevención: Incluso si un usuario conoce la URL de un módulo no contratado (ej: /veterinary), el Guard bloqueará el acceso con 403 Forbidden si el tenant no tiene la feature activada.
God Mode Bypass: El Super Admin atraviesa estas barreras para soporte, pero el aislamiento se mantiene para usuarios finales.

### 3.5 Arquitectura Modular (Capsule System)
El Dashboard V2 opera bajo un modelo de 'Shell Visual' + 'Widgets Dinámicos'. Los módulos (Pacientes, Ventas) inyectan sus propios componentes en el Dashboard si están activos.

3.6 Estrategia de Datos Polimórficos (Hybrid SQL/NoSQL)
El Problema (Sparse Data Risk):
En sistemas multi-industria, intentar modelar todo en SQL lleva a tablas con cientos de columnas vacías (ej: una columna raza estaría vacía para todos los pacientes humanos, y profesion vacía para las mascotas). Esto es insostenible.
La Solución (JSON Containment):
Utilizamos la columna data (JSONB/Simple JSON) como un contenedor flexible para todos los atributos específicos de la industria.
La Regla de Oro (The Golden Rule):
SQL Estricto: Solo para datos Universales e Indexables (ID, Tenant, Fecha de Creación, Nombre, DNI/Identificador). Estos garantizan búsquedas rápidas O(1).
JSON Payload: Para datos Específicos de Industria (Raza, Pelaje, Fototipo, Mapa Corporal). Estos cohabitan en el campo data y se renderizan dinámicamente.
Beneficio Estratégico ("Zero Migrations"):
Podemos agregar una funcionalidad completa de "Vacunación" o "Odontograma" sin ejecutar un solo ALTER TABLE. El Frontend define el esquema, y el Backend lo persiste ciegamente.

## 4. Tech Stack

💾 5. El Gemelo Digital (Storage & Audit)

5.1 Protocolo de Almacenamiento
Ruta: d:\DESARROLLO\aleg-app\backend\storage\
Jerarquía Estricta:
Plaintext/storage
  ├── /global-admin       # Archivos del sistema
  ├── /{tenant_slug}      # EJ: /clinica-solderma (AISLAMIENTO)
  │      ├── /uploads      # Logos, Assets
  │      ├── /_TRASH_      # Papelera de Reciclaje (Auditable)
  │      └── /{PatientUUID}            # EJ: a850998b...
  │             ├── INFO_{ID}_{NAME}.json  # 🧠 CEREBRO (Contexto)
  │             └── /YYYY-MM-DD            # Visitas (Records)
  │                  ├── REC_{ID}.json     # Procedimientos
  │                  └── foto_antes.jpg

4.2 Lógica de Papelera (audit-trash)
Soft Delete: Nada se elimina de verdad.
Flujo:
Usuario borra Paciente/Visita.
Backend mueve la carpeta a _TRASH_/{TIMESTAMP}_{ID}.
Se inyecta metadata de borrado en el JSON.
Verificación: Script scripts/verify-soft-delete.js audita este proceso.

4.3 Protocolo "Plastic Surgery" (Safe Patient Update)
El sistema implementa un protocolo estricto para la edición de pacientes (PatientsService.update) para garantizar la integridad del Gemelo Digital:
Merge Inteligente: Los datos recibidos (updateDto) se fusionan con los existentes, asegurando que campos críticos (DNI, Info preexistente) no se pierdan.
Renombrado Seguro: Si el nombre del paciente cambia:
Se calcula el nuevo nombre de archivo INFO_{HC}_{NEW_NAME}.json.
El archivo antiguo NO se sobrescribe ni borra; se mueve a la carpeta _TRASH_ como RENAMED_{TIMESTAMP}.json para auditoría.
Se escribe el nuevo archivo con los datos fusionados.
Persistencia Dual: Se actualiza simultáneamente MySQL y el JSON en disco.

🧪 5. Scripts y Automatización (DevOps)
Ubicación: `/scripts`. Ejecución via `node scripts/...` o `npm run ...`.

### 5.1 Universal Bootloader (New PC Ready)
El proyecto incluye un **Universal Bootloader** (`install.bat`) diseñado para configurar una PC desde cero en 1 click:
*   **Bypass de Políticas:** Desbloquea PowerShell automáticamente.
*   **Dependency Sensing:** Instala `node_modules` solo si faltan.
*   **Env Bootstrap:** Genera archivos `.env` desde plantillas.

🚨 Comandos Críticos (Production Ready)
| Script | Comando NPM | Función |
| :--- | :--- | :--- |
| **Reset** | `npm run reset` | Nuclear. Borra contenedores, volúmenes de BD (salva Storage) y reconstruye. |
| **Restore** | `npm run restore` | Setup Inicial. Restaura dependencias, levanta Docker y pobla datos mínimos. |
| **Seed** | `npm run seed` | Poblador. Crea inquilinos, genera staff, módulos y data dummy inteligente. |
| **Dev** | `npm run dev` | Smart Start. Orquestador que espera a MySQL antes de lanzar el Backend. |
| **Snapshot** | `npm run snapshot` | Backup. Git commit + push con validación de estado. |

🛠️ Herramientas de Calidad (Audit)
*   `verify-soft-delete.js`: Prueba automatizada del sistema de papelera.
*   `test-update-patient.js`: Valida el flujo "Plastic Surgery" (creación, edición, renombrado y consistencia JSON).
*   `verify_logic.js`, `verify_http.js`: Tests de integración rápidos.
*   `test-storage-unit.ts`: Unit testing del servicio de almacenamiento.

5.1 Motor Visual Clínico (Clinical Canvas)
Componente interactivo (ClinicalCanvas.tsx) que permite anotaciones anatómicas. layout reorganizado (Grid 2x2):
Disposición: Hallazgos (Top-Left), Mapa (Top-Right), Procedimientos (Bottom-Left), Motivo (Bottom-Right).
Polimorfismo Visual: getClinicalAssets sirve imágenes según la industria ("Humano" para Solderma, "Perro/Gato" para Dr. Pets).
Persistencia JSON: Los marcadores se guardan en MedicalRecord.data.bodyMap sin cambios SQL.
Responsive: Usa coordenadas relativas (%) para adaptarse a cualquier pantalla.

5.2 Motor de Documentos (PDF Engine)
Generador polimórfico de PDFs (@react-pdf/renderer) que respeta la identidad del Tenant:
Header Dinámico: Inyecta Logo/Nombre según TenantConfig.
Body Adaptativo: Muestra "Mascota y Raza" (VET) o "Edad" (CLINICAL).
Visualización Canvas: Reconstruye el Body Map usando primitivas PDF y coordenadas relativas, evitando screenshots pesados.
Zero-Backend: Generación 100% Client-Side para máxima velocidad y privacidad.

🗺️ 6. Mapa del Proyecto (Estructura Actualizada)
Plaintext
├── backend/                # NestJS API (Port 3000)
│   ├── src/
│   │   ├── tenants/        # Lógica Multi-Tenant (Service, Controller, Entity)
│   │   ├── patients/       # Core Médico (CRUD, PDF, Logic)
│   │   ├── billing/        # Suscripciones y Planes
│   │   └── marketplace/    # Módulos (Catálogo, FeatureGuard)
│   └── storage/            # VOLUMEN DOCKER (Persistencia Física)
├── frontend/               # React + Vite (Port 80/5173)
│   ├── src/
│   │   ├── context/        # AuthApp, TenantContext (Critical Logic)
│   │   ├── hooks/          # useTerminology (Industry Logic)
│   │   └── pages/          # Vistas por Módulo (Marketplace, Clinical, etc)
├── docker/                 # Configuración de Contenedores
│   └── init.sql            # Semilla SQL Base (Root User)
├── scripts/                # Automatización Node.js
└── docs/                   # Documentación Viva

🚀 7. Checklist de Estado (v3.5.0)

✅ Completado (Production Ready)
*   [x] **Core Multi-Tenant:** Solderma, Pets, Sara (CRAFT) completamente aislados.
*   [x] **Industry Adaptation:** Terminología y Branding dinámico por empresa.
*   [x] **Marketplace Engine:** Backoffice de módulos y UI con activación dinámica.
*   [x] **Security 2.8:** RolesGuard Global, God Mode y eliminación de Magic Strings.
*   [x] **Clean Seed:** Backend nace vacío. Seed externo robusto.
*   [x] **Storage Engine:** Sistema de archivos JSON con Papelera de Reciclaje.
*   [x] **Clinical Layout:** Grid 2x2 optimizado para gestión visual.
*   [x] **Safe Updates:** Protocolo "Plastic Surgery" para ediciones seguras y auditoría de renomrado.
*   [x] **Universal Bootloader:** `install.bat` para despliegue rápido.
*   [x] **Persistence Fix:** Docker Volume Bind Mount para `backend/storage`.
*   [x] **Design System 2.0:** Migración Visual del Dashboard, Agenda y Billing (POS). **(v3.5.0)**
*   [x] **Inventory Module:** Gestión polimórfica (Productos/Servicios) + Control de Stock.
*   [x] **Billing Module:** Motor de facturación, persistencia de Invoice/InvoiceItem y lógica de descuento de inventario.
*   [x] **POS Integration:** Base de datos de Productos, Buscador Real, Validación de stock y Transacción Atómica. **(v4.5.0)**
*   [x] **Unified Flow:** Agenda -> Caja Bridge. **(v4.5.0)**

🚧 Pendiente / Roadmap
*   [ ] **Smart Onboarding:** Instalador inteligente y wizards de configuración.
*   [ ] **Industry Analytics Engine:** Dashboards específicos para cada vertical (KPIs).
*   [ ] **Security Shield 2026:** Auditoría forense avanzada y Disaster Recovery Real-Time.
*   [ ] **App Móvil:** React Native bridge (Futuro).
*   [ ] **Pasarela de Pagos:** Integración real con Stripe/Niubiz.

🔐 8. Credenciales Maestras

8.1 Administradores de Cuenta (Dueños)

Entorno | Rol | Usuario | Password | Tenant
---|---|---|---|---
DEV/PROD | SaaS God | superadmin@alegapp.com | 123456 | global-admin
DEV | Solderma | administradora@solderma.com | 123456 | clinica-solderma
DEV | Dr. Pets | veterinaria@drpets.com | 123456 | dr-pets
DEV | El Mundo de Sara | coordinador@aspeten.com | 123456 | el-mundo-de-sara (CRAFT)

8.2 Staff Operativo (NUEVO)

Entorno | Rol | Usuario | Password | Tenant
---|---|---|---|---
DEV | Doctor | doctor@solderma.com | 123 | clinica-solderma
DEV | Veterinario | vet@drpets.com | 123 | dr-pets
DEV | Staff | staff@aspeten.com | 123 | el-mundo-de-sara
Nota Final: Este sistema está diseñado para escalar. Cualquier nuevo módulo debe seguir la arquitectura de backend/src/marketplace y registrarse en scripts/seed.js.

📚 HISTORIAL Y REQUERIMIENTOS CONSOLIDADOS (NEXUS PROTOCOL)
Esta sección consolida la verdad histórica y los requerimientos funcionales originales del proyecto "ALEG MEDIC" (v0.1) y su evolución técnica.
1. Mandatos Absolutos (Reglas de Oro)
Cero Código Basura: No se aceptan pruebas ni códigos de ejemplo. Todo debe ser código limpio, funcional y estructurado para producción.
Limpieza Proactiva: Eliminación proactiva de código muerto o indebido.
Proactividad en Seguridad: Implementación inmediata de mejoras de seguridad detectadas.
Migración Futura: Código listo para portar a App Móvil nativa (React Native).
2. Infraestructura y Arquitectura
Stack: Ubuntu Server (Proxmox opcional), Docker, Docker Compose (Portabilidad total).
Automatización: npm run reset / restore para arranque sin intervención humana.
Base de Datos (Multi-Tenant):
Una única BD global (aleg_global) con aislamiento lógico (tenantId en tablas clave).
Optimización "3 B" (Bueno, Bonito, Barato) para soportar múltiples empresas simultáneas.
Volúmenes: Persistencia mapeada (backend/storage -> /app/storage) para permitir movimiento físico de datos sin romper el sistema.
3. Estrategia de Respaldo y "Gemelo Digital"
Espejo Físico: Cada paciente y visita tiene una representación física en disco (storage/{tenant}/{patientID}).
JSON como Actas: DATOS_GENERALES.json y PROCEDIMIENTOS.json actúan como respaldo inmutable independiente de MySQL.
Sincronización Total:
Renombrado de carpeta si cambia el nombre del paciente.
Movimiento de archivos si cambia la fecha de visita.
Papelera de Reciclaje (Forensics):
Borrado Lógico: Archivos se renombran a .deleted o se mueven a _TRASH_.
Auditoría: Se registra quién borró qué y cuándo en los JSONs.
4. Seguridad de Evidencia (Túnel de Streaming)
Cero Acceso Público: La carpeta storage está bloqueada a la web pública.
Túnel Seguro: El Backend (MediaController) intercepta las peticiones de fotos, valida el Token JWT y permisos, y "retransmite" (stream) el archivo desde el disco blindado.
5. Funcionalidad Core
Ciclo de Vida:
Borrador (TEMP): ID temporal al crear o importar.
Oficial (HC): Asignación de ID secuencial (HC-0001) al aprobar. Renombrado automático de carpetas.
Importación Masiva (Anti-Caos):
Carga a "Bóveda de Preparación" (Staging).
Ordenamiento cronológico automático.
Validación antes de la inserción final en BD.
6. Roles y Accesos
Login Unificado: Pantalla única que enruta según rol.
Roles Clave:
Dueño (Super Admin): Ve todo (métricas globales, logs).
Gerente/Doctor (Tenant Admin/Staff): Ve solo su empresa.
Multilenguaje: Base Español/Inglés con capacidad de expansión.
🛠️ ANEXO TÉCNICO: MOTOR DE MARKETPLACE (Fase 1 y 2)
Este anexo consolida la auditoría del estado actual y la estrategia de expansión.
🕵️‍♂️ Fase 1: Auditoría del Estado Actual
La Verdad del Menú
Veredicto: El Frontend YA ES DINÁMICO.
Evidencia: En Sidebar.tsx, el menú se filtra basado en config.active_modules.
Conclusión: El sistema ya está preparado para verificar permisos. Si active_modules en la BD no tiene mod_logistics, el botón "Logística" no se pinta.
La Estructura de Datos
Veredicto: Semiestructurada (JSON).
Riesgo: Al ser JSON, no hay integridad referencial estricta, pero se ha implementado MarketplaceModule para mitigarlo.
El Riesgo de "Apagado"
Escenario: Si un usuario accede a una ruta bloqueada por URL.
Mitigación: Implementación de FeatureGuard global en NestJS que intercepte Requests y verifique tenant.config.active_modules.

🧠 Fase 2: Estrategia de Diseño (Marketplace Engine)
1. Lista Maestra de Módulos (The Catalog)
Definiremos una constante en Backend y Frontend (Shared Source of Truth) para evitar "Magic Strings".
Código Módulo | Nombre Legible | Descripción | Dependencias
:--- | :--- | :--- | :---
core-std | Standard Core | Pacientes, Citas, Dashboard Base. | Ninguna
mod_logistics | Logística Pro | Inventario, Proveedores. | core-std
mod_financial | Finanzas | Facturación, Caja Chica, Reportes. | core-std
mod_marketing | Marketing CRM | Campañas Email/WhatsApp. | core-std
mod_vet | Pack Veterinario | Historia Clínica Vet, Razas. | core-std
util_importer | Migrador Excel | Herramienta de carga masiva. | core-std
2. Cambios en Base de Datos (Migration Plan)
Aunque el JSON funciona, para un SaaS serio necesitamos Integridad y Querying.
Propuesta: Extraer active_modules a una tabla relacional o array nativo.
Decisión (MVP): Mantener config.active_modules en JSON por simplicidad ahora, PERO crear una entidad MarketplaceModule en BD para administrar el catálogo (precios, descripción, activo/inactivo).
Tabla Nueva: marketplace_modules (id, code, name, price, description).
3. Estrategia Frontend (Reactive Sidebar)
El Sidebar.tsx actual ya es correcto en lógica, pero necesita refinamiento UX:
Live Updates: Si el Super Admin te activa un módulo, el Tenant debería verlo sin recargar.
Menu Grouping: Agrupar items por módulo (Facturas, Gastos, Reportes bajo "Finanzas").
4. Seguridad Backend (Feature Guards)
Se implementa FeatureGuard global en NestJS para interceptar peticiones y validar que el Tenant tenga el módulo contratado antes de ejecutar la lógica.
TypeScript
// Ejemplo de uso en Controller
@UseGuards(FeatureGuard('mod_logistics'))
@Get('inventory')
getInventory() { ... }
5. Plan de Migración (Zero Downtime)
Backend: Crear el FeatureGuard pero dejarlo en modo "Warning Only" durante 24h.
Data Patch: Script que recorre todos los Tenants y asegura que tengan ['core-std'] en su config.
Activate: Enforzar el Guard.
🛣️ ROADMAP MACRO: ECOSISTEMA MULTI-TENANT
Evolución planificada hacia un Marketplace B2B completo.
- [x] **Fase 2: Motor Comercial y Datos** (Q1 2024) [COMPLETADO]
Business Profiles: Definición de verticales (Clínica, Veterinaria, Eventos).
Plans & Pricing: Estructura de suscripciones y planes (Basic, Pro, Enterprise).
Legal Trails: Auditoría legal de aceptación de términos y precios (Add-ons).
- [x] **Fase 3: Lógica de Negocio** (Q1 2024) [COMPLETADO]
Security Guards: Protección granular de endpoints basada en planes. **[COMPLETADO]**
Safety Locks: Bloqueo automático por falta de pago o expiración. **[COMPLETADO]**
Payments: Integración preliminar de pasarelas.
Fase 4: UX/Onboarding
Marketplace UI: Interfaz visual para comprar/activar módulos.
## 🛣️ Fase 4: SaaS Core Engine [COMPLETADO]
Evolución del núcleo para soporte masivo y personalización.

1.  **5.1: Motor de Planes (Pricing Engine) [COMPLETADO]**
    *   **Objetivo:** Gestión de planes y precios sin código.
    *   **Tech:** Entidades `Plan`, `Module`. Reparación de ruta `/admin/plans`.
    *   **UI:** Panel Super Admin para CRUD de Planes.

2.  **5.2: Perfiles de Industria (Industry Config) [COMPLETADO]**
    *   **Objetivo:** Configuración de módulos default por tipo de industria (Clinical, Vet, Craft, Events).
    *   **Tech:** `IndustryProfile` entity (JSON configuration).

3.  **5.3: Dashboard Dinámico (Layout System) [COMPLETADO]**
    *   **Objetivo:** Personalización de interfaz mediante Drag & Drop.
    *   **Tech:** `react-grid-layout`, persistencia JSON `layout_preferences`.
    *   **Lógica:** Nivel Global (Default) vs Nivel Tenant (Custom).

4.  **5.4: SaaS Genesis (Tenant Onboarding) [COMPLETADO]**
    *   **Objetivo:** Creación inteligente de Tenants basada en plantillas de industria.
    *   **Tech:** `TenantsService` factory, `IndustryTemplate`.

5.  **5.5: Tenant Customization (Self-Service) [COMPLETADO]**
    *   **Objetivo:** Autogestión del dashboard por parte del cliente.
    *   **Tech:** `PATCH /tenants/me/layout`, UI Drag & Drop.

## 🚀 FASE 5: PROTOTYPE UI/UX TRANSPLANT (Active Epic)
**Objetivo:** Integrar diseño, lógica y componentes de `aleg-app-prototipo` hacia `aleg-app` sin romper la lógica de negocio conectada.

*   **5.0: Security Cleanup [COMPLETADO]**
    *   Sanitización de `src/auth` y `src/saas`. Validación RBAC y eliminación de deuda técnica.
*   **5.1: Foundation Sync & Docker [COMPLETADO]**
    *   Porting de Tailwind Config, Global CSS y Componentes Base (UI Kit).
    *   Infraestructura Profesional Agnóstica (Docker, Postgres/MySQL).
*   **5.2: Auth & Onboarding (Login Stitch) [COMPLETADO]**
    *   Transplante de flujo de login y recuperación de contextos.
*   **5.3: Super Admin UI**
    *   Transplante de vistas de Perfil, Planes y Módulos.
*   **5.4: Shared Modules**
    *   UI Update para Agenda, Cobros y Pagos.
*   **5.5: Clinical Core**
    *   UI Update para Pacientes y Historias Clínicas (Derma/Vet).
*   **5.6: Public SaaS Onboarding**
    *   Flujo de Registro público.

## 🔮 Fase 6: Infraestructura & Backlog Futuro
Deuda técnica y expansión a largo plazo.

1.  **Storage Agnostic:** Abstracción total del almacenamiento (S3/GCS/Local).
2.  **Eventos Module:** Sistema de eventos y webhooks.
3.  **Cloud Ready:** Preparación para despliegue en Kubernetes/Serverless.
4.  **Firma Digital (SignaturePad):** Componente para aceptación legal de contratos en pantalla. moved from Phase 4.
5.  **App Móvil:** React Native bridge.