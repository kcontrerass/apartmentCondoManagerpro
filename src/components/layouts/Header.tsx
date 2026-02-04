"use client";

import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

export function Header() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Common');

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

                console.log('🔍 Search Debug:', {
                    role: session?.user?.role,
                    shouldFilter,
                    userComplexId,
                    complexParam,
                    searchQuery
                });

                const [complexes, units, residents] = await Promise.all([
                    fetch(`/api/complexes?search=${searchQuery}${complexParam}`).then(r => r.json()),
                    fetch(`/api/units?search=${searchQuery}${complexParam}`).then(r => r.json()),
                    fetch(`/api/residents?search=${searchQuery}${complexParam}`).then(r => r.json())
                ]);

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

                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(performSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
            {/* Breadcrumbs */}
            <div className="flex-1 lg:flex-none">
                <Breadcrumbs />
            </div>

            {/* Search Bar - Hide on small mobile, show expand button or make smaller */}
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
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                    />

                    {/* Search Results Dropdown */}
                    {showResults && (searchResults.length > 0 || isSearching || searchQuery.length >= 2) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                            {isSearching ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
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
                                            <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                                {result.type === 'complex' ? 'domain' : result.type === 'unit' ? 'door_front' : 'person'}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{result.label}</p>
                                                <p className="text-xs text-slate-500 capitalize">{result.type === 'complex' ? 'Complejo' : result.type === 'unit' ? 'Unidad' : 'Residente'}</p>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 md:hidden">
                    <span className="material-symbols-outlined">search</span>
                </Button>

                {/* Language Switcher */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-2 text-slate-500 hover:text-primary transition-colors font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/30"
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
