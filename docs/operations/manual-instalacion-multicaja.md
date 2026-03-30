# Manual de instalación – Modo multicaja (MySQL)

Guía operativa para usar una instalación tipo **servidor + cajas cliente** dentro de la misma red local.

## Escenario
- **Caja 1 (Servidor):** tiene MySQL Server instalado.
- **Caja 2+ (Clientes):** no requieren MySQL local.
- Todas las cajas deben estar en la misma red/LAN.

## Prerrequisitos
- Windows con privilegios de administrador.
- MySQL Server 8.0 en Caja 1.
- Script de setup disponible en el repositorio:
  - `docs/sql/setup-sistetecni-pos.sql`

---

## 1) Configurar Caja 1 (servidor)

### 1.1 Instalar y validar MySQL
1. Instalar **MySQL Server 8.0** (modo Standalone).
2. Guardar contraseña de `root`.
3. Confirmar que el servicio `MySQL80` esté **Running** (`services.msc`).

### 1.2 Crear base, usuario y permisos
Desde terminal/cmd (en la raíz del proyecto):

```bash
mysql -u root -p < docs/sql/setup-sistetecni-pos.sql
```

El script crea la base `sistetecni_pos` y el usuario operativo `pos_user`.

### 1.3 Habilitar acceso por red
Editar `my.ini` (ruta típica):

`C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`

Verificar:

```ini
[mysqld]
bind-address=0.0.0.0
port=3306
```

Reiniciar servicio:

```bash
net stop MySQL80
net start MySQL80
```

### 1.4 Abrir firewall de Windows
Ejecutar como administrador:

```bash
netsh advfirewall firewall add rule name="MySQL 3306" dir=in action=allow protocol=TCP localport=3306
```

### 1.5 Registrar IP del servidor
En Caja 1 ejecutar:

```bash
ipconfig
```

Guardar la IP LAN (ejemplo: `192.168.1.50`).

---

## 2) Configurar conexión en la app (Caja 1 y clientes)

En DevTools de la app (con la IP real de Caja 1):

```js
await window.api.mysql.setConfig({
  host: "192.168.1.50",
  port: 3306,
  user: "pos_user",
  password: "admin",
  database: "sistetecni_pos"
});

await window.api.mysql.test();
```

Si `test()` responde OK, la configuración quedó activa para esa caja.

---

## 3) Validar desde cajas cliente

### 3.1 Probar conectividad TCP
En PowerShell de cada cliente:

```powershell
Test-NetConnection 192.168.1.50 -Port 3306
```

Debe indicar `TcpTestSucceeded : True`.

### 3.2 Configurar app cliente
Aplicar el mismo `setConfig(...)` y `test()` usando la IP del servidor.

---

## 4) Credenciales y seguridad inicial
- Usuario inicial de app: `admin@sistetecni.com`
- Password inicial de app: `Admin123*`

Recomendaciones mínimas:
1. Cambiar password de app en primer inicio.
2. Cambiar password de MySQL `pos_user` en despliegues reales.
3. Restringir acceso al puerto 3306 solo a la subred interna.

---

## 5) Troubleshooting rápido
- **No conecta cliente a MySQL:** validar IP, firewall, `bind-address`, y que `MySQL80` esté activo.
- **`window.api.mysql.test()` falla:** revisar usuario/password y existencia de base `sistetecni_pos`.
- **Conecta por ping pero no por 3306:** regla firewall faltante o router/switch con aislamiento.
