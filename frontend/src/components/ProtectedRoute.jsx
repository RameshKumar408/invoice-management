'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, roles = [] }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (roles.length > 0 && !roles.includes(user.role)) {
                router.push('/');
            }
        }
    }, [user, loading, router, roles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || (roles.length > 0 && !roles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
