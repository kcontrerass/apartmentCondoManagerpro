# 🏢 Adesso 365 - Sistema Integral de Gestión de Condominios

Bienvenido a **Adesso 365**, una plataforma web premium de grado empresarial diseñada para la gestión integral de condominios, complejos residenciales, edificios y complejos habitacionales. Este sistema unifica la administración, facturación, control de accesos, reservas de amenidades, reportes de incidentes y comunicación directa en una interfaz moderna, responsiva y altamente interactiva.

---

## 🛠️ Stack Tecnológico

El proyecto está construido utilizando tecnologías modernas y robustas de extremo a extremo:

*   **Frontend**: 
    *   **Framework**: [Next.js 15+](https://nextjs.org/) (utilizando el moderno **App Router**)
    *   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (tipado estricto)
    *   **Biblioteca de UI**: [React 19+](https://react.dev/)
    *   **Estilos (CSS)**: [Tailwind CSS 4.0](https://tailwindcss.com/) (para layouts ultra-fluidos e interfaces con diseño premium)
    *   **Animaciones**: [Framer Motion](https://www.framer.com/motion/) (para micro-interacciones suaves)
    *   **Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (validaciones seguras en cliente y servidor)
*   **Backend & Servicios**:
    *   **API**: Next.js API Routes / Server Actions
    *   **Autenticación**: [NextAuth.js v5 (Beta)](https://next-auth.js.org/) (Autenticación basada en sesiones seguras con cookies `httpOnly`)
    *   **ORM**: [Prisma ORM](https://www.prisma.io/) (con soporte nativo para modelado y relaciones complejas)
*   **Base de Datos**:
    *   **DBMS**: [MySQL 8.0](https://www.mysql.com/) o [MariaDB](https://mariadb.org/)
*   **Almacenamiento e Integraciones**:
    *   **Archivos / Documentos**: [AWS S3](https://aws.amazon.com/s3/) (para almacenamiento seguro de PDFs de facturas, fotos de perfil y evidencias)
    *   **Pasarela de Pagos**: [Recurrente](https://recurrente.com/) (pagos con tarjeta de crédito/débito en Quetzales, webhooks y sincronización automática)
    *   **Correos Electrónicos**: Brevo SMTP / Nodemailer (para envío de correos de recuperación de contraseña y alertas)
    *   **Seguridad y Spam**: Google reCAPTCHA v2 Checkbox ("No soy un robot")
    *   **Notificaciones**: Web Push (notificaciones nativas en el navegador)

---

## 📦 Módulos Principales del Sistema

1.  **Autenticación y Seguridad (RBAC)**: Flujo robusto con 5 roles definidos: Super Administrador, Administrador, Miembro de Junta Directiva, Guardia de Seguridad y Residente.
2.  **Gestión de Complejos y Unidades**: Control de múltiples complejos habitacionales y gestión detallada de apartamentos, casas o bodegas.
3.  **Gestión de Residentes**: Registro completo de propietarios y arrendatarios con fechas de contrato y contactos de emergencia.
4.  **Servicios Fijos e Individuales**: Asignación de servicios de mantenimiento, agua, basura y seguridad con tarifas configurables.
5.  **Sistema de Facturación Automática**: Generación mensual programada de facturas con desglose detallado de ítems y descarga en formato PDF.
6.  **Pasarela de Pagos**: Integración total con **Recurrente** para procesar pagos de facturas con tarjetas de crédito/débito directamente desde el panel.
7.  **Gestión de Amenidades y Reservas**: Calendario interactivo en tiempo real para reservar áreas comunes (casa club, piscina, canchas de tenis, etc.) con tarifas configurables.
8.  **Control de Acceso y Visitantes**: Registro y control de entradas/salidas de visitas generadas por los residentes mediante códigos y panel de guardia.
9.  **Avisos y Eventos**: Panel de comunicación comunitaria con confirmación de asistencia (RSVP).
10. **Reportes e Incidentes**: Flujo de tickets de soporte para reportar fallas en áreas comunes con opción de subir fotografías de evidencia.
11. **Módulo de Documentos**: Repositorio centralizado para reglamentos internos, actas de asamblea y políticas de convivencia.
12. **Reportería y Dashboard**: KPIs dinámicos, gráficas de ingresos contra egresos, tasas de morosidad y ocupación.

---

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener instalado en tu sistema local:

*   **Node.js**: Versión `v20.x` (LTS) o superior.
*   **npm**: Incluido con Node.js (se recomienda usar la versión estable).
*   **MySQL**: Instancia local corriendo (v8.0+) o una base de datos MySQL en la nube (ej: Railway, Neon, AWS RDS, etc.).
*   **Credenciales del Sistema (Opcional para desarrollo básico)**:
    *   Cuenta de AWS (para S3)
    *   Cuenta de Brevo (para SMTP)
    *   Cuenta de Recurrente (para tokens de sandbox/producción)
    *   Credenciales de Google reCAPTCHA v2 Checkbox

---

## 🚀 Guía de Instalación Paso a Paso

Sigue estos sencillos pasos para tener una copia de **Adesso 365** corriendo en tu máquina local desde cero:

### Paso 1: Clonar el Repositorio
Clona este repositorio en tu máquina local mediante Git:
```bash
git clone https://github.com/tu-usuario/adesso-365.git
cd adesso-365
```

### Paso 2: Instalar Dependencias
Instala todas las dependencias del proyecto especificadas en el `package.json`:
```bash
npm install
```

### Paso 3: Configurar las Variables de Entorno
El proyecto ya cuenta con un archivo `.env` configurado localmente con credenciales válidas y funcionales de prueba para la base de datos (MySQL en Railway), AWS S3, Brevo SMTP y Recurrente Sandbox. 

Por lo tanto, **no necesitas crear uno nuevo**. Simplemente asegúrate de que el archivo `.env` existe en la raíz de tu proyecto. 

*Nota: Si deseas configurar tu propia infraestructura en el futuro, puedes copiar el archivo de plantilla `.env.example` (`cp .env.example .env`) y rellenar tus propias credenciales siguiendo la sección de [Detalle de Variables de Entorno](#-detalle-de-variables-de-entorno-env) más abajo.*

### Paso 4: Configurar la Base de Datos y Prisma
Una vez configurado tu `DATABASE_URL` en el archivo `.env`, ejecuta los siguientes comandos para sincronizar los modelos de Prisma con tu base de datos:

1. **Generar el cliente de Prisma**:
   ```bash
   npx prisma generate
   ```

2. **Aplicar las migraciones a la base de datos (Creará las tablas automáticamente)**:
   ```bash
   npx prisma migrate dev --name init
   ```
   *Alternativamente, si solo estás probando de forma rápida sin registrar migraciones históricas:*
   ```bash
   npx prisma db push
   ```

### Paso 5: Poblar la Base de Datos con Datos de Prueba (Seed)
Para facilitar las pruebas del sistema con datos realistas (complejos habitacionales, apartamentos, tarifas de servicios y usuarios pre-registrados con roles específicos), corre el seeder de Prisma:
```bash
npx prisma db seed
```
*(Verás un mensaje de éxito: `🌱 Starting seed...` seguido de `✅ Seed finished successfully.`)*

### Paso 6: Correr el Servidor en Local
Inicia el entorno de desarrollo local de Next.js:
```bash
npm run dev
```
La aplicación estará disponible en: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Cuentas y Credenciales de Prueba (Seed)

Después de correr `npx prisma db seed`, puedes iniciar sesión inmediatamente en la plataforma utilizando las siguientes cuentas de prueba pre-generadas. 

> 🔒 **Contraseña común para todas las cuentas de prueba**: `admin123`

| Rol | Correo Electrónico | Complejo Asignado | Propósito / Funciones |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@condomanager.com` | Global (Todos) | Acceso total, configuraciones globales, ver todos los complejos y reportería general. |
| **Administrador** | `manager@condomanager.com` | Complex "Sunset" | Administración total del condominio Sunset (residentes, unidades, cuotas, amenidades). |
| **Administrador** | `admin2@condomanager.com` | Complex "Green Valley" | Administración total del condominio Green Valley (independiente). |
| **Miembro de Junta** | `board@condomanager.com` | Complex "Sunset" | Vista ejecutiva de finanzas, descarga de actas de asambleas e informes. |
| **Guardia de Seguridad** | `guard@condomanager.com` | Complex "Sunset" | Vista del panel de seguridad de garita, registrar accesos y validar visitas pre-autorizadas. |
| **Residente (Propietario)** | `resident1@example.com` | Sunset (Apto 101) | Vista del inquilino: pagar facturas con tarjeta, agendar amenidades y pre-registrar visitas. |
| **Residente (Inquilino)** | `resident2@example.com` | Sunset (Apto 102) | Vista del inquilino arrendatario (con permisos restringidos para compra/reservas según políticas). |
| **Residente (Propietario)** | `resident3@example.com` | Green Valley (Apto 101) | Residente del complejo Green Valley. |
| **Residente (Inquilino)** | `resident4@example.com` | Green Valley (Apto 102) | Residente del complejo Green Valley. |

---

## ⚙️ Detalle de Variables de Entorno (.env)

El proyecto utiliza variables de entorno para su correcto funcionamiento. A continuación se detallan las variables requeridas y opcionales:

### 1. Conexión de Base de Datos
*   `DATABASE_URL`: URL de conexión a la base de datos MySQL/MariaDB.
    *   *Ejemplo*: `mysql://usuario:contraseña@localhost:3306/condomanager`
    *   *Requerido*: Sí

### 2. Autenticación y URL de la Aplicación (NextAuth.js v5)
*   `NEXTAUTH_SECRET` / `AUTH_SECRET`: Clave secreta aleatoria utilizada para encriptar y firmar las cookies de sesión.
    *   *Ejemplo*: Puedes generar una clave segura con el comando `openssl rand -base64 32` en la terminal.
    *   *Requerido*: Sí
*   `NEXTAUTH_URL`: La URL base de la aplicación (usada en redirecciones de NextAuth).
    *   *Ejemplo local*: `http://localhost:3000`
    *   *Ejemplo producción*: `https://tu-condominio.vercel.app`
    *   *Requerido*: Sí
*   `NEXT_PUBLIC_APP_URL`: URL pública de la aplicación para enlaces de cliente (recuperación de contraseña, invitaciones, etc.). Debe coincidir con `NEXTAUTH_URL`.
    *   *Ejemplo*: `http://localhost:3000`
    *   *Requerido*: Sí

### 3. Google reCAPTCHA v2 (Seguridad frente a Bots)
*   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`: Clave pública de sitio web de Google reCAPTCHA v2 Checkbox ("No soy un robot").
    *   *Requerido*: Sí (para login/registro seguro)
*   `RECAPTCHA_SECRET_KEY`: Clave secreta de Google reCAPTCHA v2 Checkbox.
    *   *Requerido*: Sí (para validación en API Backend)

### 4. Almacenamiento en la Nube (AWS S3)
*   `AWS_ACCESS_KEY_ID`: ID de clave de acceso de un usuario IAM de AWS con permisos para subir y borrar archivos en S3.
    *   *Requerido*: Sí (para subida de comprobantes de pago, fotos y documentos)
*   `AWS_SECRET_ACCESS_KEY`: Clave de acceso secreta del usuario IAM de AWS.
    *   *Requerido*: Sí
*   `AWS_REGION`: Región geográfica del bucket de AWS S3.
    *   *Ejemplo*: `us-east-2`
    *   *Requerido*: Sí (por defecto `us-east-2`)
*   `AWS_S3_BUCKET`: Nombre del bucket de AWS S3.
    *   *Ejemplo*: `ocr-facturas`
    *   *Requerido*: Sí

### 5. Pasarela de Pagos (Recurrente.com)
*   `RECURRENTE_PUBLIC_KEY`: Clave pública provista por Recurrente para iniciar checkouts desde la aplicación.
    *   *Requerido*: Sí (para el pago en línea de residentes)
*   `RECURRENTE_SECRET_KEY`: Clave secreta para peticiones de backend seguras con la API de Recurrente.
    *   *Requerido*: Sí
*   `RECURRENTE_WEBHOOK_SECRET`: Token de firma digital de webhooks enviado por Recurrente para procesar la confirmación asíncrona de pagos automáticos.
    *   *Requerido*: Sí
*   `NEXT_PUBLIC_RECURRENTE_FEE_PCT`: Porcentaje de comisión cobrado por la pasarela de pagos para ser trasladado opcionalmente al usuario.
    *   *Ejemplo*: `4.5` (4.5%)
    *   *Requerido*: No (por defecto `4.5`)
*   `NEXT_PUBLIC_RECURRENTE_FEE_FIXED_GTQ`: Comisión fija en quetzales cobrada por la pasarela por transacción.
    *   *Ejemplo*: `2` (Q2.00)
    *   *Requerido*: No (por defecto `2`)

### 6. Cobros de Suscripción de la Plataforma (Súper Administrador)
*   `PLATFORM_RECURRENTE_PUBLIC_KEY` / `PLATFORM_RECURRENTE_SECRET_KEY` / `PLATFORM_RECURRENTE_WEBHOOK_SECRET`: Llaves independientes de Recurrente para el cobro mensual del software de Adesso 365 a los complejos afiliados. Si no se especifican, se utilizarán las globales de `RECURRENTE_*`.
*   `PLATFORM_SUBSCRIPTION_PRICE_GTQ`: Precio mensual de la suscripción base de la plataforma en Quetzales. (Por defecto `199`).
*   `PLATFORM_SUBSCRIPTION_PERIOD_MONTHS`: Duración de la facturación de la suscripción en meses. (Por defecto `1`).

### 7. Envío de Correos (Brevo SMTP / Resend)
*   `SMTP_HOST`: Host del servidor SMTP para el envío de correos.
    *   *Ejemplo*: `smtp-relay.brevo.com`
    *   *Requerido*: Sí (para flujos de recuperación de contraseña)
*   `SMTP_PORT`: Puerto de conexión del servidor SMTP (comúnmente `587` o `465`).
    *   *Requerido*: Sí (por defecto `587`)
*   `SMTP_USER`: Usuario/correo de conexión SMTP.
    *   *Requerido*: Sí
*   `SMTP_PASSWORD`: Contraseña / API Key provista por el proveedor SMTP.
    *   *Requerido*: Sí
*   `BREVO_API_KEY`: Clave API V3 de Brevo para envío directo mediante SDK en su lugar.
    *   *Requerido*: Opcional
*   `EMAIL_FROM`: Remitente autorizado para el envío de correos (Formato: `"Nombre" <correo@dominio.com>`).
    *   *Ejemplo*: `"Adesso365" <jules827827@gmail.com>`
    *   *Requerido*: Sí
*   `EMAIL_APP_NAME`: Nombre del software utilizado en las plantillas de correo.
    *   *Ejemplo*: `Condo Manager`
    *   *Requerido*: No
*   `RESEND_API_KEY`: API Key de Resend en caso de optar por este servicio para notificaciones de correo.
    *   *Requerido*: Opcional

### 8. Notificaciones Push (Web Push / VAPID)
*   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Clave pública de firma del protocolo VAPID para envío de notificaciones push directas en dispositivos móviles o navegadores.
    *   *Requerido*: Sí (para habilitar suscripción a notificaciones push en garita o incidentes)
*   `VAPID_PRIVATE_KEY`: Clave privada del protocolo VAPID.
    *   *Requerido*: Sí
*   `CRON_SECRET`: Clave de seguridad para asegurar la ejecución del endpoint cron que automatiza tareas diarias.
    *   *Requerido*: Sí

---

## 🛠️ Scripts Disponibles (package.json)

Puedes ejecutar los siguientes comandos mediante `npm run <script>` desde la raíz del proyecto:

*   `npm run dev`: Inicia el servidor de desarrollo local de Next.js en el puerto `3000`.
*   `npm run build`: Compila la aplicación Next.js y genera la versión optimizada de producción.
*   `npm run start`: Inicia el servidor de producción de Next.js (requiere haber ejecutado `npm run build` antes).
*   `npm run lint`: Ejecuta el validador estático de código ESLint para buscar problemas de código o TypeScript.
*   `npm run db:backup`: Ejecuta un script personalizado para crear un backup de la base de datos MySQL en formato `.sql` dentro del directorio `prisma/backups`.
*   `npm run docs:informe-pdf`: Genera automáticamente un informe técnico y de arquitectura completo en formato PDF utilizando PDFKit.
*   `npm run set-super-admin-password`: Permite actualizar o establecer de manera segura la contraseña de un Súper Administrador desde la terminal.
*   `npm run verify-platform-recurrente`: Verifica que las llaves configuradas de la pasarela Recurrente sean correctas y estén activas.
*   `npx prisma studio`: Abre una interfaz web interactiva en tu navegador para ver, crear y modificar registros de base de datos directamente de forma visual en `http://localhost:5555`.

---

## 📂 Estructura Principal del Proyecto

```
adesso-365/
├── prisma/
│   ├── schema.prisma           # Definición de modelos de base de datos MySQL
│   ├── seed.ts                 # Datos iniciales y usuarios de prueba (seeders)
│   └── backups/                # Respaldos de base de datos automatizados
├── scripts/                    # Scripts utilitarios (backups, reportes, utilidades CLI)
├── public/                     # Recursos públicos estáticos (imágenes, iconos, PWA)
├── src/
│   ├── app/                    # Rutas de Next.js (App Router)
│   │   ├── (auth)/             # Vistas de autenticación (Login, Recuperación)
│   │   ├── (dashboard)/        # Paneles e interfaces de administración y residentes
│   │   ├── api/                # Endpoints de API REST expuestos
│   │   ├── layout.tsx          # Contenedor principal de la app
│   │   └── globals.css         # Archivo global de estilos Tailwind CSS
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Elementos básicos de diseño (botones, inputs, modales, etc.)
│   │   ├── forms/              # Formularios con lógica de React Hook Form
│   │   ├── layouts/            # Layouts del dashboard y barras de navegación
│   │   └── charts/             # Componentes de reportes gráficos
│   ├── lib/                    # Configuración de clientes (Prisma, S3, Email, Recurrente, etc.)
│   │   ├── s3.ts               # Integración de subidas de archivos en AWS S3
│   │   ├── db.ts               # Inicializador único de Prisma Client
│   │   ├── recurrente.ts       # SDK local y llamadas a la API de Recurrente
│   │   └── email/              # Configuración y layouts de correo SMTP
│   ├── types/                  # Definiciones globales de tipos de TypeScript
│   ├── hooks/                  # Custom Hooks de React personalizados
│   └── middleware.ts           # Middleware de NextAuth para la protección de rutas
├── .env.example                # Archivo de plantilla para variables de entorno
├── next.config.ts              # Configuración avanzada de Next.js
├── tailwind.config.ts.bak      # Backup de configuraciones de Tailwind
└── tsconfig.json               # Configuración del compilador TypeScript
```


*Desarrollado y mantenido con dedicación para una experiencia de vida residencial de primer nivel. ¡Mucho éxito en el despliegue de **Adesso 365**!* 🚀
