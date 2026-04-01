'use client';

import { useEffect, useState, use } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPen, Save, ShieldCheck, Mail, User, ShieldPlus, ToggleLeft, ToggleRight, CircleX } from 'lucide-react';
import Link from 'next/link';
import { FadeIn, SlideIn, ScaleOnHover } from '@/components/animations';
import { useAuth } from '@/contexts/AuthContext';

export default function EditUserPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'staff',
        isActive: true
    });

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        const fetchUser = async () => {
            try {
                // We'll reuse getUsers and filter by ID for now, 
                // or we could add a getOne endpoint if needed.
                // For simplicity, let's fetch all and filter client-side 
                // since we're in the admin context and the list of users is usually small.
                const response = await apiClient.getUsers();
                if (response.success) {
                    const userToEdit = response.data.find(u => u._id === params.id);
                    if (userToEdit) {
                        setFormData({
                            name: userToEdit.name,
                            email: userToEdit.email,
                            role: userToEdit.role,
                            isActive: userToEdit.isActive
                        });
                    } else {
                        setError('User not found');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setError('Failed to fetch user details');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [params.id, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await apiClient.updateUser(params.id, {
                name: formData.name,
                role: formData.role,
                isActive: formData.isActive
            });

            if (response.success) {
                router.push('/users');
            }
        } catch (error) {
            console.error('Failed to update user:', error);
            setError(error.response?.data?.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <Layout>
                    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground animate-pulse">Fetching user data...</p>
                    </div>
                </Layout>
            </ProtectedRoute>
        );
    }

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
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Update Team Member</h1>
                            <p className="text-muted-foreground mt-1">Modify account settings for your staff</p>
                        </div>
                    </div>

                    <SlideIn direction="up">
                        <Card className="border-none shadow-xl bg-card overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="flex items-center space-x-2 text-xl">
                                    <UserPen className="h-6 w-6 text-primary" />
                                    <span>Profile Settings</span>
                                </CardTitle>
                                <CardDescription>Editing: <b className="text-primary">{formData.name}</b> ({formData.email})</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-6 pt-6">
                                    {error && (
                                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center space-x-3 text-sm">
                                            <CircleX className="h-4 w-4" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-semibold flex items-center mb-1">
                                                    <User className="h-3 w-3 mr-2 text-primary" />
                                                    Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="bg-muted/10 border-muted focus-visible:ring-primary h-11"
                                                />
                                            </div>

                                            <div className="space-y-2 opacity-60">
                                                <Label className="text-sm font-semibold flex items-center mb-1">
                                                    <Mail className="h-3 w-3 mr-2 text-primary" />
                                                    Locked Email
                                                </Label>
                                                <Input
                                                    disabled
                                                    value={formData.email}
                                                    className="bg-muted/5 border-muted h-11"
                                                />
                                                <p className="text-[10px] text-muted-foreground">Email identity cannot be changed</p>
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
                                                        <SelectItem value="admin" className="py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-purple-600">Administrator</span>
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">Full owner control</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="staff" className="py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-primary">System Staff</span>
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">Full operational access</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="salesman" className="py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-green-600">Salesman</span>
                                                                <span className="text-[10px] text-muted-foreground mt-0.5">Transactions only</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="bg-muted/10 p-4 rounded-lg flex items-center justify-between border border-muted">
                                                <div className="flex flex-col">
                                                    <Label className="font-semibold flex items-center mb-1">
                                                        {formData.isActive ? <ToggleRight className="h-4 w-4 mr-2 text-green-500" /> : <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" />}
                                                        Account Status
                                                    </Label>
                                                    <span className="text-[10px] text-muted-foreground">Toggle account availability</span>
                                                </div>
                                                <Switch
                                                    checked={formData.isActive}
                                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                                    className="data-[state=checked]:bg-green-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 p-6 flex items-center justify-between border-t transition-all">
                                    <Link href="/users">
                                        <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-muted/50 transition-colors">
                                            Discard Changes
                                        </Button>
                                    </Link>
                                    <ScaleOnHover>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="bg-primary hover:bg-primary/90 px-8 h-11 shadow-lg shadow-primary/20"
                                        >
                                            {saving ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Updating Profile...</span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center space-x-2">
                                                    <Save className="h-4 w-4 mr-2" />
                                                    <span>Save Changes</span>
                                                </span>
                                            )}
                                        </Button>
                                    </ScaleOnHover>
                                </CardFooter>
                            </form>
                        </Card>
                    </SlideIn>
                    
                    <FadeIn delay={0.3}>
                        <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-200/50 dark:border-orange-800/30 flex space-x-4 items-start shadow-sm">
                            <div className="p-2 rounded-lg text-orange-600 dark:text-orange-400">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-300">Administrative Precedence</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Upgrading a user to <b>Administrator</b> will grant them the same level of authority you currently hold. Use this option cautiously.
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
