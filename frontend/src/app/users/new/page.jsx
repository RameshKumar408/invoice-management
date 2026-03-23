'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, ShieldPlus, Lock, Mail, Users, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { FadeIn, SlideIn, ScaleOnHover } from '@/components/animations';
import { useAuth } from '@/contexts/AuthContext';

export default function NewUserPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'staff'
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (currentUser && currentUser.role !== 'admin') {
            setError('Only admin can create users');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (response.success) {
                router.push('/users');
            } else {
                setError(response.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            setError(error.response?.data?.message || 'Email address might already be in use.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <Layout>
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex items-center space-x-4">
                        <ScaleOnHover>
                            <Link href="/users">
                                <Button variant="ghost" size="icon" className="h-10 w-10 border-2 border-primary/20 hover:border-primary/50 text-primary transition-all duration-300">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                        </ScaleOnHover>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Add Team Member</h1>
                            <p className="text-muted-foreground mt-1">Create a new account for your staff or salesperson</p>
                        </div>
                    </div>

                    <SlideIn direction="up">
                        <Card className="border-none shadow-xl bg-card">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="flex items-center space-x-2 text-xl">
                                    <UserPlus className="h-6 w-6 text-primary" />
                                    <span>Member Credentials</span>
                                </CardTitle>
                                <CardDescription>This information will be used for their login access.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6 pt-6">
                                    {error && (
                                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center space-x-3 text-sm animate-shake">
                                            <ShieldCheck className="h-4 w-4" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold flex items-center mb-1">
                                                <User className="h-3 w-3 mr-2 text-primary" />
                                                Full Name
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Example: Rahul Sharma"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="bg-muted/10 border-muted focus-visible:ring-primary h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold flex items-center mb-1">
                                                <Mail className="h-3 w-3 mr-2 text-primary" />
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="rahul@business.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="bg-muted/10 border-muted focus-visible:ring-primary h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-semibold flex items-center mb-1">
                                                <ShieldPlus className="h-3 w-3 mr-2 text-primary" />
                                                System Role
                                            </Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            >
                                                <SelectTrigger id="role" className="bg-muted/10 border-muted focus-visible:ring-primary h-11 transition-all">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent className="border-primary/20">
                                                    <SelectItem value="staff" className="flex items-center py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-primary">System Staff</span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">Full operational access</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="salesman" className="flex items-center py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-green-600">Salesman</span>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">Transactions only</span>
                                                        </div>
                                                    </SelectItem>
                                                    {/* To keep it cleaner I didn't add 'user' here, but it's in the enum if needed */}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-muted/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="password" title="At least 6 characters" className="text-sm font-semibold flex items-center mb-1">
                                                    <Lock className="h-3 w-3 mr-2 text-primary" />
                                                    Set Password
                                                </Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    className="bg-muted/10 border-muted focus-visible:ring-primary h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center mb-1">
                                                    <ShieldCheck className="h-3 w-3 mr-2 text-primary" />
                                                    Confirm Password
                                                </Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                    required
                                                    className="bg-muted/10 border-muted focus-visible:ring-primary h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-6 flex items-center justify-between border-t transition-all">
                                    <Link href="/users">
                                        <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-muted/50">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <ScaleOnHover>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary hover:bg-primary/90 px-8 h-11 shadow-lg shadow-primary/20"
                                        >
                                            {loading ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center space-x-2">
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    <span>Add Member</span>
                                                </span>
                                            )}
                                        </Button>
                                    </ScaleOnHover>
                                </CardFooter>
                            </form>
                        </Card>
                    </SlideIn>

                    <FadeIn delay={0.2}>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex space-x-4 items-start shadow-sm">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-primary">Team Management Note</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    You can assign roles to define access levels. <b>Staff</b> members have regular operational access, while <b>Salesmen</b> are restricted to transaction-related activities only.
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
