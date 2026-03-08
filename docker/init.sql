-- INIT.SQL - Initial Privileges (Safe Mode)
-- Permitir acceso remoto a root sin borrar el usuario localhost (necesario para Healthchecks)
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;