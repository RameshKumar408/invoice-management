'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn, SlideIn, FormFieldAnimation, AnimatedButton, LoadingSpinner } from '@/components/animations';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [justLoggedIn, setJustLoggedIn] = useState(false);
    const [showBillingPrompt, setShowBillingPrompt] = useState(false);
    const { login, user, loading: authLoading } = useAuth();
    const router = useRouter();


    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
                <div className="flex items-center space-x-2">
                    <LoadingSpinner size={24} />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    // If there's an existing logged-in user (not from this login flow), don't render the login form
    if (user && !justLoggedIn) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            // Mark that user just logged in via this form and show prompt
            setJustLoggedIn(true);
            setShowBillingPrompt(true);
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBillingChoice = (startBilling) => {
        setShowBillingPrompt(false);
        setJustLoggedIn(false);
        if (startBilling) {
            router.push('/transactions/sale');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <FadeIn delay={0.2}>
                <SlideIn direction="up" duration={0.5}>
                    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="space-y-1">
                            <FadeIn delay={0.4}>
                                <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                            </FadeIn>
                            <FadeIn delay={0.5}>
                                <CardDescription className="text-center">
                                    Enter your email and password to access your account
                                </CardDescription>
                            </FadeIn>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <SlideIn direction="down" duration={0.3}>
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    </SlideIn>
                                )}

                                <FormFieldAnimation delay={0.6}>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="transition-all duration-300 focus:scale-105"
                                        />
                                    </div>
                                </FormFieldAnimation>

                                <FormFieldAnimation delay={0.7}>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="transition-all duration-300 focus:scale-105"
                                        />
                                    </div>
                                </FormFieldAnimation>

                                <FormFieldAnimation delay={0.8}>
                                    <Button
                                        type="submit"
                                        className="w-full transition-all duration-300 hover:scale-105"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <LoadingSpinner size={16} />
                                                <span>Signing in...</span>
                                            </div>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </Button>
                                </FormFieldAnimation>
                            </form>

                            <FadeIn delay={0.9}>
                                <div className="mt-4 text-center text-sm">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/register" className="text-primary hover:underline transition-colors duration-300 hover:scale-105 inline-block">
                                        Sign up
                                    </Link>
                                </div>
                            </FadeIn>
                        </CardContent>
                    </Card>
                </SlideIn>
            </FadeIn>

            {/* Billing Prompt Dialog */}
            <Dialog open={showBillingPrompt} onOpenChange={setShowBillingPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start Billing?</DialogTitle>
                        <DialogDescription>
                            Do you want to start billing now?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => handleBillingChoice(false)}
                            className="mr-2"
                        >
                            No
                        </Button>
                        <Button
                            onClick={() => handleBillingChoice(true)}
                        >
                            Yes
                        </Button>
                    </DialogFooter>
                    <DialogClose onClick={() => handleBillingChoice(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
