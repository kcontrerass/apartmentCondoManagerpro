# Guía de Uso de IA para Desarrollo - CondoManager Pro

## 🤖 Cómo Usar Esta Documentación con tu AI Assistant

Esta guía te ayudará a obtener el máximo provecho de tu AI assistant (Claude, ChatGPT, Cursor, etc.) durante el desarrollo del proyecto.

---

## 📁 Estructura de Documentación

```
condo-management-docs/
├── 00-PROJECT-OVERVIEW.md      # Contexto general del proyecto
├── 01-WEEKLY-SCHEDULE.md       # Planificación detallada por día
├── 02-DATABASE-SCHEMA.md       # Schema completo de la base de datos
├── 03-AI-USAGE-GUIDE.md        # Esta guía
├── 04-API-ENDPOINTS.md         # Documentación de APIs
├── 05-COMPONENT-LIBRARY.md     # Componentes UI disponibles
├── 06-DAILY-PROGRESS.md        # Tracking diario (actualizable)
└── 07-PROMPTS-TEMPLATES.md     # Plantillas de prompts efectivos
```

---

## 🎯 Principio Fundamental

**SIEMPRE proporciona contexto completo a la IA antes de pedir código:**

```markdown
Estoy trabajando en el [módulo/feature] del día [X].
Lee estos archivos para contexto:
- 00-PROJECT-OVERVIEW.md
- 01-WEEKLY-SCHEDULE.md (Día X)
- 02-DATABASE-SCHEMA.md (Modelos relacionados)

Ahora necesito que [tarea específica]...
```

---

## 📋 Flujo de Trabajo Diario con IA

### 1️⃣ Inicio del Día

**Prompt de Inicialización:**
```markdown
# Contexto del Proyecto
Estoy desarrollando CondoManager Pro, un sistema de gestión de condominios.

Stack: Next.js 15, TypeScript, Tailwind, Prisma, MySQL, AWS S3, Vercel

Hoy es el Día [X] de 20 del proyecto.

**Lee estos documentos para entender el contexto:**
1. 00-PROJECT-OVERVIEW.md - Para entender el proyecto completo
2. 01-WEEKLY-SCHEDULE.md - Para ver las tareas de hoy (Día X)
3. 02-DATABASE-SCHEMA.md - Para conocer los modelos de datos

**Mi rol hoy es:** [Dev A o Dev B]

**Tareas del día:**
[Lista de tareas del día desde 01-WEEKLY-SCHEDULE.md]

**Estado actual:**
- Módulos completados: [lista]
- En progreso: [lista]
- Bloqueadores: [lista]

¿Estás listo para ayudarme con la primera tarea?
```

---

### 2️⃣ Durante el Desarrollo

#### Para Backend (Dev A)

**Plantilla para Crear APIs:**
```markdown
# Contexto
Estoy en el Día [X] trabajando en [módulo].

# Schema de BD relevante
[Copiar modelos Prisma relevantes del 02-DATABASE-SCHEMA.md]

# Tarea
Necesito crear el endpoint [METHOD] /api/[ruta]

# Requerimientos:
- Debe manejar [funcionalidad]
- Validación con Zod
- Permisos: Solo [roles] pueden acceder
- Debe retornar [formato de respuesta]

# Ejemplo de uso esperado:
```typescript
// Petición
POST /api/complexes
{
  "name": "Edificio Central",
  "type": "EDIFICIO",
  "address": "..."
}

// Respuesta esperada
{
  "success": true,
  "data": { ... }
}
```

Por favor genera el código completo siguiendo las convenciones del proyecto.
```

**Plantilla para Schemas Prisma:**
```markdown
# Contexto
Trabajando en el día [X], módulo de [nombre].

# Modelos existentes relacionados:
[Copiar modelos relacionados del 02-DATABASE-SCHEMA.md]

# Necesito crear/modificar:
Un modelo para [entidad] con estos campos:
- [campo1]: [tipo] - [descripción]
- [campo2]: [tipo] - [descripción]

# Relaciones:
- [relación1]: [descripción]
- [relación2]: [descripción]

Genera el modelo Prisma completo con:
1. Todos los campos con tipos correctos
2. Relaciones bien definidas
3. Índices necesarios
4. Validaciones en campo
5. Comentarios explicativos
```

---

#### Para Frontend (Dev B)

**Plantilla para Componentes:**
```markdown
# Contexto
Día [X], trabajando en la UI de [módulo].

# Tech Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- React Hook Form + Zod

# Componentes UI disponibles:
[Listar desde 05-COMPONENT-LIBRARY.md]

# Necesito crear:
Un componente [NombreComponente] que:
- Muestre [funcionalidad]
- Tenga estas props: [lista]
- Use estos componentes base: [lista]
- Siga el diseño: [descripción o imagen]

# API endpoint que consume:
```typescript
GET /api/[ruta]
Response: {
  // formato
}
```

# Validaciones de formulario (si aplica):
- [campo]: [reglas]

Por favor genera:
1. El componente TypeScript completo
2. Con tipos bien definidos
3. Usando Tailwind para estilos
4. Manejo de estados de loading/error
5. Comentarios explicativos
```

**Plantilla para Páginas:**
```markdown
# Contexto
Día [X], creando la página [ruta].

# Layout
Esta página usa: [MainLayout, AuthLayout, etc.]

# Permisos
Accesible solo para: [roles]

# Funcionalidad esperada:
1. [Descripción punto 1]
2. [Descripción punto 2]

# APIs que consume:
- GET /api/[ruta1]
- POST /api/[ruta2]

# Componentes a usar:
- [Componente1] (desde 05-COMPONENT-LIBRARY.md)
- [Componente2]

# Estados de la página:
- Loading
- Success (mostrando [datos])
- Error
- Empty state

Genera la página completa de Next.js con:
1. Server component o client según necesidad
2. Fetch de datos apropiado
3. Manejo de errores
4. UI responsive
5. Integración con APIs
```

---

### 3️⃣ Debugging y Refactoring

**Prompt para Debug:**
```markdown
# Contexto
Estoy en el Día [X], módulo [nombre].

# Problema
[Descripción detallada del problema]

# Código actual:
```typescript
[Código con problema]
```

# Error que obtengo:
```
[Error completo]
```

# Lo que esperaba:
[Comportamiento esperado]

# Lo que he intentado:
1. [Intento 1]
2. [Intento 2]

# Contexto del proyecto:
- Schema relacionado: [modelo Prisma]
- API relacionada: [endpoint]

¿Puedes ayudarme a identificar y solucionar el problema?
```

---

## 🎨 Prompts Específicos por Tipo de Tarea

### Crear CRUD Completo

```markdown
# CRUD para [Entidad]

## Contexto
Día [X] - Módulo de [nombre]

## Schema Prisma
```prisma
[Copiar modelo del 02-DATABASE-SCHEMA.md]
```

## Necesito implementar:

### Backend
1. **API Routes** en `/src/app/api/[entidad]/`
   - GET /api/[entidad] (listar con paginación y filtros)
   - GET /api/[entidad]/:id (detalle)
   - POST /api/[entidad] (crear)
   - PUT /api/[entidad]/:id (actualizar)
   - DELETE /api/[entidad]/:id (eliminar)

2. **Validaciones Zod**
   - CreateSchema
   - UpdateSchema

3. **Permisos**: [Especificar por endpoint]

### Frontend
1. **Páginas**
   - Listado: /dashboard/[entidad]
   - Crear: /dashboard/[entidad]/new
   - Editar: /dashboard/[entidad]/[id]/edit
   - Detalle: /dashboard/[entidad]/[id]

2. **Componentes**
   - [Entidad]Table
   - [Entidad]Form
   - [Entidad]Card

Por favor, genera primero el backend completo, luego el frontend.
```

---

### Integrar con S3

```markdown
# Upload a S3

## Contexto
Necesito subir [tipo de archivo] a S3 para [propósito].

## Configuración S3 actual
```typescript
// lib/s3.ts ya existe con:
- uploadFile(file, bucket, key)
- deleteFile(bucket, key)
- getSignedUrl(bucket, key)
```

## Necesito:
1. API endpoint POST /api/upload/[tipo]
   - Validar tipo de archivo: [formatos permitidos]
   - Validar tamaño: max [X]MB
   - Redimensionar si es imagen (opcional)
   - Subir a S3
   - Retornar URL pública

2. Componente React de upload
   - Drag & drop
   - Preview de archivo
   - Progress bar
   - Manejo de errores

Genera ambas partes.
```

---

### Crear Sistema de Notificaciones

```markdown
# Sistema de Notificaciones

## Contexto
Necesito enviar notificaciones cuando [evento].

## Email Service disponible
- Provider: [Resend/SendGrid]
- API key configurada

## Necesito:

1. **Función de envío**
```typescript
// lib/email.ts
sendEmail(to, subject, template, data)
```

2. **Plantillas HTML**
- [template1.html] para [propósito]
- [template2.html] para [propósito]

3. **Triggers**
- Cuando [evento1] → enviar [template1]
- Cuando [evento2] → enviar [template2]

4. **Centro de notificaciones en UI**
- Componente NotificationCenter
- Badge con contador
- Lista de notificaciones
- Marcar como leído

Genera todo el sistema.
```

---

## 📊 Tracking de Progreso con IA

### Actualizar Progreso Diario

**Al final del día, ejecuta:**
```markdown
# Reporte Diario

## Día [X] - [Fecha]
Dev: [Nombre]

## Completado ✅
- [ ] Tarea 1 - [breve descripción]
  - Commits: [lista]
  - Files: [lista]
- [ ] Tarea 2
  ...

## En Progreso 🚧
- [ ] Tarea X - [% completado]
  - Bloqueador: [si hay]
  - Siguiente paso: [descripción]

## No Iniciado ⏸️
- [ ] Tarea Y

## Commits del día
```bash
git log --oneline --since="today"
```

## Métricas
- Horas trabajadas: X/8
- Commits: X
- PRs: X
- Archivos creados: X
- Archivos modificados: X

## Notas
[Cualquier observación importante]

---

Por favor, genera un resumen ejecutivo de mi progreso y sugerencias para mañana.
```

---

## 🔍 Mejores Prácticas

### ✅ DO's (Hacer)

1. **Siempre proporciona contexto completo**
   ```markdown
   ❌ "Crea un componente de tabla"
   ✅ "Basado en el día 3 del proyecto CondoManager (ver 01-WEEKLY-SCHEDULE.md),
       necesito un componente de tabla para listar complejos usando el schema
       de 02-DATABASE-SCHEMA.md. Debe consumir GET /api/complexes..."
   ```

2. **Referencia los documentos**
   ```markdown
   "Según el 02-DATABASE-SCHEMA.md, el modelo Complex tiene..."
   ```

3. **Sé específico sobre el output esperado**
   ```markdown
   "Genera SOLO el código TypeScript, sin explicaciones"
   "Genera el código Y una explicación de las decisiones tomadas"
   ```

4. **Pide code reviews**
   ```markdown
   "Aquí está mi código [código]. Revísalo contra las convenciones
    del proyecto en 00-PROJECT-OVERVIEW.md y sugiere mejoras."
   ```

5. **Usa la IA para generar tests**
   ```markdown
   "Dado este endpoint [código], genera tests unitarios con Jest."
   ```

### ❌ DON'Ts (No Hacer)

1. **No pidas código sin contexto**
   ```markdown
   ❌ "Dame un CRUD de usuarios"
   ```

2. **No asumas que la IA recuerda conversaciones previas**
   - Siempre re-proporciona el contexto necesario

3. **No copies código sin revisar**
   - Siempre revisa y adapta según necesites

4. **No mezcles múltiples tareas en un prompt**
   ```markdown
   ❌ "Crea el backend, el frontend, los tests y la documentación"
   ✅ "Primero crea el backend..." → Luego: "Ahora el frontend..."
   ```

---

## 🎓 Prompts Avanzados

### Generar Documentación Automática

```markdown
Revisa estos archivos:
- [lista de archivos]

Y genera documentación en formato Markdown que incluya:
1. Descripción del módulo
2. APIs disponibles con ejemplos
3. Componentes y sus props
4. Flujos de datos
5. Instrucciones de uso
```

### Code Review Automático

```markdown
Actúa como un senior developer revisando este código:

```typescript
[código]
```

Analiza:
1. ¿Sigue las convenciones de TypeScript?
2. ¿Hay problemas de performance?
3. ¿Maneja errores correctamente?
4. ¿Está bien tipado?
5. ¿Faltan validaciones?
6. ¿Es mantenible y escalable?

Da feedback constructivo con ejemplos de mejora.
```

### Optimización

```markdown
Este código funciona pero es lento:

```typescript
[código]
```

Contexto:
- Se ejecuta [frecuencia]
- Maneja [cantidad] de datos
- Usuario espera respuesta en <[X]ms

Optimízalo sin cambiar la funcionalidad.
```

---

## 🚀 Shortcuts de Prompts

Guarda estos prompts en tu editor:

```markdown
// Quick Context
/ctx: Lee 00-PROJECT-OVERVIEW.md, 01-WEEKLY-SCHEDULE.md día [X], y dame un resumen.

// Quick API
/api [entity]: Genera CRUD completo para [entity] según 02-DATABASE-SCHEMA.md

// Quick Component
/component [name]: Genera componente React [name] con TypeScript y Tailwind

// Quick Fix
/fix: Analiza este error [error] en el contexto del proyecto y sugiere solución

// Quick Test
/test: Genera tests para este código [código]

// Quick Doc
/doc: Documenta este código [código] en formato JSDoc
```

---

## 📝 Checklist de Uso de IA

Antes de pedir código a la IA, verifica:

- [ ] He leído las tareas del día en 01-WEEKLY-SCHEDULE.md
- [ ] Conozco los modelos de datos en 02-DATABASE-SCHEMA.md
- [ ] Entiendo qué hace el código existente
- [ ] Sé exactamente qué necesito
- [ ] Tengo ejemplos o referencias claras
- [ ] He preparado el prompt con contexto completo

Después de recibir código:

- [ ] He revisado el código línea por línea
- [ ] He verificado que sigue las convenciones
- [ ] He probado que funciona
- [ ] He agregado comentarios donde necesario
- [ ] He hecho commit con mensaje descriptivo
- [ ] He actualizado la documentación si necesario

---

## 🎯 Recursos Adicionales

### Ejemplos de Conversaciones Efectivas

**Ejemplo 1: Crear API Endpoint**
```
Human: [Proporciona contexto + schema + requerimientos]
AI: [Genera código]
Human: "Funciona, pero ¿puedes agregar paginación?"
AI: [Actualiza código]
Human: "Perfecto, ahora genera los tests"
AI: [Genera tests]
```

**Ejemplo 2: Debug**
```
Human: [Error + código + contexto]
AI: [Identifica problema + sugiere solución]
Human: "Lo intenté pero ahora tengo este error..."
AI: [Ajusta solución]
```

---

## 💡 Tips Finales

1. **La IA es una herramienta, no un reemplazo**
   - Úsala para acelerar, no para evitar entender

2. **Itera**
   - Pide, prueba, refina, repite

3. **Documenta lo que funciona**
   - Guarda prompts exitosos en 07-PROMPTS-TEMPLATES.md

4. **Comparte con el equipo**
   - Si un prompt funciona bien, compártelo

5. **Mantén actualizada la documentación**
   - Actualiza 06-DAILY-PROGRESS.md diariamente

---

**Versión**: 1.0
**Última Actualización**: [Fecha]
