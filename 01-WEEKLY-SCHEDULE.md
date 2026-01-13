# Planificación Detallada por Semana - 3 Semanas de Desarrollo

## 📅 SEMANA 1: FUNDAMENTOS Y CORE DEL SISTEMA

**Objetivo**: Establecer la base técnica y los módulos core del sistema
**Entregable**: Autenticación, Gestión de Complejos, Unidades, Residentes y Servicios

---

### DÍA 1 - Lunes: Setup e Infraestructura Base

#### 🎯 Objetivos del Día
- Proyecto inicializado y configurado
- Entorno de desarrollo listo
- Componentes UI base disponibles

#### Dev A - Backend/Infraestructura (8h)

**Tareas**:
```
□ Setup Next.js 15 + TypeScript
  - npx create-next-app@latest condo-manager --typescript --tailwind --app
  - Configurar tsconfig.json (strict mode)
  
□ Configurar Tailwind CSS 4
  - tailwind.config.js personalizado
  - Tema custom (colores, fuentes, espaciados)
  
□ Setup Prisma ORM
  - npm install prisma @prisma/client
  - npx prisma init
  - Configurar schema.prisma básico
  - Configurar conexión a MySQL/MariaDB externa
  
□ Configurar AWS S3
  - npm install @aws-sdk/client-s3
  - Crear lib/s3.ts con funciones de upload
  - Configurar buckets y permisos
  
□ Estructura de carpetas del proyecto
  - Crear estructura de /src
  - Crear estructura de /app
  - Configurar aliases en tsconfig (@/components, @/lib, etc.)
  
□ Variables de entorno
  - Crear .env.example con todas las vars necesarias
  - Documentar cada variable
  
□ Git setup
  - git init
  - Crear .gitignore apropiado
  - Primer commit
  - Crear rama develop
```

**Archivos a Crear**:
- `/prisma/schema.prisma` (esqueleto inicial)
- `/src/lib/prisma.ts` (cliente Prisma singleton)
- `/src/lib/s3.ts` (funciones S3)
- `/.env.example`
- `/README.md` (setup instructions)

**Commits Esperados**:
1. `chore: initial Next.js setup with TypeScript`
2. `chore: configure Tailwind CSS with custom theme`
3. `feat: setup Prisma ORM and database connection`
4. `feat: configure AWS S3 integration`
5. `docs: add environment variables documentation`

---

#### Dev B - Frontend Base (8h)

**Tareas**:
```
□ Configurar design system
  - Definir paleta de colores en tailwind.config
  - Definir tipografía (fuentes, tamaños)
  - Definir espaciados y breakpoints
  
□ Componentes UI primitivos
  - components/ui/Button.tsx (variants: primary, secondary, danger)
  - components/ui/Input.tsx (text, email, password, number)
  - components/ui/Select.tsx
  - components/ui/Checkbox.tsx
  - components/ui/Radio.tsx
  - components/ui/Card.tsx
  - components/ui/Modal.tsx
  - components/ui/Alert.tsx
  - components/ui/Badge.tsx
  - components/ui/Spinner.tsx
  
□ Layout components
  - components/layouts/MainLayout.tsx
  - components/layouts/Sidebar.tsx
  - components/layouts/Header.tsx
  - components/layouts/Footer.tsx
  
□ Setup React Hook Form + Zod
  - npm install react-hook-form zod @hookform/resolvers
  - Crear helper para forms en lib/form-utils.ts
  
□ Next.js Image configuration
  - Configurar domains permitidos
  - Crear componente Avatar wrapper
  
□ Error handling
  - app/error.tsx (error boundary)
  - app/not-found.tsx (404 page)
  - app/loading.tsx (loading skeleton)
```

**Archivos a Crear**:
- `/src/components/ui/*` (10+ componentes)
- `/src/components/layouts/*` (4 layouts)
- `/tailwind.config.js` (configuración completa)
- `/src/lib/form-utils.ts`
- `/src/types/common.ts`

**Commits Esperados**:
1. `feat: create design system and Tailwind configuration`
2. `feat: implement primitive UI components`
3. `feat: create layout components`
4. `feat: setup React Hook Form and Zod validation`
5. `feat: add error boundaries and loading states`

---

#### ✅ Entregables Día 1
- [ ] Proyecto en Git con estructura completa
- [ ] Configuración de desarrollo documentada
- [ ] 10+ componentes UI reutilizables
- [ ] Conexión a BD configurada
- [ ] S3 configurado y funcional
- [ ] README con instrucciones de setup

---

### DÍA 2 - Martes: Base de Datos y Autenticación

#### 🎯 Objetivos del Día
- Schema de base de datos core implementado
- Sistema de autenticación completo
- Protección de rutas funcional

#### Dev A - Schema DB + Auth Backend (8h)

**Tareas**:
```
□ Diseñar e implementar schema Prisma
  Model User:
    - id, email, password, name, phone
    - role (SUPER_ADMIN, ADMIN, OPERATOR, GUARD, RESIDENT)
    - status (ACTIVE, INACTIVE, SUSPENDED)
    - createdAt, updatedAt
    - relations: complex, resident profile
    
  Model Complex:
    - id, name, address, type, logo_url
    - settings (JSON)
    - createdAt, updatedAt
    
  Model Unit:
    - id, number, type, complex_id
    - bedrooms, bathrooms, area
    - status (OCCUPIED, VACANT, MAINTENANCE)
    
  Model Resident:
    - id, user_id, unit_id
    - type (OWNER, TENANT)
    - start_date, end_date
    - emergency_contact
    
□ Generar migraciones
  - npx prisma migrate dev --name init
  
□ Crear seeders
  - prisma/seed.ts
  - Usuario super admin por defecto
  - Complejo de ejemplo
  - Unidades de ejemplo
  
□ Implementar NextAuth.js v5
  - npm install next-auth@beta
  - app/api/auth/[...nextauth]/route.ts
  - Credentials provider
  - JWT strategy
  
□ API de autenticación
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  
□ Middleware de autenticación
  - middleware.ts
  - Proteger rutas /dashboard/*
  - Verificar JWT
  
□ Sistema RBAC
  - lib/auth-utils.ts
  - Helpers: hasRole(), can()
  - Decorators para endpoints
```

**Schema Prisma Completo**:
```prisma
// Ver archivo separado: prisma-schema-day2.prisma
```

**Archivos a Crear**:
- `/prisma/schema.prisma` (completo)
- `/prisma/migrations/*`
- `/prisma/seed.ts`
- `/src/app/api/auth/[...nextauth]/route.ts`
- `/src/app/api/auth/register/route.ts`
- `/src/lib/auth.ts`
- `/src/lib/auth-utils.ts`
- `/src/middleware.ts`

**Commits Esperados**:
1. `feat: create database schema for users, complexes, units`
2. `feat: implement NextAuth.js authentication`
3. `feat: create registration and login APIs`
4. `feat: add route protection middleware`
5. `feat: implement RBAC system`

---

#### Dev B - UI de Autenticación (8h)

**Tareas**:
```
□ Página de Login
  - app/(auth)/login/page.tsx
  - Formulario con email y password
  - Validación con Zod
  - Mensajes de error
  - Link a registro
  - Link a recuperación
  
□ Página de Registro
  - app/(auth)/register/page.tsx
  - Formulario completo
  - Validación de passwords (match)
  - Términos y condiciones checkbox
  
□ Recuperación de contraseña
  - app/(auth)/forgot-password/page.tsx
  - app/(auth)/reset-password/page.tsx
  - Formularios correspondientes
  
□ Protección de rutas (client-side)
  - components/auth/ProtectedRoute.tsx
  - Hooks: useAuth(), useUser()
  - Redirecciones automáticas
  
□ Manejo de sesión
  - Context: AuthContext
  - Persistencia de sesión
  - Logout automático (token expiration)
  
□ UI feedback
  - Loading states en forms
  - Success/error messages
  - Toast notifications
```

**Archivos a Crear**:
- `/src/app/(auth)/login/page.tsx`
- `/src/app/(auth)/register/page.tsx`
- `/src/app/(auth)/forgot-password/page.tsx`
- `/src/app/(auth)/reset-password/page.tsx`
- `/src/components/auth/ProtectedRoute.tsx`
- `/src/context/AuthContext.tsx`
- `/src/hooks/useAuth.ts`
- `/src/types/auth.ts`

**Commits Esperados**:
1. `feat: create login page with validation`
2. `feat: create registration page`
3. `feat: add password recovery flow`
4. `feat: implement client-side route protection`
5. `feat: add auth context and hooks`

---

#### ✅ Entregables Día 2
- [ ] Base de datos con 4+ tablas migradas
- [ ] Seeders con datos de prueba
- [ ] Login/Registro funcional
- [ ] Protección de rutas (backend y frontend)
- [ ] Sistema RBAC implementado
- [ ] Tests básicos de autenticación

---

### DÍA 3 - Miércoles: Dashboard y Gestión de Complejos

#### 🎯 Objetivos del Día
- CRUD completo de Complejos Habitacionales
- Dashboard funcional por rol
- Upload de imágenes a S3

#### Dev A - Backend Complejos (8h)

**Tareas**:
```
□ Extender schema Prisma
  Model ComplexType:
    - id, name (Edificio, Residencial, Condominio)
  
  Model Amenity:
    - id, name, type, complex_id
    - operating_hours, capacity
    - cost_per_day, cost_per_hour
    
□ API CRUD Complejos
  GET    /api/complexes          (listar, con filtros)
  GET    /api/complexes/:id      (detalle)
  POST   /api/complexes          (crear)
  PUT    /api/complexes/:id      (actualizar)
  DELETE /api/complexes/:id      (eliminar)
  
□ Validaciones con Zod
  - ComplexCreateSchema
  - ComplexUpdateSchema
  - Validar campos requeridos
  
□ Permisos por rol
  - Solo SUPER_ADMIN y ADMIN pueden crear/editar
  - OPERATOR solo lectura
  - RESIDENT no tiene acceso
  
□ Upload de logo a S3
  POST /api/upload/complex-logo
  - Validar tipo de archivo (jpg, png)
  - Validar tamaño (max 5MB)
  - Redimensionar imagen
  - Retornar URL de S3
  
□ Estadísticas para dashboard
  GET /api/dashboard/stats
  - Total de complejos
  - Total de unidades
  - Ocupación %
  - Ingresos del mes
```

**Archivos a Crear**:
- `/src/app/api/complexes/route.ts`
- `/src/app/api/complexes/[id]/route.ts`
- `/src/app/api/upload/complex-logo/route.ts`
- `/src/app/api/dashboard/stats/route.ts`
- `/src/lib/validations/complex.ts`
- `/src/types/complex.ts`

**Commits Esperados**:
1. `feat: extend database schema for complexes and amenities`
2. `feat: implement CRUD API for complexes`
3. `feat: add Zod validation schemas`
4. `feat: implement S3 image upload for logos`
5. `feat: create dashboard statistics endpoint`

---

#### Dev B - UI Gestión Complejos (8h)

**Tareas**:
```
□ Dashboard principal
  - app/dashboard/page.tsx
  - Cards con estadísticas (según rol)
  - Gráficas básicas (recharts)
  - Accesos rápidos a módulos
  - Actividad reciente
  
□ Listado de complejos
  - app/dashboard/complexes/page.tsx
  - Tabla con búsqueda y filtros
  - Paginación
  - Acciones: Ver, Editar, Eliminar
  - Botón "Nuevo Complejo"
  
□ Formulario crear/editar complejo
  - app/dashboard/complexes/new/page.tsx
  - app/dashboard/complexes/[id]/edit/page.tsx
  - Campos: nombre, dirección, tipo, descripción
  - Upload de logo con preview
  - Validación en tiempo real
  
□ Detalle de complejo
  - app/dashboard/complexes/[id]/page.tsx
  - Información general
  - Estadísticas del complejo
  - Lista de unidades
  - Lista de amenidades
  
□ Componentes reutilizables
  - components/complexes/ComplexCard.tsx
  - components/complexes/ComplexTable.tsx
  - components/complexes/ComplexForm.tsx
  - components/ui/ImageUpload.tsx
  
□ Navegación
  - Sidebar con menú por rol
  - Breadcrumbs
  - User menu (perfil, logout)
```

**Archivos a Crear**:
- `/src/app/dashboard/page.tsx`
- `/src/app/dashboard/complexes/page.tsx`
- `/src/app/dashboard/complexes/new/page.tsx`
- `/src/app/dashboard/complexes/[id]/page.tsx`
- `/src/app/dashboard/complexes/[id]/edit/page.tsx`
- `/src/components/complexes/*`
- `/src/components/ui/ImageUpload.tsx`
- `/src/hooks/useComplexes.ts`

**Commits Esperados**:
1. `feat: create dashboard with statistics`
2. `feat: implement complexes listing page`
3. `feat: add create/edit complex forms`
4. `feat: create complex detail page`
5. `feat: add image upload component`

---

#### ✅ Entregables Día 3
- [ ] CRUD completo de Complejos
- [ ] Dashboard con estadísticas
- [ ] Upload de logos funcional
- [ ] Navegación por roles
- [ ] Búsqueda y filtros operativos

---

### DÍA 4 - Jueves: Gestión de Unidades y Residentes

[Contenido similar al día anterior, detallado para Unidades y Residentes]

---

### DÍA 5 - Viernes: Sistema de Servicios

[Contenido detallado para Sistema de Servicios]

---

## 📅 SEMANA 2: FACTURACIÓN Y AMENIDADES

[Días 6-10 detallados]

---

## 📅 SEMANA 3: COMUNICACIÓN, REPORTES Y REFINAMIENTO

[Días 11-20 detallados]

---

## 📊 Sistema de Tracking

### Checklist Diario
Copiar esto al inicio de cada día:

```markdown
## Día [X] - [Fecha]

### Dev A - [Nombre]
Horas trabajadas: __/8

Completado:
- [ ] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3

En progreso:
- [ ] Tarea en desarrollo

Bloqueadores:
- Ninguno / [Descripción]

Commits realizados: __
Pull Requests: __

### Dev B - [Nombre]
Horas trabajadas: __/8

Completado:
- [ ] Tarea 1
- [ ] Tarea 2
- [ ] Tarea 3

En progreso:
- [ ] Tarea en desarrollo

Bloqueadores:
- Ninguno / [Descripción]

Commits realizados: __
Pull Requests: __

### Retrospectiva del Día
¿Qué salió bien?
¿Qué se puede mejorar?
¿Ajustes para mañana?
```

---

## 🎯 Hitos Importantes

### Fin de Semana 1
- [ ] Core del sistema operativo
- [ ] 5 módulos completos
- [ ] ~40 commits
- [ ] ~10 PRs mergeados

### Fin de Semana 2
- [ ] Facturación y pagos funcionales
- [ ] Amenidades y reservas operativas
- [ ] Control de acceso completo
- [ ] ~80 commits totales

### Fin de Semana 3
- [ ] Sistema completo funcional
- [ ] Deploy en producción
- [ ] Documentación lista
- [ ] ~120 commits totales

---

**Versión**: 1.0
**Última Actualización**: [Fecha]
