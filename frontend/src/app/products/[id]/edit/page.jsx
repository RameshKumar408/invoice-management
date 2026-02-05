'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { ArrowLeft, AlertCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productSchema = z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    category: z.string().min(2, 'Category must be at least 2 characters'),
    description: z.string().optional(),
    price: z.coerce.number().gt(0, 'Price must be greater than 0'),
    stock: z.coerce.number().int().gt(0, 'Stock quantity must be greater than 0'),
    minStockLevel: z.coerce.number().int().gt(0, 'Minimum stock level must be greater than 0').optional(),
    HSN: z.string().min(2, 'HSN must be at least 2 characters'),
    cgst: z.coerce.number().min(0, 'CGST must be at least 0').default(0),
    sgst: z.coerce.number().min(0, 'SGST must be at least 0').default(0),
});

export default function EditProductPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const router = useRouter();
    const params = useParams();
    const productId = params?.id;

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

    useEffect(() => {
        if (productId) {
            loadProduct();
        }
    }, [productId]);

    const loadProduct = async () => {
        try {
            const response = await apiClient.getProduct(productId);
            if (response.success || response.data) {
                const productData = response.data?.product || response.data;
                form.reset({
                    name: productData.name || '',
                    category: productData.category || '',
                    description: productData.description || '',
                    price: productData.price || 0,
                    stock: productData.stock || 0,
                    minStockLevel: productData.minStockLevel || 0,
                    HSN: productData.HSN || '',
                    cgst: productData.cgst || 0,
                    sgst: productData.sgst || 0,
                });
            } else {
                setError('Failed to load product');
            }
        } catch (err) {
            console.error('Load product error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load product');
        } finally {
            setLoadingProduct(false);
        }
    };

    const onSubmit = async (data) => {
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.updateProduct(productId, data);
            if (response.success || response._id) {
                router.push('/products');
            } else {
                setError(response.message || 'Failed to update product');
            }
        } catch (err) {
            console.error('Update product error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update product');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProduct) {
        return (
            <ProtectedRoute>
                <Layout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading product details...</p>
                        </div>
                    </div>
                </Layout>
            </ProtectedRoute>
        );
    }

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
                            <h1 className="text-3xl font-bold">Edit Product</h1>
                            <p className="text-muted-foreground">Update product information</p>
                        </div>
                    </div>

                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Product Details
                            </CardTitle>
                            <CardDescription>Update the product information below</CardDescription>
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
                                                <FormLabel>HSN *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., PROD-001" {...field} />
                                                </FormControl>
                                                <FormDescription>Harmonized System of Nomenclature code</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex space-x-2 pt-4">
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Updating...' : 'Update Product'}
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
