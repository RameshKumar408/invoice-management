'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { Plus, Search, Edit, Trash2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [search, activeTab]);

    useEffect(() => {
        loadContacts();
    }, [search, activeTab, page]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            let response;
            const params = { search, page, limit: 10 };

            if (activeTab === 'customers') {
                response = await apiClient.getCustomers(params);
            } else if (activeTab === 'vendors') {
                response = await apiClient.getVendors(params);
            } else {
                response = await apiClient.getContacts(params);
            }

            if (response.success) {
                setContacts(response.data.contacts || response.data.customers || response.data.vendors);
                setTotalPages(response.data.pagination?.pages || 1);
            }
        } catch (error) {
            console.error('Failed to load contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this contact?')) {
            try {
                await apiClient.deleteContact(id);
                loadContacts();
            } catch (error) {
                console.error('Failed to delete contact:', error);
            }
        }
    };

    const ContactTable = ({ contacts }) => (
        <div className="rounded-md border max-h-[500px] overflow-auto relative bg-white">
            <Table className="min-w-[1000px]">
                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <TableRow>
                        <TableHead className="font-bold">Name</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="font-bold">GSTIN</TableHead>
                        <TableHead className="font-bold">Code Name</TableHead>
                        <TableHead className="font-bold">Contact Info</TableHead>
                        {/* <TableHead className="font-bold">Balance</TableHead> */}
                        <TableHead className="font-bold">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contacts.map((contact) => (
                        <TableRow key={contact._id}>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{contact.name}</div>
                                    {contact.address?.city && (
                                        <>
                                            <div className="text-sm text-muted-foreground">
                                                {contact?.address?.street}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {contact.address.city}, {contact.address.state}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={contact.type === 'customer' ? 'default' : 'secondary'}>
                                    {contact.type}
                                </Badge>
                            </TableCell>
                            <TableCell>{contact.GSTIN || 'N/A'}</TableCell>
                            <TableCell>{contact.code_name || 'N/A'}</TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-1 text-sm">
                                        <Phone className="h-3 w-3" />
                                        <a
                                            href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-primary hover:underline"
                                        >
                                            {contact.phone}
                                        </a>
                                    </div>
                                    {contact.email && (
                                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span>{contact.email}</span>
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            {/* <TableCell>
                                <div className={`font-medium ${contact.currentBalance > 0 ? 'text-green-500' :
                                    contact.currentBalance < 0 ? 'text-red-500' : ''
                                    }`}>
                                    RS {Number(contact.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Limit: RS {Number(contact.creditLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </TableCell> */}
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Link href={`/contacts/${contact._id}/edit`}>
                                        <Button variant="outline" size="sm" aria-label={`Edit ${contact.name}`}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(contact._id)}
                                        aria-label={`Delete ${contact.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {contacts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No contacts found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const Pagination = () => (
        <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Contacts</h1>
                            <p className="text-muted-foreground">Manage your customers and vendors</p>
                        </div>
                        <Link href="/contacts/new">
                            <Button className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Contact
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Management</CardTitle>
                            <CardDescription>All your customers and vendors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                                <div className="relative w-full sm:max-w-sm">
                                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search contacts..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                                    <TabsList className="w-full sm:w-auto h-auto p-1 flex sm:inline-flex">
                                        <TabsTrigger value="all" className="flex-1 sm:flex-none py-2 px-4 whitespace-nowrap">All Contacts</TabsTrigger>
                                        <TabsTrigger value="customers" className="flex-1 sm:flex-none py-2 px-4 whitespace-nowrap">Customers</TabsTrigger>
                                        <TabsTrigger value="vendors" className="flex-1 sm:flex-none py-2 px-4 whitespace-nowrap">Vendors</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="all" className="mt-4 outline-none">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-48">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <ContactTable contacts={contacts} />
                                            <Pagination />
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="customers" className="mt-4 outline-none">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-48">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <ContactTable contacts={contacts} />
                                            <Pagination />
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="vendors" className="mt-4 outline-none">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-48">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <ContactTable contacts={contacts} />
                                            <Pagination />
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
