'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    category: z.string().min(2, 'Category must be at least 2 characters'),
    description: z.string().optional().or(z.literal('')),
    price: z.coerce.number().min(0, 'Price must be at least 0'),
    stock: z.coerce.number().int().min(0, 'Stock quantity must be at least 0'),
    minStockLevel: z.coerce.number().int().min(0, 'Minimum stock level must be at least 0').optional().or(z.literal('')),
    HSN: z.string().optional().or(z.literal('')),
    cgst: z.coerce.number().min(0, 'CGST must be at least 0').default(0),
    sgst: z.coerce.number().min(0, 'SGST must be at least 0').default(0),
});

export default function NewProductPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            category: '',
            description: '',
            price: 0,
            stock: 0,
            minStockLevel: 0,
            HSN: '',
            cgst: 0,
            sgst: 0,
        },
    });

    const onSubmit = async (data) => {
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.createProduct(data);
            if (response.success || response._id) { // Handle potential varied response structures
                router.push('/products');
            } else {
                setError(response.message || 'Failed to create product');
            }
        } catch (err) {
            console.error('Create product error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Link href="/products">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Add New Product</h1>
                            <p className="text-muted-foreground">Create a new product in your inventory</p>
                        </div>
                    </div>

                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Enter the product information below</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" className="mb-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter product name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Electronics, Clothing, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Product description..." {...field} rows={3} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price *</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" min="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="stock"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Stock Quantity *</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="minStockLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Min Stock Level</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="cgst"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>CGST (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" min="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="sgst"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>SGST (%)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" min="0" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="HSN"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>HSN (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., PROD-001" {...field} />
                                                </FormControl>
                                                <FormDescription>Stock Keeping Unit unique identifier</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex space-x-2 pt-4">
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Creating...' : 'Create Product'}
                                        </Button>
                                        <Link href="/products">
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
