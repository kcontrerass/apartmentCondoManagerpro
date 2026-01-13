# Prompt Templates - CondoManager Pro

Esta es una colección de plantillas de prompts que han demostrado ser efectivas para este proyecto. Cópialas y adapta según necesites.

---

## 🎯 PROMPTS DE INICIO

### Prompt de Inicialización Diaria

```markdown
# Contexto del Proyecto CondoManager Pro

Estoy desarrollando un sistema de gestión de condominios con Next.js 15, TypeScript, Tailwind, Prisma, MySQL, AWS S3, y Vercel.

**Día actual**: [X] de 20
**Mi rol**: [Dev A - Backend | Dev B - Frontend]

**Documentación del proyecto**:
He subido estos archivos con toda la documentación:
- 00-PROJECT-OVERVIEW.md
- 01-WEEKLY-SCHEDULE.md  
- 02-DATABASE-SCHEMA.md
- 04-API-ENDPOINTS.md

**Tareas de hoy** (Día [X] de 01-WEEKLY-SCHEDULE.md):
[Copiar las tareas del día desde el documento]

**Progreso hasta ahora**:
- Módulos completados: [Lista]
- En progreso: [Lista]
- Último commit: [Descripción]

¿Listo para ayudarme con la primera tarea del día?
```

---

## 🔧 PROMPTS DE DESARROLLO BACKEND

### 1. Crear Modelo Prisma

```markdown
# Crear Modelo Prisma: [NombreModelo]

**Contexto**: Día [X], módulo de [nombre del módulo]

**Modelos relacionados existentes**:
```prisma
[Copiar modelos relacionados del 02-DATABASE-SCHEMA.md]
```

**Necesito crear un modelo para**: [Entidad]

**Campos requeridos**:
- [campo1]: [tipo] - [descripción y validaciones]
- [campo2]: [tipo] - [descripción y validaciones]
- [campo3]: [tipo] - [descripción y validaciones]

**Relaciones**:
- Relación con [Modelo]: [tipo de relación] - [descripción]
- Relación con [Modelo]: [tipo de relación] - [descripción]

**Índices necesarios**:
- Índice en [campo] para [propósito]

**Enums requeridos**:
- [NombreEnum]: [valores posibles]

Por favor genera:
1. El modelo Prisma completo con todos los decoradores
2. Los enums necesarios
3. Las relaciones bidireccionales correctas
4. Los índices para optimización
5. Comentarios explicativos en español
6. Valores default apropiados
7. Validaciones a nivel de BD
```

---

### 2. Crear API Endpoint CRUD

```markdown
# Crear API Endpoint: [METHOD] /api/[ruta]

**Contexto**: Día [X], implementando [funcionalidad]

**Schema de datos**:
```prisma
[Copiar modelo Prisma relevante]
```

**Endpoint a crear**: [METHOD] /api/[ruta]

**Funcionalidad**:
[Descripción detallada de lo que debe hacer]

**Input esperado**:
```typescript
{
  "campo1": "valor",
  "campo2": 123
}
```

**Output esperado**:
```typescript
{
  "success": true,
  "data": { ... }
}
```

**Validaciones con Zod**:
- [campo1]: [reglas de validación]
- [campo2]: [reglas de validación]

**Permisos de acceso**:
- Roles permitidos: [SUPER_ADMIN, ADMIN, etc.]
- Validación adicional: [descripción]

**Manejo de errores**:
- Si [condición]: retornar error [código] con mensaje [mensaje]
- Si [condición]: retornar error [código] con mensaje [mensaje]

Por favor genera:
1. El archivo completo de la API route en Next.js 15 App Router
2. Schema de validación Zod
3. Lógica de negocio completa
4. Manejo de errores apropiado
5. Verificación de permisos
6. Respuestas en formato estándar del proyecto
7. Comentarios explicativos
8. TypeScript types necesarios
```

---

### 3. Crear CRUD Completo

```markdown
# CRUD Completo para: [Entidad]

**Contexto**: Día [X], módulo [nombre]

**Schema Prisma**:
```prisma
[Copiar modelo completo]
```

**Necesito implementar todos los endpoints**:

1. **GET /api/[entidad]** - Listar con paginación
   - Query params: page, limit, search, [filtros específicos]
   - Permisos: [roles]
   - Include: [relaciones a incluir]

2. **GET /api/[entidad]/:id** - Obtener detalle
   - Permisos: [roles]
   - Include: [relaciones a incluir]

3. **POST /api/[entidad]** - Crear
   - Permisos: [roles]
   - Campos requeridos: [lista]
   - Validaciones: [lista]

4. **PUT /api/[entidad]/:id** - Actualizar
   - Permisos: [roles]
   - Campos actualizables: [lista]

5. **DELETE /api/[entidad]/:id** - Eliminar (soft delete si aplica)
   - Permisos: [roles]
   - Validaciones pre-delete: [lista]

**Schemas Zod necesarios**:
- CreateSchema
- UpdateSchema
- QuerySchema (para filtros)

Por favor genera:
1. Estructura de carpetas completa
2. Todos los archivos de API routes
3. Schemas de validación Zod
4. Types de TypeScript
5. Funciones helper si son necesarias
6. Formato de respuesta estándar del proyecto
7. Documentación inline en español
```

---

### 4. Integración con S3

```markdown
# Implementar Upload a S3

**Contexto**: Upload de [tipo de archivo] para [propósito]

**Configuración S3 existente** (`lib/s3.ts`):
```typescript
[Copiar código existente si lo hay]
```

**Necesito**:

**Backend - API Endpoint**:
- Ruta: POST /api/upload/[tipo]
- Validaciones:
  - Tipos de archivo: [.jpg, .png, .pdf, etc.]
  - Tamaño máximo: [X] MB
  - Cantidad máxima: [X] archivos
- Procesamiento:
  - [Si es imagen]: Redimensionar a [dimensiones]
  - [Si es imagen]: Comprimir con calidad [%]
- Subir a bucket: [nombre del bucket]
- Ruta en S3: [estructura de carpetas]
- Retornar: URL pública o signed URL

**Frontend - Componente de Upload**:
- Drag & drop
- Selección múltiple (si aplica)
- Preview de archivos
- Progress bar
- Lista de archivos subidos
- Botón de eliminar
- Validación client-side
- Manejo de errores

Por favor genera:
1. Función helper en `lib/s3.ts` (si no existe)
2. API endpoint completo con validaciones
3. Componente React de upload
4. Types TypeScript
5. Manejo de errores
6. Loading states
```

---

## 🎨 PROMPTS DE DESARROLLO FRONTEND

### 5. Crear Componente React

```markdown
# Crear Componente: [NombreComponente]

**Contexto**: Día [X], UI para [funcionalidad]

**Ubicación**: `src/components/[carpeta]/[NombreComponente].tsx`

**Props del componente**:
```typescript
interface [NombreComponente]Props {
  prop1: string;
  prop2: number;
  onAction?: () => void;
}
```

**Funcionalidad**:
[Descripción detallada del componente]

**Componentes UI base a usar**:
- Button (de `components/ui/Button`)
- Input (de `components/ui/Input`)
- Card (de `components/ui/Card`)
- [otros componentes disponibles]

**Estilos con Tailwind**:
- [Descripción del diseño deseado]
- Debe ser responsive (mobile-first)
- Colores: usar variables del tema

**Estados**:
- Loading: [cuándo y cómo mostrar]
- Error: [cuándo y cómo mostrar]
- Success: [cuándo y cómo mostrar]
- Empty: [cuándo y cómo mostrar]

**Interacciones**:
- [Acción 1]: [qué debe pasar]
- [Acción 2]: [qué debe pasar]

Por favor genera:
1. Componente React completo con TypeScript
2. Props interface bien definida
3. Manejo de todos los estados
4. Estilos con Tailwind (sin CSS modules)
5. Comentarios explicativos en español
6. Exports apropiados
7. Accesibilidad (ARIA labels donde aplique)
```

---

### 6. Crear Página de Next.js

```markdown
# Crear Página: [Ruta]

**Contexto**: Día [X], página de [funcionalidad]

**Ruta**: `src/app/[ruta]/page.tsx`

**Tipo**: [Server Component | Client Component]

**Layout**: Usa [MainLayout | AuthLayout | otro]

**Permisos**: Solo accesible para [roles]

**Funcionalidad de la página**:
[Descripción detallada]

**APIs que consume**:
- GET /api/[endpoint1] - [propósito]
- POST /api/[endpoint2] - [propósito]

**Componentes a incluir**:
- [Componente1] - [propósito]
- [Componente2] - [propósito]

**Estados de la página**:
- Loading inicial: [cómo mostrar]
- Con datos: [cómo mostrar]
- Sin datos (empty): [cómo mostrar]
- Error: [cómo mostrar]

**Interacciones del usuario**:
- [Acción 1]: [qué debe pasar]
- [Acción 2]: [qué debe pasar]

**SEO**:
- Title: [título]
- Description: [descripción]

Por favor genera:
1. Archivo page.tsx completo
2. Metadata para SEO
3. Server o Client component según corresponda
4. Fetch de datos apropiado
5. Manejo de estados
6. Responsive design
7. TypeScript types
8. Comentarios explicativos
```

---

### 7. Crear Formulario con Validación

```markdown
# Crear Formulario: [NombreFormulario]

**Contexto**: Formulario para [propósito]

**Tecnologías**:
- React Hook Form
- Zod validation
- Tailwind CSS

**Campos del formulario**:
1. [campo1]:
   - Tipo: [text | email | number | select | etc.]
   - Validaciones: [required, min, max, pattern, etc.]
   - Placeholder: [texto]
   - Mensaje de error: [texto]

2. [campo2]:
   - Tipo: [tipo]
   - Validaciones: [reglas]
   - Opciones (si es select): [lista]

**API endpoint**:
- Método: [POST | PUT]
- Ruta: /api/[ruta]
- Body esperado:
```typescript
{
  campo1: string,
  campo2: number
}
```

**Comportamiento**:
- Al submit: [qué debe pasar]
- Si success: [qué mostrar/hacer]
- Si error: [qué mostrar/hacer]
- Validación: [en tiempo real | al submit]

**UI**:
- Botón de submit: [texto]
- Botón de cancelar: [sí/no]
- Loading state: [cómo mostrar]

Por favor genera:
1. Schema de validación Zod
2. Componente de formulario completo
3. Manejo de submit
4. Manejo de errores
5. Loading states
6. Success feedback
7. Types TypeScript
8. Estilos con Tailwind
```

---

## 🐛 PROMPTS DE DEBUGGING

### 8. Debug de Error

```markdown
# Debug: [Descripción breve del problema]

**Contexto**: Día [X], trabajando en [módulo/funcionalidad]

**Problema detallado**:
[Descripción completa del comportamiento incorrecto]

**Código actual**:
```typescript
[Pegar el código que tiene el problema]
```

**Error que obtengo**:
```
[Pegar el error completo, incluyendo stack trace]
```

**Lo que esperaba**:
[Descripción del comportamiento correcto esperado]

**Lo que pasa en realidad**:
[Descripción de lo que realmente sucede]

**Pasos para reproducir**:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Ya intenté**:
1. [Intento 1] - Resultado: [resultado]
2. [Intento 2] - Resultado: [resultado]

**Contexto adicional**:
- Versión de Next.js: [versión]
- Node version: [versión]
- Navegador: [navegador]
- Esquema Prisma relacionado:
```prisma
[Si aplica]
```

**Pregunta**: 
¿Puedes ayudarme a identificar el problema y sugerir una solución?
```

---

### 9. Optimización de Performance

```markdown
# Optimizar Performance: [Descripción]

**Problema**:
Este código/componente/query es lento.

**Código actual**:
```typescript
[Pegar código]
```

**Contexto de uso**:
- Se ejecuta: [frecuencia - cada render, cada minuto, etc.]
- Maneja: [cantidad] registros/datos
- Usuario espera respuesta en: < [X] ms
- Actualmente toma: [X] ms

**Mediciones**:
[Si tienes profiling data, pégalo aquí]

**Objetivo**:
Reducir tiempo de ejecución a < [X] ms sin cambiar funcionalidad.

**Restricciones**:
- No puedo cambiar: [lista de cosas que no se pueden modificar]
- Debo mantener: [funcionalidades que deben preservarse]

Por favor:
1. Identifica los cuellos de botella
2. Sugiere optimizaciones específicas
3. Provee código optimizado
4. Explica el porqué de cada optimización
```

---

## 📝 PROMPTS DE DOCUMENTACIÓN

### 10. Generar Documentación

```markdown
# Generar Documentación para: [Módulo/Componente/API]

**Archivos a documentar**:
```typescript
[Pegar código]
```

**Tipo de documentación**: [JSDoc | README | API Docs]

**Debe incluir**:
1. Descripción general del propósito
2. Parámetros/Props con tipos y descripciones
3. Retornos/Output esperado
4. Ejemplos de uso (al menos 2)
5. Consideraciones especiales
6. Errores comunes y cómo resolverlos

**Audiencia**: [Developers del equipo | Usuarios finales | otro]

**Formato**: Markdown

Por favor genera documentación completa y clara en español.
```

---

### 11. Code Review

```markdown
# Code Review: [Descripción]

Actúa como un senior developer revisando este código:

```typescript
[Pegar código a revisar]
```

**Contexto del proyecto**: CondoManager Pro (Next.js 15, TypeScript, Prisma)

**Analiza**:
1. ¿Sigue las convenciones de TypeScript y el proyecto?
2. ¿Hay problemas de performance potenciales?
3. ¿Maneja errores correctamente?
4. ¿Está bien tipado (no any's innecesarios)?
5. ¿Faltan validaciones de seguridad?
6. ¿Es mantenible y escalable?
7. ¿Hay código duplicado o que pueda refactorizarse?
8. ¿Los nombres de variables/funciones son descriptivos?

Da feedback constructivo con:
- Problemas encontrados (priorizados por severidad)
- Código mejorado para cada problema
- Explicación del por qué de cada sugerencia
```

---

## 🧪 PROMPTS DE TESTING

### 12. Generar Tests

```markdown
# Generar Tests para: [Función/Componente/API]

**Código a testear**:
```typescript
[Pegar código]
```

**Framework**: Jest + React Testing Library

**Tipos de tests necesarios**:
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests de componentes
- [ ] Tests de API endpoints

**Casos a cubrir**:
1. Happy path: [descripción]
2. Error cases:
   - [Caso de error 1]
   - [Caso de error 2]
3. Edge cases:
   - [Edge case 1]
   - [Edge case 2]

**Mocks necesarios**:
- [API/Service/Component a mockear]

Por favor genera:
1. Archivo de test completo
2. Todos los casos de prueba
3. Mocks necesarios
4. Assertions apropiadas
5. Comentarios explicativos
6. Coverage de al menos 80%
```

---

## 🔄 PROMPTS DE REFACTORING

### 13. Refactorizar Código

```markdown
# Refactorizar: [Descripción]

**Código actual**:
```typescript
[Pegar código legacy o que necesita refactoring]
```

**Problemas actuales**:
- [Problema 1]
- [Problema 2]
- [Problema 3]

**Objetivos del refactoring**:
1. [Objetivo 1 - ej: Mejorar legibilidad]
2. [Objetivo 2 - ej: Reducir complejidad]
3. [Objetivo 3 - ej: Hacerlo más testeable]

**Restricciones**:
- No cambiar la funcionalidad externa
- Mantener compatibilidad con [X]
- No romper tests existentes

Por favor:
1. Refactoriza el código
2. Explica cada cambio realizado
3. Mantén o mejora el performance
4. Agrega comentarios donde sea útil
5. Sugiere tests adicionales si es necesario
```

---

## 💡 TIPS PARA USAR ESTOS PROMPTS

### Antes de usar un prompt:

1. ✅ Lee la documentación del proyecto relevante
2. ✅ Copia el prompt y reemplaza [placeholders]
3. ✅ Agrega contexto específico de tu situación
4. ✅ Incluye ejemplos concretos cuando sea posible

### Después de recibir la respuesta:

1. ✅ Revisa el código línea por línea
2. ✅ Prueba que funcione antes de commitear
3. ✅ Adapta según tus necesidades específicas
4. ✅ Agrega comentarios adicionales si es necesario

### Si la respuesta no es satisfactoria:

1. 🔄 Proporciona más contexto
2. 🔄 Da ejemplos más específicos
3. 🔄 Pide que explique su razonamiento
4. 🔄 Itera hasta obtener lo que necesitas

---

## 📚 Recursos Adicionales

- Ver `03-AI-USAGE-GUIDE.md` para mejores prácticas generales
- Ver `00-PROJECT-OVERVIEW.md` para contexto completo del proyecto
- Ver `02-DATABASE-SCHEMA.md` para modelos de datos
- Ver `04-API-ENDPOINTS.md` para estructura de APIs

---

**Versión**: 1.0
**Última Actualización**: [Fecha]
