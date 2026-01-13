# Design System & UI/UX Guide - CondoManager Pro

## 🎨 Diseño de Referencia

Este proyecto cuenta con un diseño de referencia profesional que debe seguirse para mantener consistencia visual en toda la aplicación.

**Archivos de referencia**:
- `code.html` - Código HTML/Tailwind completo del dashboard
- `screen.png` - Screenshot del diseño implementado

---

## 🎨 Sistema de Colores

### Colores Principales

```javascript
// tailwind.config.js
colors: {
  // Brand Colors
  primary: "#135bec",           // Azul principal
  "primary-dark": "#0f4bc2",    // Azul oscuro (hover)
  
  // Backgrounds
  "background-light": "#f6f6f8", // Fondo claro
  "background-dark": "#101622",  // Fondo oscuro
  
  // Slate (grises neutros)
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  
  // Success (verde)
  "emerald-50": "#ecfdf5",
  "emerald-100": "#d1fae5",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-700": "#047857",
}
```

### Uso de Colores por Contexto

**Botones Primarios**: `bg-primary hover:bg-primary-dark`
**Texto Principal**: `text-slate-900 dark:text-white`
**Texto Secundario**: `text-slate-500 dark:text-slate-400`
**Bordes**: `border-slate-200 dark:border-slate-800`
**Fondos de Tarjetas**: `bg-white dark:bg-slate-900`
**Estados Positivos**: `emerald-100`, `emerald-500` (verde)
**Estados Negativos**: `red-100`, `red-600` (rojo)
**Estados Neutrales**: `slate-100`, `slate-600` (gris)

---

## 📐 Espaciado y Layout

### Border Radius (Bordes Redondeados)

```javascript
borderRadius: {
  "DEFAULT": "0.375rem",  // 6px - default
  "md": "0.375rem",       // 6px
  "lg": "0.5rem",         // 8px - tarjetas
  "xl": "0.75rem",        // 12px - tarjetas grandes
  "2xl": "1rem",          // 16px
  "full": "9999px"        // totalmente redondo
}
```

**Uso**:
- Botones: `rounded-lg` (8px)
- Tarjetas: `rounded-xl` (12px)
- Badges: `rounded-full`
- Inputs: `rounded-md` (6px)

### Espaciado Consistente

**Padding de tarjetas**: `p-6` (24px)
**Gaps en grids**: `gap-6` o `gap-8`
**Espaciado vertical**: `space-y-4` o `space-y-6`
**Margen entre secciones**: `mb-6` o `mb-8`

---

## 🔤 Tipografía

### Fuente

**Familia**: Inter (de Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
```

### Pesos de Fuente

- **300**: Light - subtítulos muy ligeros
- **400**: Regular - texto normal
- **500**: Medium - texto de navegación
- **600**: Semibold - subtítulos importantes
- **700**: Bold - títulos y énfasis
- **800**: Extra Bold - títulos principales

### Jerarquía Tipográfica

```css
/* Logo y Títulos Principales */
.text-brand-lg {
  @apply text-base font-bold tracking-tight;
}

/* Títulos de Sección */
.text-section-title {
  @apply text-lg font-semibold;
}

/* Subtítulos */
.text-subtitle {
  @apply text-sm font-medium text-slate-500;
}

/* Texto de Cuerpo */
.text-body {
  @apply text-sm text-slate-600 dark:text-slate-300;
}

/* Texto Pequeño */
.text-caption {
  @apply text-xs text-slate-500;
}

/* Labels Uppercase */
.text-label {
  @apply text-xs font-semibold text-slate-400 uppercase tracking-wider;
}
```

---

## 🧩 Componentes Base

### 1. Sidebar (Barra Lateral)

**Estructura**:
```jsx
<aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
  {/* Logo */}
  <div className="p-6 flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
      <span className="material-symbols-outlined text-[20px]">apartment</span>
    </div>
    <div>
      <h1 className="text-base font-bold tracking-tight">CondoManager</h1>
      <p className="text-xs font-medium text-slate-500 mt-1">Admin Console</p>
    </div>
  </div>
  
  {/* Navegación */}
  <nav className="px-4 py-2">
    {/* Sección */}
    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">
      Main
    </p>
    
    {/* Item activo */}
    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium">
      <span className="material-symbols-outlined text-[20px]">dashboard</span>
      <span className="text-sm">Dashboard</span>
    </a>
    
    {/* Item normal */}
    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <span className="material-symbols-outlined text-[20px]">domain</span>
      <span className="text-sm">Complexes</span>
    </a>
  </nav>
</aside>
```

**Estados**:
- Activo: `bg-primary/10 text-primary font-medium`
- Normal: `text-slate-600 hover:bg-slate-50`
- Con badge: Agregar número en rojo para notificaciones

---

### 2. Header (Barra Superior)

```jsx
<header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between">
  {/* Selector de Complejo */}
  <button className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
    <span className="material-symbols-outlined text-slate-500">domain</span>
    <span>Sunset Towers - Block A</span>
    <span className="material-symbols-outlined text-slate-400">expand_more</span>
  </button>
  
  {/* Search Bar */}
  <div className="flex-1 max-w-md mx-8">
    <input 
      type="search" 
      placeholder="Search unit, resident, or tag..."
      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    />
  </div>
  
  {/* Botones de Acción */}
  <div className="flex items-center gap-3">
    <button className="p-2 text-slate-400 hover:text-slate-600">
      <span className="material-symbols-outlined">notifications</span>
    </button>
    <button className="p-2 text-slate-400 hover:text-slate-600">
      <span className="material-symbols-outlined">help</span>
    </button>
  </div>
</header>
```

---

### 3. Cards de Estadísticas (Stat Cards)

```jsx
<div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
  {/* Header con icono y badge */}
  <div className="flex justify-between items-start mb-4">
    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <span className="material-symbols-outlined text-primary text-[24px]">
        payments
      </span>
    </div>
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
      +2%
    </span>
  </div>
  
  {/* Contenido */}
  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
    Total Debt
  </p>
  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
    $12,450
  </h3>
  <p className="text-xs text-slate-500 mt-1">
    Vs last month
  </p>
</div>
```

**Variaciones de color de icono**:
- Azul (default): `bg-blue-50 text-primary`
- Naranja (advertencias): `bg-orange-50 text-orange-500`
- Púrpura (eventos): `bg-purple-50 text-purple-500`
- Verde (activos): `bg-emerald-50 text-emerald-600`

---

### 4. Tabla (Recent Activity)

```jsx
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
  {/* Header */}
  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
      Recent Activity
    </h3>
    <button className="text-sm text-primary font-medium hover:underline">
      View All
    </button>
  </div>
  
  {/* Tabla */}
  <table className="w-full text-left text-sm">
    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
      <tr>
        <th className="px-6 py-3">Reference</th>
        <th className="px-6 py-3">Type</th>
        <th className="px-6 py-3">Status</th>
        <th className="px-6 py-3">Date/Time</th>
        <th className="px-6 py-3 text-right">Details</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
          Unit 402
        </td>
        <td className="px-6 py-4 text-slate-500">
          Maintenance Fee
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Paid
          </span>
        </td>
        <td className="px-6 py-4 text-slate-500">
          Today, 11:30 AM
        </td>
        <td className="px-6 py-4 text-right font-medium text-slate-900">
          $250.00
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 5. Badges de Estado

```jsx
/* Paid / Success */
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
  Paid
</span>

/* Pending / Warning */
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
  Pending
</span>

/* Info / Active */
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
  Logged
</span>

/* Neutral */
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
  Upcoming
</span>

/* High Priority */
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
  Urgent
</span>
```

---

### 6. Botones

```jsx
/* Primary Button */
<button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
  New Incident
</button>

/* Secondary Button */
<button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
  Send Notice
</button>

/* Ghost Button */
<button className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">
  Register Visitor
</button>

/* Icon Button */
<button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
  <span className="material-symbols-outlined">notifications</span>
</button>
```

---

### 7. Inputs y Forms

```jsx
/* Text Input */
<input 
  type="text"
  placeholder="Enter unit number..."
  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
/>

/* Select */
<select className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20">
  <option>Select complex...</option>
</select>

/* Textarea */
<textarea 
  rows="4"
  placeholder="Describe the incident..."
  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
></textarea>
```

---

## 🎭 Iconografía

### Material Symbols Outlined

El proyecto usa **Material Symbols Outlined** de Google.

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

**Uso**:
```jsx
<span className="material-symbols-outlined text-[20px]">dashboard</span>
<span className="material-symbols-outlined text-[24px]">payments</span>
```

### Iconos por Módulo

| Módulo | Icono |
|--------|-------|
| Dashboard | `dashboard` |
| Complexes | `domain` |
| Units | `door_front` |
| Neighbors | `group` |
| Amenities | `pool` |
| Services | `handyman` |
| Billing | `payments` |
| Access Control | `badge` |
| Communications | `forum` |
| Incidents | `warning` |
| Reports | `bar_chart` |
| Documents | `description` |

---

## 🌙 Dark Mode

### Implementación

El proyecto soporta dark mode usando la clase `dark:` de Tailwind.

```jsx
<body className="bg-background-light dark:bg-background-dark">
  <div className="bg-white dark:bg-slate-900">
    <h1 className="text-slate-900 dark:text-white">Título</h1>
    <p className="text-slate-500 dark:text-slate-400">Texto secundario</p>
  </div>
</body>
```

### Toggle Dark Mode

```jsx
// En el header o settings
<button 
  onClick={() => document.documentElement.classList.toggle('dark')}
  className="p-2 text-slate-400 hover:text-slate-600"
>
  <span className="material-symbols-outlined">dark_mode</span>
</button>
```

---

## 📱 Responsive Design

### Breakpoints

```javascript
// Tailwind default breakpoints
sm: '640px'   // Small devices
md: '768px'   // Medium devices (tablets)
lg: '1024px'  // Large devices (desktops)
xl: '1280px'  // Extra large
2xl: '1536px' // 2X extra large
```

### Sidebar Responsive

```jsx
/* Mobile: Hidden */
<aside className="hidden md:flex ...">

/* Mobile Menu Toggle */
<button className="md:hidden p-2">
  <span className="material-symbols-outlined">menu</span>
</button>
```

### Grid Responsive

```jsx
/* Stats Grid */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

/* Content Grid */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
```

---

## ✨ Animaciones y Transiciones

### Transiciones Comunes

```css
/* Botones y links */
.transition-colors duration-200

/* Shadows en hover */
.hover:shadow-md transition-shadow

/* Iconos en hover */
.group-hover:scale-110 transition-transform

/* Backgrounds en hover */
.hover:bg-slate-50 transition-colors
```

### Efectos en Navegación

```jsx
<a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group">
  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
    dashboard
  </span>
  <span className="text-sm">Dashboard</span>
</a>
```

---

## 📊 Gráficas y Visualizaciones

### Gráfica de Dona (Occupancy Status)

```jsx
<div className="w-48 h-48 relative flex items-center justify-center">
  {/* Usando recharts o chart.js */}
  <Doughnut 
    data={occupancyData}
    options={{
      cutout: '70%',
      plugins: {
        legend: { display: false }
      }
    }}
  />
  
  {/* Centro de la dona */}
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    <span className="text-3xl font-bold text-slate-900 dark:text-white">85%</span>
    <span className="text-xs text-slate-500 font-medium">Occupied</span>
  </div>
</div>

{/* Leyenda */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-primary"></div>
      <span className="text-sm font-medium text-slate-700">Owners (60%)</span>
    </div>
    <span className="text-sm font-bold text-slate-900">120 Units</span>
  </div>
</div>
```

---

## 🎯 Layout Principal

### Estructura de Dashboard

```jsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar */}
  <aside className="w-64 ...">
    {/* Ver sección Sidebar */}
  </aside>
  
  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <header className="h-16 ...">
      {/* Ver sección Header */}
    </header>
    
    {/* Content Area */}
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, here's what's happening at Sunset Towers.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="...">Send Notice</button>
            <button className="...">Register Visitor</button>
            <button className="...">New Incident</button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat Cards */}
        </div>
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content */}
        </div>
      </div>
    </main>
  </div>
</div>
```

---

## 🎨 Configuración de Tailwind

### tailwind.config.js completo

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#135bec",
        "primary-dark": "#0f4bc2",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        // ... resto de colores
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

---

## ✅ Checklist de Implementación

Al crear un nuevo componente o página, asegúrate de:

- [ ] Usar colores del design system
- [ ] Aplicar border-radius consistente (`rounded-lg` o `rounded-xl`)
- [ ] Implementar dark mode con clases `dark:`
- [ ] Usar iconos de Material Symbols
- [ ] Aplicar transiciones suaves (`transition-colors`)
- [ ] Mantener padding consistente (`p-6` para tarjetas)
- [ ] Usar la jerarquía tipográfica correcta
- [ ] Implementar estados hover apropiados
- [ ] Hacer responsive con breakpoints `sm:`, `md:`, `lg:`
- [ ] Mantener espaciado consistente (`gap-6`, `space-y-6`)

---

## 📚 Recursos

### Archivos de Referencia
- `code.html` - Código completo del dashboard
- `screen.png` - Screenshot de referencia visual

### Links Externos
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Material Symbols](https://fonts.google.com/icons)
- [Inter Font](https://fonts.google.com/specimen/Inter)

---

**Versión**: 1.0
**Última Actualización**: [Fecha]
