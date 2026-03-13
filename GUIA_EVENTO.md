# Guía de Configuración - Día del Evento (Sin Internet)

## 🎯 Objetivo
Que todos los dispositivos (admin, staff, participantes) puedan usar la app **sin conexión a internet**, estando en la misma red WiFi.

---

## 📋 Requisitos Previos

### Hardware Necesario
- **1 Laptop/PC** con XAMPP instalado (servidor)
- **1 Router/Access Point** (o usar el WiFi del lugar)
- **Varios dispositivos móviles** (tablets/celulares para staff y scanner)

### Software
- XAMPP con Apache y MySQL corriendo
- La app Ionic compilada o sirviendo desde el PC

---

## 🔧 Configuración del Servidor (PC Principal)

### Paso 1: Asignar IP Fija al PC

1. Ve a: **Panel de Control > Centro de redes y recursos compartidos > Cambiar configuración del adaptador**
2. Click derecho en tu WiFi > **Propiedades**
3. Doble click en **Protocolo de Internet versión 4 (TCP/IPv4)**
4. Configura:
   - ✅ Usar la siguiente dirección IP
   - IP: `192.168.1.100`
   - Máscara: `255.255.255.0`
   - Puerta de enlace: `192.168.1.1`
   - DNS: `8.8.8.8` (opcional)

### Paso 2: Configurar XAMPP

1. Abre **XAMPP Control Panel**
2. Asegúrate de que estén corriendo:
   - ✅ **Apache** (puerto 80)
   - ✅ **MySQL** (puerto 3306)
3. Click en **Config** de Apache > **httpd.conf**
4. Busca `Listen 80` y cámbialo a:
   ```
   Listen 192.168.1.100:80
   ```

### Paso 3: Permitir Acceso desde Otros Dispositivos

1. En el archivo `C:\xampp\apache\conf\extra\httpd-xampp.conf`
2. Busca y modifica:
   ```apache
   Require all granted
   ```
   (Esto permite que cualquier dispositivo de la red acceda)

### Paso 4: Verificar que MySQL Acepte Conexiones Remotas

1. Edita `C:\xampp\mysql\my.ini`
2. Busca `bind-address=127.0.0.1` y cámbialo a:
   ```
   bind-address=0.0.0.0
   ```

### Paso 5: Reiniciar XAMPP

Detén y vuelve a iniciar Apache y MySQL.

---

## 📱 Configuración de la App (Dispositivos Móviles)

### Opción A: Servir la App desde el PC (Recomendado)

1. En el PC, corre el servidor Ionic:
   ```bash
   cd FrancofoniApp
   npm start
   ```

2. Busca tu IP local:
   ```bash
   ipconfig
   ```
   (Busca "Dirección IPv4": algo como `192.168.1.100`)

3. En los dispositivos móviles, ingresa:
   ```
   http://192.168.1.100:4200
   ```

### Opción B: Compilar como APK (Más Estable)

1. En el PC:
   ```bash
   cd FrancofoniApp
   ionic capacitor add android
   ionic capacitor build android
   ```

2. El APK se genera en: `android/app/build/outputs/apk/debug/`

3. Instala el APK en cada dispositivo:
   - Envía el APK por email/WhatsApp
   - O usa un cable USB

---

## 🔑 Credenciales para el Día del Evento

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@francofonia.com | admin123 |
| Staff | stand1@francofonia.com | admin123 |
| Staff | stand2@francofonia.com | admin123 |
| Staff | stand3@francofonia.com | admin123 |
| Staff | stand4@francofonia.com | admin123 |
| Staff | stand5@francofonia.com | admin123 |

---

## ⚠️ IMPORTANTE: Verificar Antes del Evento

### Checklist del Día Anterior

- [ ] PC servidor prendido y conectado a la WiFi del evento
- [ ] XAMPP corriendo (Apache + MySQL)
- [ ] IP del servidor confirmada (192.168.1.100)
- [ ] Probar acceso desde un celular: `http://192.168.1.100:4200`
- [ ] Login de admin funciona
- [ ] Crear un participante de prueba y verificar que se envíe el correo (si hay internet) o que se genere el QR

### Checklist el Día del Evento (Mañana Temprano)

- [ ] Encender PC y verificar XAMPP
- [ ] Confirmar que la WiFi del evento es la misma que el PC
- [ ] Probar login con un dispositivo de staff
- [ ] Probar el scanner QR con un participante de prueba
- [ ] Verificar que los reportes funcionen

---

## 🔍 Solución de Problemas

### No puedo acceder desde el celular

1. Verifica que estén en la **misma WiFi**
2. Verifica que el firewall de Windows permita conexiones:
   - Panel de Control > Firewall > Permitir una aplicación
   - Asegúrate que Apache esté permitido
3. Prueba hacer ping desde el celular:
   - Android: usa la app "Ping"
   - O abre cmd y escribe: `ping 192.168.1.100`

### La app no conecta a la base de datos

1. Verifica que MySQL esté corriendo en XAMPP
2. Verifica que la IP en la app sea correcta
3. Revisa el archivo `src/environments/environment.ts`:
   ```typescript
   localApiUrl: 'http://192.168.1.100/FRANCOFONIA/FrancofoniApp1/api'
   ```

### El scanner QR no funciona

1. Asegúrate de dar permisos de cámara a la app
2. En iOS, puede ser necesario usar HTTPS (más complejo)

---

## 📞 Contacto de Soporte

Si tienes problemas durante el evento, contacta al equipo técnico.

---

**Nota**: Esta configuración es solo para el día del evento. Para funcionar desde cualquier lugar con internet, se necesita cambiar la configuración a Firebase.
