"use client";

import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { useSession } from 'next-auth/react';
import { Role } from "@/types/roles";
import { useMobileSidebar } from "./MobileSidebarContext";
import { useTheme } from "@/components/providers/ThemeProvider";

interface HeaderProps {
    isUnassigned?: boolean;
}

export function Header({ isUnassigned = false }: HeaderProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Common');
    const { isOpen, setIsOpen } = useMobileSidebar();
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleLanguage = () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const [userComplexId, setUserComplexId] = useState<string | null>(null);

    // Fetch user's complex based on role
    useEffect(() => {
        const fetchUserComplex = async () => {
            if (!session?.user) return;

            // 1. Try session first
            if ((session.user as any).complexId) {
                setUserComplexId((session.user as any).complexId);
                console.log('✅ Complex ID from session:', (session.user as any).complexId);
                return;
            }

            // 2. Fallback to Profile API (The most reliable source)
            try {
                console.log('🔍 Fetching complexId from profile fallback...');
                const response = await fetch('/api/users/profile');
                if (response.ok) {
                    const profileData = await response.json();

                    // Unified extraction logic
                    const recoveredId = profileData.complexId ||
                        (profileData.managedComplexes?.[0]?.id) ||
                        (profileData.residentProfile?.unit?.complexId);

                    if (recoveredId) {
                        setUserComplexId(recoveredId);
                        console.log('✅ Recovered complexId from profile:', recoveredId);
                    }
                } else if (session.user.role === Role.RESIDENT) {
                    // Resident fallback if profile fails for some reason
                    const resResponse = await fetch(`/api/residents?userId=${session.user.id}`);
                    const resData = await resResponse.json();
                    if (Array.isArray(resData) && resData.length > 0 && resData[0].unit) {
                        const recoveredId = resData[0].unit.complexId;
                        setUserComplexId(recoveredId);
                        console.log('🏠 Recovered (Resident) complexId:', recoveredId);
                    }
                }
            } catch (error) {
                console.error('Error fetching user complex:', error);
            }
        };

        fetchUserComplex();
    }, [session]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // Apply RBAC: Only SUPER_ADMIN can see everything
                const shouldFilter = session?.user?.role !== Role.SUPER_ADMIN;
                const complexParam = (shouldFilter && userComplexId) ? `&complexId=${userComplexId}` : '';
                const complexIdPath = (shouldFilter && userComplexId) ? `/complexes/${userComplexId}` : '';

                const searchRequests = [
                    fetch(`/api/complexes?search=${searchQuery}${complexParam}`).then(r => r.json()),
                    fetch(`/api/units?search=${searchQuery}${complexParam}`).then(r => r.json()),
                    fetch(`/api/residents?search=${searchQuery}${complexParam}`).then(r => r.json()),
                ];

                if (shouldFilter && userComplexId) {
                    searchRequests.push(fetch(`/api/complexes/${userComplexId}/incidents?search=${searchQuery}`).then(r => r.json()));
                    searchRequests.push(fetch(`/api/complexes/${userComplexId}/events?search=${searchQuery}`).then(r => r.json()));
                    searchRequests.push(fetch(`/api/complexes/${userComplexId}/announcements?search=${searchQuery}`).then(r => r.json()));
                } else {
                    searchRequests.push(fetch(`/api/incidents?search=${searchQuery}`).then(r => r.json()));
                    searchRequests.push(fetch(`/api/events?search=${searchQuery}`).then(r => r.json()));
                    searchRequests.push(fetch(`/api/announcements?search=${searchQuery}`).then(r => r.json()));
                }

                // Always search invoices if possible
                searchRequests.push(fetch(`/api/invoices?search=${searchQuery}${complexParam}`).then(r => r.json()));

                const [complexes, units, residents, incidentsRaw, eventsRaw, announcementsRaw, invoicesRaw] = await Promise.all(searchRequests);

                const incidents = Array.isArray(incidentsRaw) ? incidentsRaw : incidentsRaw?.data || [];
                const events = Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.data?.events || [];
                const announcements = Array.isArray(announcementsRaw) ? announcementsRaw : announcementsRaw?.data?.announcements || [];
                const invoices = Array.isArray(invoicesRaw) ? invoicesRaw : [];

                const results: any[] = [];

                if (Array.isArray(complexes)) {
                    complexes.slice(0, 3).forEach((c: any) => {
                        results.push({ type: 'complex', label: c.name, id: c.id, href: `/dashboard/complexes/${c.id}` });
                    });
                }

                if (Array.isArray(units)) {
                    units.slice(0, 3).forEach((u: any) => {
                        results.push({ type: 'unit', label: `Unidad ${u.number}`, id: u.id, href: `/dashboard/units` });
                    });
                }

                if (Array.isArray(residents)) {
                    residents.slice(0, 3).forEach((r: any) => {
                        results.push({ type: 'resident', label: r.user?.name || r.name || 'Residente', id: r.id, href: `/dashboard/residents` });
                    });
                }

                if (Array.isArray(incidents)) {
                    incidents.slice(0, 3).forEach((i: any) => {
                        results.push({ type: 'incident', label: i.title, id: i.id, href: `/dashboard/incidents/${i.id}` });
                    });
                }

                if (Array.isArray(events)) {
                    events.slice(0, 3).forEach((e: any) => {
                        results.push({ type: 'event', label: e.title, id: e.id, href: `/dashboard/events/${e.id}` });
                    });
                }

                if (Array.isArray(announcements)) {
                    announcements.slice(0, 3).forEach((a: any) => {
                        results.push({ type: 'announcement', label: a.title, id: a.id, href: `/dashboard/announcements/${a.id}` });
                    });
                }

                if (Array.isArray(invoices)) {
                    invoices.slice(0, 3).forEach((inv: any) => {
                        results.push({ type: 'invoice', label: `Factura ${inv.number}`, id: inv.id, href: `/dashboard/invoices` });
                    });
                }

                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, session?.user?.role, userComplexId]);

    const [showMobileSearch, setShowMobileSearch] = useState(false);

    return (
        <header
            className="h-16 md:h-16 bg-card border-b border-card-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                height: 'calc(4rem + env(safe-area-inset-top))'
            }}
        >
            {/* Mobile Search Overlay */}
            {showMobileSearch && (
                <div
                    className="absolute inset-x-0 top-0 bg-card z-50 flex flex-col px-4 md:hidden animate-in slide-in-from-top duration-200"
                    style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: 'calc(4rem + env(safe-area-inset-top))' }}
                >
                    <div className="flex items-center h-16 w-full">
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                            </span>
                            <input
                                autoFocus
                                type="search"
                                placeholder={t('search')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowResults(true);
                                }}
                                className="w-full pl-10 pr-10 py-2 rounded-lg border border-primary bg-slate-50 dark:bg-background-dark text-sm focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    setShowMobileSearch(false);
                                    setSearchQuery('');
                                    setShowResults(false);
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Results */}
                    {showResults && (searchResults.length > 0 || isSearching || searchQuery.length >= 2) && (
                        <div className="bg-card border-x border-b border-card-border rounded-b-lg shadow-lg max-h-[70vh] overflow-y-auto mb-4">
                            {isSearching ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    <span className="material-symbols-outlined animate-spin font-medium text-primary">progress_activity</span>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="py-2">
                                    {searchResults.map((result, idx) => (
                                        <div
                                            key={`${result.type}-${result.id}-${idx}-mobile`}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                console.log('📱 Mobile Search Click:', result.href);
                                                router.push(result.href);
                                                setShowResults(false);
                                                setSearchQuery('');
                                                setShowMobileSearch(false);
                                            }}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                        >
                                            <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 transition-colors")}>
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {result.type === 'complex' ? 'domain' :
                                                        result.type === 'unit' ? 'door_front' :
                                                            result.type === 'resident' ? 'person' :
                                                                result.type === 'incident' ? 'report_problem' :
                                                                    result.type === 'event' ? 'event' :
                                                                        result.type === 'announcement' ? 'campaign' : 'receipt_long'}
                                                </span>
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.label}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {result.type === 'complex' ? 'Complejo' :
                                                        result.type === 'unit' ? 'Unidad' :
                                                            result.type === 'resident' ? 'Residente' :
                                                                result.type === 'incident' ? 'Incidente' :
                                                                    result.type === 'event' ? 'Evento' :
                                                                        result.type === 'announcement' ? 'Aviso' : 'Factura'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden mr-2">
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                    <span className="material-symbols-outlined">menu</span>
                </Button>
            </div>

            {/* Breadcrumbs */}
            <div className="flex-1 lg:flex-none hidden sm:block">
                <Breadcrumbs />
            </div>

            {/* Search Bar - Desktop */}
            {!isUnassigned && (
                <div className="flex-1 max-w-md mx-4 hidden md:block" ref={searchRef}>
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                        </span>
                        <input
                            type="search"
                            placeholder={t('search')}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                        />

                        {/* Search Results Dropdown */}
                        {showResults && (searchResults.length > 0 || isSearching || searchQuery.length >= 2) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-card-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                                {isSearching ? (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        <span className="material-symbols-outlined animate-spin font-medium text-primary">progress_activity</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div className="py-2">
                                        {searchResults.map((result, idx) => (
                                            <Link
                                                key={`${result.type}-${result.id}-${idx}`}
                                                href={result.href}
                                                onClick={() => {
                                                    setShowResults(false);
                                                    setSearchQuery('');
                                                }}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                            >
                                                <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 transition-colors")}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {result.type === 'complex' ? 'domain' :
                                                            result.type === 'unit' ? 'door_front' :
                                                                result.type === 'resident' ? 'person' :
                                                                    result.type === 'incident' ? 'report_problem' :
                                                                        result.type === 'event' ? 'event' :
                                                                            result.type === 'announcement' ? 'campaign' : 'receipt_long'}
                                                    </span>
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {result.type === 'complex' ? 'Complejo' :
                                                            result.type === 'unit' ? 'Unidad' :
                                                                result.type === 'resident' ? 'Residente' :
                                                                    result.type === 'incident' ? 'Incidente' :
                                                                        result.type === 'event' ? 'Evento' :
                                                                            result.type === 'announcement' ? 'Aviso' : 'Factura'}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-slate-500">
                                        No se encontraron resultados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2">
                {!isUnassigned && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileSearch(true)}
                        className="text-slate-400 hover:text-slate-600 md:hidden"
                    >
                        <span className="material-symbols-outlined">search</span>
                    </Button>
                )}

                {/* Theme Toggle */}
                {mounted ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="text-slate-500 hover:text-primary transition-colors"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-primary transition-colors opacity-0 pointer-events-none"
                    >
                        <span className="material-symbols-outlined text-[20px]">light_mode</span>
                    </Button>
                )}

                {/* Language Switcher */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-2 text-slate-500 hover:text-primary transition-colors font-medium border border-card-border rounded-lg hover:border-primary/30"
                >
                    <span className="material-symbols-outlined text-[18px]">language</span>
                    <span className="uppercase text-xs">{locale === 'es' ? 'EN' : 'ES'}</span>
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hidden sm:flex">
                    <span className="material-symbols-outlined">help</span>
                </Button>
            </div>
        </header>
    );
}
