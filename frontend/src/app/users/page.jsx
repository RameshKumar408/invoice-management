'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Plus, Search, Pencil, Trash2, User, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FadeIn, ScaleOnHover } from '@/components/animations';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Only admin can access this page
        if (currentUser && currentUser.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        loadUsers();
    }, [currentUser, search]);

    const loadUsers = async () => {
        try {
            const response = await apiClient.getUsers({ search });
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await apiClient.deleteUser(id);
                loadUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Admin</Badge>;
            case 'staff':
                return <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">Staff</Badge>;
            case 'salesman':
                return <Badge variant="outline" className="border-green-600 text-green-600">Salesman</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <ProtectedRoute roles={['admin']}>
            <Layout>
                <div className="space-y-6">
                    <FadeIn>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">User Management</h1>
                                <p className="text-muted-foreground mt-1">Manage staff and salesman permissions</p>
                            </div>
                            <ScaleOnHover>
                                <Link href="/users/new">
                                    <Button className="bg-primary hover:bg-primary/90 shadow-md transition-all duration-300">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New User
                                    </Button>
                                </Link>
                            </ScaleOnHover>
                        </div>
                    </FadeIn>

                    <Card className="border-none shadow-lg overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-xl">System Users</CardTitle>
                            <CardDescription>All employees and staff associated with your business</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 flex items-center space-x-2 bg-muted/10">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 bg-background"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Loading users...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-semibold">User Info</TableHead>
                                                <TableHead className="font-semibold">Role</TableHead>
                                                <TableHead className="font-semibold text-center">Status</TableHead>
                                                <TableHead className="font-semibold">Joined Date</TableHead>
                                                <TableHead className="font-semibold text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users?.map((u, index) => (
                                                <TableRow key={u._id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                                {u.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-foreground flex items-center">
                                                                    {u.name}
                                                                    {u._id === currentUser?.id && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Me</span>}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground flex items-center">
                                                                    <Mail className="h-3 w-3 mr-1" />
                                                                    {u.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                                            {getRoleBadge(u.role)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant={u.isActive ? "default" : "destructive"} className={u.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {new Date(u.createdAt).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            {/* We don't allow editing or deleting yourself here for safety */}
                                                            {u._id !== currentUser?.id && (
                                                                <>
                                                                    <ScaleOnHover>
                                                                        <Link href={`/users/${u._id}/edit`}>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                        </Link>
                                                                    </ScaleOnHover>
                                                                    <ScaleOnHover>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleDelete(u._id)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </ScaleOnHover>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {users.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12">
                                                        <div className="flex flex-col items-center justify-center space-y-3">
                                                            <User className="h-12 w-12 text-muted-foreground/30" />
                                                            <p className="text-muted-foreground font-medium">No other users found</p>
                                                            <Link href="/users/new">
                                                                <Button variant="outline" size="sm">Add your first employee</Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
