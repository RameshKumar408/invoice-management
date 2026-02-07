'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LayoutDashboard,
    Package,
    Users,
    Receipt,
    BarChart3,
    LogOut,
    User,
    Menu,
    X,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    // { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Layout({ children }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const toggleSidebar = () => {
        if (isMobile) {
            setMobileMenuOpen(!mobileMenuOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center px-4">
                    <div className="flex items-center space-x-4">
                        {/* Desktop Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="h-9 w-9 hidden md:flex"
                            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                        >
                            {sidebarCollapsed ? (
                                <PanelLeft className="h-5 w-5" />
                            ) : (
                                <PanelLeftClose className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="h-9 w-9 md:hidden"
                            title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>

                        <h1 className="text-xl font-bold">Inventory & Billing</h1>
                    </div>

                    <div className="ml-auto flex items-center space-x-4">
                        <ThemeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full border-2 hover:bg-accent">
                                    <User className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        <p className="font-medium">{user?.name}</p>
                                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex relative">
                {/* Mobile Sidebar - Slide in from left */}
                <aside
                    className={cn(
                        'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden',
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    <nav className="flex flex-col gap-2 p-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                                    )}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Desktop Sidebar */}
                <aside
                    className={cn(
                        'hidden md:block border-r bg-muted/10 transition-all duration-300 ease-in-out overflow-hidden min-h-[calc(100vh-4rem)]',
                        sidebarCollapsed ? 'w-0' : 'w-64'
                    )}
                >
                    <nav className={cn(
                        'flex flex-col gap-2 p-4 transition-opacity duration-200',
                        sidebarCollapsed ? 'opacity-0' : 'opacity-100'
                    )}>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 p-4 md:p-6 transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
