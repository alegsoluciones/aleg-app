# 🏥 ALEG MEDIC - Core System

Plataforma SaaS Multi-tenant para gestión clínica dermatológica. Integra historia clínica electrónica, gestión de evidencias fotográficas y migración masiva de datos.

---

## 🏗️ Arquitectura y Tecnologías

El sistema se divide en dos monolitos desacoplados:

### 1. BACKEND (`/backend`)
* **Framework:** NestJS (Node.js).
* **BD:** MySQL 8.0.
* **ORM:** TypeORM.
* **Módulos Principales:**
    * `AppModule`: Orquestador principal.
    * `TenantsModule`: Manejo de aislamiento de datos (Multi-tenant). Conecta a `aleg_medic_core` para buscar la config y luego conecta a la BD del cliente (ej. `aleg_solderma`).
    * `PatientsModule`: Lógica de negocio (CRUD Pacientes, Historias, Fotos).
    * `MigrationModule`: Servicio `ExcelMigrationService` (basado en `xlsx`) para importar datos históricos.
* **Seguridad:** DTOs con `class-validator`.

### 2. FRONTEND (`/frontend`)
* **Framework:** React 18 + Vite 6.
* **Lenguaje:** TypeScript.
* **Estilos:** Tailwind CSS v4 (vía `@tailwindcss/vite`).
* **Estado:** Custom Hooks (`usePatients`).
* **Componentes Clave:**
    * `MedicalRecordCard`: Tarjeta de historia clínica con zoom y edición.
    * `App`: Layout principal SPA.

---

## 📜 Scripts de Automatización (DevOps Local)

Estos scripts ubicados en la raíz controlan el ciclo de vida del proyecto:

| Script | Función | Detalle Técnico |
| :--- | :--- | :--- |
| **`./setup.sh`** | **Instalación** | Instala `node_modules` en front y back. Genera `backend/.env` con credenciales por defecto si no existe. |
| **`./start.sh`** | **Arranque** | Mata procesos previos (puertos 3000/5173) y lanza ambos entornos en paralelo (`&`). |
| **`./init_solderma.sh`** | **Semilla (Seed)** | Envía un POST al backend para registrar la clínica "Solderma" en `aleg_medic_core`. Se ejecuta auto al iniciar `start.sh`. |
| **`./reset.sh`** | **Limpieza Total** | ⚠️ **Borra BDs** `aleg_medic_core` y `aleg_solderma`. Borra fotos en `backend/storage`. |

---

## 🚀 Guía de Despliegue

1. **Base de Datos:**
   Asegúrate de tener MySQL corriendo. Crea la base de datos vacía:
   ```sql
   CREATE DATABASE aleg_medic_core;
Configuración (backend/.env):

Fragmento de código

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root_password_segura
DB_NAME=aleg_medic_core
Instalación:

Bash

chmod +x *.sh
./setup.sh
Ejecución:

Bash

./start.sh
El sistema detectará que la clínica no existe y ejecutará ./init_solderma.sh automáticamente.

© 2026 ALEG Soluciones