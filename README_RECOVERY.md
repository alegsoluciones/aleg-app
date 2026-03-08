# 🆘 RECOVERY PROTOCOL (PROTOCOLO LÁZARO)

Este documento detalla cómo restaurar el sistema completo en caso de fallo catastrófico o migración de servidor.

## Requisitos Previos
- Servidor limpio con Node.js (v18+) instalado.
- Servidor MySQL (v8.0+) corriendo y accesible.
- Los archivos de respaldo `BACKUP_CORE_*.zip` y `BACKUP_STORAGE_*.zip`.

## Paso 1: Restaurar el Núcleo (CORE)
1. Descomprime `BACKUP_CORE_{Date}.zip` en la raíz del proyecto.
2. Restaura la base de datos:
   ```bash
   # Si usas terminal
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS aleg_global;"
   mysql -u root -p aleg_global < database_dump.sql
   ```
   *(O usa Workbench/DBeaver para importar `database_dump.sql`)*.
3. Verifica que los archivos `.env`, `ormconfig.json` y `package.json` estén en su lugar.
4. Instala dependencias: `npm install`.

## Paso 2: Restaurar Archivos (STORAGE)
1. Descomprime `BACKUP_STORAGE_{Date}.zip` en la carpeta `backend/`.
   - Asegúrate de que quede en `backend/storage/`.
   - Si existía una carpeta `storage` previa, **borrarla antes de descomprimir** para evitar mezclas corruptas.

## Paso 3: Reactivación
1. Arranca el backend: `npm run dev`.
2. Verifica el acceso en Dashboard y carga de imágenes.

---
> **NOTA:** Los backups de almacenamiento ignoran la carpeta `_TRASH_` por eficiencia. Si necesitas recuperar archivos borrados recientemente, esos no estarán en este backup.
