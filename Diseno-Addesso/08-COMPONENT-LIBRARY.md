# Component Library - CondoManager Pro

## 🧩 Componentes React Reutilizables

Esta es una biblioteca de componentes extraídos directamente del diseño de referencia. Cada componente está listo para usar con TypeScript y Tailwind CSS.

---

## 📦 Componentes de Layout

### MainLayout

```tsx
// src/components/layouts/MainLayout.tsx

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

### Sidebar

```tsx
// src/components/layouts/Sidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

const navSections = [
  {
    label: 'Main',
    items: [
      { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
      { icon: 'domain', label: 'Complexes', href: '/dashboard/complexes' },
      { icon: 'door_front', label: 'Units', href: '/dashboard/units' },
      { icon: 'group', label: 'Neighbors', href: '/dashboard/residents' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: 'pool', label: 'Amenities', href: '/dashboard/amenities' },
      { icon: 'handyman', label: 'Services', href: '/dashboard/services' },
      { icon: 'payments', label: 'Billing', href: '/dashboard/billing' },
      { icon: 'badge', label: 'Access Control', href: '/dashboard/access' },
    ],
  },
  {
    label: 'Support',
    items: [
      { icon: 'forum', label: 'Communications', href: '/dashboard/communications' },
      { icon: 'warning', label: 'Incidents', href: '/dashboard/incidents', badge: 3 },
      { icon: 'bar_chart', label: 'Reports', href: '/dashboard/reports' },
      { icon: 'description', label: 'Documents', href: '/dashboard/documents' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 z-20">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-[20px]">apartment</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none tracking-tight">
            CondoManager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
            Admin Console
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 first:mt-2">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">JA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              James Anderson
            </p>
            <p className="text-xs text-slate-500 truncate">Super Admin</p>
          </div>
          <button className="p-1 text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
```

---

### Header

```tsx
// src/components/layouts/Header.tsx

'use client';

import { useState } from 'react';

export default function Header() {
  const [selectedComplex, setSelectedComplex] = useState('Sunset Towers - Block A');

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between">
      {/* Complex Selector */}
      <button className="flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors">
        <span className="material-symbols-outlined text-slate-500">domain</span>
        <span>{selectedComplex}</span>
        <span className="material-symbols-outlined text-slate-400">expand_more</span>
      </button>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="search"
            placeholder="Search unit, resident, or tag..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>
    </header>
  );
}
```

---

## 📊 Componentes de Dashboard

### StatCard

```tsx
// src/components/dashboard/StatCard.tsx

interface StatCardProps {
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
}

const badgeStyles = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function StatCard({
  icon,
  iconBgColor = 'bg-blue-50 dark:bg-blue-900/20',
  iconColor = 'text-primary',
  label,
  value,
  subtitle,
  badge,
}: StatCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${iconBgColor} rounded-lg`}>
          <span className={`material-symbols-outlined ${iconColor} text-[24px]`}>
            {icon}
          </span>
        </div>
        {badge && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeStyles[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {value}
      </h3>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Uso:
// <StatCard
//   icon="payments"
//   label="Total Debt"
//   value="$12,450"
//   subtitle="Vs last month"
//   badge={{ text: '+2%', variant: 'success' }}
// />
```

---

### PageHeader

```tsx
// src/components/dashboard/PageHeader.tsx

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// Uso:
// <PageHeader
//   title="Dashboard Overview"
//   subtitle="Welcome back, here's what's happening at Sunset Towers."
//   actions={
//     <>
//       <Button variant="secondary" icon="mail">Send Notice</Button>
//       <Button variant="secondary" icon="person_add">Register Visitor</Button>
//       <Button variant="primary" icon="warning">New Incident</Button>
//     </>
//   }
// />
```

---

### ActivityTable

```tsx
// src/components/dashboard/ActivityTable.tsx

interface Activity {
  reference: string;
  type: string;
  status: {
    label: string;
    variant: 'success' | 'warning' | 'info' | 'neutral';
  };
  datetime: string;
  details: string;
}

interface ActivityTableProps {
  activities: Activity[];
  onViewAll?: () => void;
}

const statusStyles = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function ActivityTable({ activities, onViewAll }: ActivityTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary font-medium hover:underline"
          >
            View All
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
            {activities.map((activity, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {activity.reference}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {activity.type}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[activity.status.variant]}`}>
                    {activity.status.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {activity.datetime}
                </td>
                <td className="px-6 py-4 text-right text-slate-500">
                  {activity.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### OccupancyChart

```tsx
// src/components/dashboard/OccupancyChart.tsx

'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OccupancyData {
  owners: number;
  tenants: number;
  vacant: number;
}

interface OccupancyChartProps {
  data: OccupancyData;
  totalUnits: number;
}

export default function OccupancyChart({ data, totalUnits }: OccupancyChartProps) {
  const occupancyRate = Math.round(((data.owners + data.tenants) / totalUnits) * 100);

  const chartData = {
    labels: ['Owners', 'Tenants', 'Vacant'],
    datasets: [
      {
        data: [data.owners, data.tenants, data.vacant],
        backgroundColor: ['#135bec', '#10b981', '#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Occupancy Status
      </h3>

      {/* Chart */}
      <div className="flex items-center justify-center min-h-[250px] relative mb-6">
        <div className="w-48 h-48 relative">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {occupancyRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">Occupied</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Owners ({Math.round((data.owners / totalUnits) * 100)}%)
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {data.owners} Units
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tenants ({Math.round((data.tenants / totalUnits) * 100)}%)
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {data.tenants} Units
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Vacant ({Math.round((data.vacant / totalUnits) * 100)}%)
            </span>
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {data.vacant} Units
          </span>
        </div>
      </div>

      <button className="w-full mt-6 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        View Detailed Report
      </button>
    </div>
  );
}
```

---

## 🔘 Componentes UI Base

### Button

```tsx
// src/components/ui/Button.tsx

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      )}
    </button>
  );
}

// Uso:
// <Button variant="primary" icon="add">New Complex</Button>
// <Button variant="secondary" icon="mail">Send Notice</Button>
```

---

### Badge

```tsx
// src/components/ui/Badge.tsx

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const variants = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
```

---

### Card

```tsx
// src/components/ui/Card.tsx

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div className={`
      bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm
      ${hover ? 'hover:shadow-md transition-shadow' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
```

---

## 📋 Ejemplo de Uso Completo

```tsx
// src/app/dashboard/page.tsx

import MainLayout from '@/components/layouts/MainLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import ActivityTable from '@/components/dashboard/ActivityTable';
import OccupancyChart from '@/components/dashboard/OccupancyChart';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const activities = [
    {
      reference: 'Unit 402',
      type: 'Maintenance Fee',
      status: { label: 'Paid', variant: 'success' as const },
      datetime: 'Today, 11:30 AM',
      details: '$250.00',
    },
    // ... más actividades
  ];

  const occupancyData = {
    owners: 120,
    tenants: 50,
    vacant: 30,
  };

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Page Header */}
        <PageHeader
          title="Dashboard Overview"
          subtitle="Welcome back, here's what's happening at Sunset Towers."
          actions={
            <>
              <Button variant="secondary" icon="mail">Send Notice</Button>
              <Button variant="secondary" icon="person_add">Register Visitor</Button>
              <Button variant="primary" icon="warning">New Incident</Button>
            </>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="payments"
            label="Total Debt"
            value="$12,450"
            subtitle="Vs last month"
            badge={{ text: '+2%', variant: 'success' }}
          />
          <StatCard
            icon="warning"
            iconBgColor="bg-orange-50 dark:bg-orange-900/20"
            iconColor="text-orange-500"
            label="Open Incidents"
            value="3"
            subtitle="Requires attention"
            badge={{ text: '1 High Priority', variant: 'warning' }}
          />
          {/* Más stat cards... */}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ActivityTable activities={activities} />
          </div>
          <OccupancyChart data={occupancyData} totalUnits={200} />
        </div>
      </div>
    </MainLayout>
  );
}
```

---

## 📦 Instalación de Dependencias

```bash
# Next.js + TypeScript
npm install next react react-dom
npm install -D typescript @types/react @types/node

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npm install @tailwindcss/forms

# Chart.js (para gráficas)
npm install react-chartjs-2 chart.js

# Material Symbols (iconos)
# Agregar en layout.tsx o _document.tsx:
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

---

**Versión**: 1.0
**Última Actualización**: [Fecha]
