'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Save, User, Phone, Mail, MapPin, FileText, AlertCircle, Hash } from 'lucide-react';
import { FadeIn, SlideIn, FormFieldAnimation, ScaleOnHover } from '@/components/animations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    type: z.enum(['customer', 'vendor'], {
        required_error: 'Please select a contact type',
    }),
    GSTIN: z.string().min(15, 'GSTIN must be 15 characters').max(15, 'GSTIN must be 15 characters'),
    code_name: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
});

export default function EditContactPage() {
    const router = useRouter();
    const params = useParams();
    const contactId = params?.id;

    const [loading, setLoading] = useState(false);
    const [loadingContact, setLoadingContact] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [contact, setContact] = useState(null);

    const form = useForm({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            type: 'customer',
            GSTIN: '',
            code_name: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: ''
            },
            notes: ''
        },
    });

    useEffect(() => {
        if (contactId) {
            loadContact();
        }
    }, [contactId]);

    const loadContact = async () => {
        try {
            const response = await apiClient.getContact(contactId);
            if (response.success || response.data) {
                const contactData = response.data?.contact || response.data;
                setContact(contactData);
                form.reset({
                    name: contactData.name || '',
                    phone: contactData.phone || '',
                    email: contactData.email || '',
                    type: contactData.type || 'customer',
                    GSTIN: contactData.GSTIN || '',
                    code_name: contactData.code_name || '',
                    address: {
                        street: contactData.address?.street || '',
                        city: contactData.address?.city || '',
                        state: contactData.address?.state || '',
                        zipCode: contactData.address?.zipCode || '',
                        country: contactData.address?.country || ''
                    },
                    notes: contactData.notes || ''
                });
            } else {
                setError('Failed to load contact');
            }
        } catch (err) {
            console.error('Load contact error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load contact');
        } finally {
            setLoadingContact(false);
        }
    };

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiClient.updateContact(contactId, data);
            if (response.success || response._id) {
                setSuccess('Contact updated successfully!');
                setTimeout(() => {
                    router.push('/contacts');
                }, 1500);
            } else {
                setError(response.message || 'Failed to update contact');
            }
        } catch (err) {
            console.error('Update contact error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update contact');
        } finally {
            setLoading(false);
        }
    };

    if (loadingContact) {
        return (
            <ProtectedRoute>
                <Layout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading contact details...</p>
                        </div>
                    </div>
                </Layout>
            </ProtectedRoute>
        );
    }

    if (!contact) {
        return (
            <ProtectedRoute>
                <Layout>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={() => router.push('/contacts')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Contacts
                            </Button>
                        </div>
                        <Alert variant="destructive">
                            <AlertDescription>{error || 'Contact not found'}</AlertDescription>
                        </Alert>
                    </div>
                </Layout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <FadeIn delay={0.1}>
                        <div className="flex items-center space-x-2">
                            <Link href="/contacts">
                                <ScaleOnHover>
                                    <Button variant="outline" size="sm">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </ScaleOnHover>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">Edit Contact</h1>
                                <p className="text-muted-foreground">Update contact information</p>
                            </div>
                        </div>
                    </FadeIn>

                    <SlideIn direction="up" duration={0.5}>
                        <Card className="max-w-4xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Contact Information
                                </CardTitle>
                                <CardDescription>
                                    Update the details for {contact.name}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {success && (
                                    <Alert className="border-green-200 bg-green-50 text-green-800 mb-6">
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                )}

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {/* Basic Information */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <FormFieldAnimation delay={0.2}>
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                <User className="inline h-4 w-4 mr-1" />
                                                                Full Name *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter full name"
                                                                    {...field}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>

                                            <FormFieldAnimation delay={0.3}>
                                                <FormField
                                                    control={form.control}
                                                    name="type"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Contact Type *</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                                                                        <SelectValue placeholder="Select contact type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="customer">Customer</SelectItem>
                                                                    <SelectItem value="vendor">Vendor</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>

                                            <FormFieldAnimation delay={0.4}>
                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                <Phone className="inline h-4 w-4 mr-1" />
                                                                Phone Number *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="tel"
                                                                    placeholder="Enter phone number"
                                                                    {...field}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>

                                            <FormFieldAnimation delay={0.5}>
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                <Mail className="inline h-4 w-4 mr-1" />
                                                                Email Address
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="email"
                                                                    placeholder="Enter email address"
                                                                    {...field}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>

                                            <FormFieldAnimation delay={0.55}>
                                                <FormField
                                                    control={form.control}
                                                    name="GSTIN"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                <Hash className="inline h-4 w-4 mr-1" />
                                                                GSTIN *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter 15-digit GSTIN"
                                                                    maxLength={15}
                                                                    {...field}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Goods and Services Tax Identification Number
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>

                                            <FormFieldAnimation delay={0.6}>
                                                <FormField
                                                    control={form.control}
                                                    name="code_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Code Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Contact code"
                                                                    {...field}
                                                                    readOnly
                                                                    className="transition-all duration-300 bg-muted cursor-not-allowed"
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Code name cannot be edited
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </FormFieldAnimation>
                                        </div>

                                        {/* Address Information */}
                                        <FormFieldAnimation delay={0.65}>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <FormLabel className="text-base font-semibold">Address</FormLabel>
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="address.street"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Street Address</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter street address"
                                                                        {...field}
                                                                        className="transition-all duration-300 focus:scale-105"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="address.city"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>City</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter city"
                                                                        {...field}
                                                                        className="transition-all duration-300 focus:scale-105"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="address.state"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>State/Province</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter state or province"
                                                                        {...field}
                                                                        className="transition-all duration-300 focus:scale-105"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="address.zipCode"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ZIP/Postal Code</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter ZIP or postal code"
                                                                        {...field}
                                                                        className="transition-all duration-300 focus:scale-105"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="address.country"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Country</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter country"
                                                                        {...field}
                                                                        className="transition-all duration-300 focus:scale-105"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </FormFieldAnimation>

                                        {/* Notes */}
                                        <FormFieldAnimation delay={0.7}>
                                            <FormField
                                                control={form.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            <FileText className="inline h-4 w-4 mr-1" />
                                                            Notes
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter any additional notes"
                                                                {...field}
                                                                className="transition-all duration-300 focus:scale-105"
                                                                rows={3}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormFieldAnimation>

                                        {/* Submit Button */}
                                        <FormFieldAnimation delay={0.8}>
                                            <div className="flex gap-4 pt-4">
                                                <ScaleOnHover>
                                                    <Button
                                                        type="submit"
                                                        className="flex-1 transition-all duration-300"
                                                        disabled={loading}
                                                    >
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {loading ? 'Updating Contact...' : 'Update Contact'}
                                                    </Button>
                                                </ScaleOnHover>

                                                <ScaleOnHover>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => router.push('/contacts')}
                                                        className="transition-all duration-300"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </ScaleOnHover>
                                            </div>
                                        </FormFieldAnimation>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </SlideIn>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
