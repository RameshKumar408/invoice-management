'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    Calendar,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    ShoppingCart,
    AlertCircle,
    User,
    CreditCard,
    FileText,
    Package,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FadeIn, SlideIn, FormFieldAnimation, ScaleOnHover } from '@/components/animations';

const saleFormSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    paymentMethod: z.enum(['cash', 'credit', 'card'], {
        required_error: 'Payment method is required',
    }),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().optional(),
    products: z.array(z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be positive'),
        incPrice: z.number().min(0, 'Inc. Price must be positive').optional(),
        unitType: z.enum(['case', 'single']),
    })).min(1, 'At least one product is required'),
    discount: z.number().min(0, 'Discount must be positive').optional(),
});

export default function EditSalesRequestPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const form = useForm({
        resolver: zodResolver(saleFormSchema),
        defaultValues: {
            customerId: '',
            paymentMethod: 'cash',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            products: [{ productId: '', quantity: 1, price: 0, incPrice: 0, unitType: 'case' }],
            discount: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'products',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersResponse, productsResponse, requestResponse] = await Promise.all([
                    api.getContacts({ type: 'customer', limit: 1000 }),
                    api.getProducts({ limit: 1000 }),
                    api.getSalesRequests()
                ]);

                if (customersResponse.success) setCustomers(customersResponse.data.contacts);
                if (productsResponse.success) setProducts(productsResponse.data.products);

                const foundRequest = requestResponse.data?.requests?.find(r => r._id === id);
                if (foundRequest) {
                    form.reset({
                        customerId: typeof foundRequest.customerId === 'object' ? foundRequest.customerId._id : foundRequest.customerId,
                        paymentMethod: foundRequest.paymentMethod || 'cash',
                        date: foundRequest.date ? new Date(foundRequest.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        notes: foundRequest.notes || '',
                        products: (foundRequest.products || []).map(p => ({
                            productId: typeof p.productId === 'object' ? p.productId._id : p.productId,
                            quantity: p.quantity || 1,
                            price: p.price || 0,
                            incPrice: p.price || 0,
                            unitType: p.unitType || 'single'
                        })),
                        discount: foundRequest.discount || 0,
                    });
                } else {
                    setError('Sales request not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Calculate incPrice for existing items once products are loaded
    useEffect(() => {
        if (!loading && products.length > 0) {
            const currentProducts = form.getValues('products') || [];
            currentProducts.forEach((p, idx) => {
                if (!p.productId) return;
                const product = products.find(prod => prod._id === p.productId);
                if (product) {
                    const totalTaxRate = (product.cgst || 0) + (product.sgst || 0);
                    const incPrice = (p.price || 0) * (1 + totalTaxRate / 100);
                    form.setValue(`products.${idx}.incPrice`, Number(incPrice.toFixed(2)));
                }
            });
        }
    }, [loading, products, form]);

    // Handle price updates (Copied from AddSalePage)
    const handleProductChange = (index, productId) => {
        const selectedProduct = products.find(p => p._id === productId);
        if (selectedProduct) {
            const cgst = selectedProduct.cgst || 0;
            const sgst = selectedProduct.sgst || 0;
            const totalTaxRate = cgst + sgst;
            const incPrice = (form.getValues(`products.${index}.price`) || selectedProduct.price || 0) * (1 + totalTaxRate / 100);
            form.setValue(`products.${index}.incPrice`, Number(incPrice.toFixed(2)));
        }
    };

    const onIncPriceChange = (index, incPrice) => {
        const productId = form.getValues(`products.${index}.productId`);
        const selectedProduct = products.find(p => p._id === productId);
        if (selectedProduct) {
            const totalTaxRate = (selectedProduct.cgst || 0) + (selectedProduct.sgst || 0);
            const basePrice = (incPrice || 0) / (1 + totalTaxRate / 100);
            form.setValue(`products.${index}.price`, Number(basePrice.toFixed(2)));
        }
    };

    const calculateAmounts = () => {
        const watchedProducts = form.watch('products') || [];
        const discountAmount = form.watch('discount') || 0;
        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;

        watchedProducts.forEach(p => {
            if (!p || !p.productId) return;
            const product = products.find(prod => prod._id === p.productId);
            const itemTotal = (p.price || 0) * (p.quantity || 0);
            subtotal += itemTotal;
            if (product) {
                totalCgst += itemTotal * ((product.cgst || 0) / 100);
                totalSgst += itemTotal * ((product.sgst || 0) / 100);
            }
        });

        const total = subtotal + totalCgst + totalSgst - discountAmount;
        return { subtotal, sgst: totalSgst, cgst: totalCgst, total: Math.max(0, total) };
    };

    const onSubmit = async (data) => {
        try {
            setSaving(true);
            const amounts = calculateAmounts();
            const payload = {
                ...data,
                subtotal: Number(amounts.subtotal.toFixed(2)),
                sgst: Number(amounts.sgst.toFixed(2)),
                cgst: Number(amounts.cgst.toFixed(2)),
                totalAmount: Number(amounts.total.toFixed(2)),
            };

            const response = await api.updateSalesRequest(id, payload);
            if (response.success) {
                setSuccess('Sales request updated successfully!');
                setTimeout(() => router.push('/transactions/requests'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update request');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div></Layout>;

    return (
        <ProtectedRoute roles={['admin', 'staff', 'salesman']}>
            <Layout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <FadeIn delay={0.1}>
                        <div className="flex items-center gap-3">
                            <ScaleOnHover>
                                <Button variant="outline" onClick={() => router.back()} size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                            </ScaleOnHover>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Sales Request</h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">Modify the pending order details before approval</p>
                            </div>
                        </div>
                    </FadeIn>

                    {error && <FadeIn><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></FadeIn>}
                    {success && <FadeIn><Alert className="bg-green-50 border-green-200 text-green-800"><AlertDescription>{success}</AlertDescription></Alert></FadeIn>}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <SlideIn direction="up" delay={0.2}>
                                <Card>
                                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" />Customer & Payment</CardTitle></CardHeader>
                                    <CardContent className="grid gap-6 md:grid-cols-2">
                                        <FormField control={form.control} name="customerId" render={({ field }) => (
                                            <FormItem><FormLabel>Customer *</FormLabel><Combobox options={customers.map(c => ({ label: `${c.name} - ${c.phone}`, value: c._id }))} value={field.value} onValueChange={field.onChange} /><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="date" render={({ field }) => (
                                            <FormItem><FormLabel>Date *</FormLabel><Input type="date" {...field} /><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                            <FormItem><FormLabel>Payment Method *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="credit">Credit</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </CardContent>
                                </Card>
                            </SlideIn>

                            <SlideIn direction="up" delay={0.3}>
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Products</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 md:grid-cols-12 items-end border p-4 rounded-lg bg-card/50">
                                                <div className="md:col-span-4">
                                                    <FormField control={form.control} name={`products.${index}.productId`} render={({ field }) => (
                                                        <FormItem><FormLabel>Product *</FormLabel>
                                                            <Combobox options={products.map(p => ({ label: `${p.name} - Stock: ${p.stock}`, value: p._id }))} value={field.value} onValueChange={(val) => { field.onChange(val); handleProductChange(index, val); }} />
                                                        </FormItem>
                                                    )} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FormField control={form.control} name={`products.${index}.quantity`} render={({ field }) => (
                                                        <FormItem><FormLabel>Qty *</FormLabel><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormItem>
                                                    )} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FormField control={form.control} name={`products.${index}.incPrice`} render={({ field }) => (
                                                        <FormItem><FormLabel>Inc. Price</FormLabel><Input type="number" step="0.01" {...field} onChange={e => { const val = Number(e.target.value); field.onChange(val); onIncPriceChange(index, val); }} /></FormItem>
                                                    )} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <FormField control={form.control} name={`products.${index}.price`} render={({ field }) => (
                                                        <FormItem><FormLabel>Base Price *</FormLabel><Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormItem>
                                                    )} />
                                                </div>
                                                <div className="md:col-span-2 flex justify-between items-center gap-2">
                                                    <div className="text-right flex-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase">Item Total</p>
                                                        <p className="font-bold">₹{((form.watch(`products.${index}.quantity`) || 0) * (form.watch(`products.${index}.price`) || 0)).toFixed(2)}</p>
                                                    </div>
                                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ productId: '', quantity: 1, price: 0, incPrice: 0, unitType: 'single' })}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                                    </CardContent>
                                    <CardContent className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between items-center text-muted-foreground"><span>Subtotal:</span><span>₹{(calculateAmounts().subtotal || 0).toFixed(2)}</span></div>
                                        <div className="flex justify-between items-center text-muted-foreground"><span>Combined GST:</span><span>₹{((calculateAmounts().sgst || 0) + (calculateAmounts().cgst || 0)).toFixed(2)}</span></div>
                                        <div className="flex justify-between items-center py-2 border-y border-dashed bg-muted/40 px-2 rounded mt-2">
                                            <span className="font-medium">Discount (-):</span>
                                            <div className="w-32">
                                                <FormField control={form.control} name="discount" render={({ field }) => (
                                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} className="text-right h-8" />
                                                )} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-bold">Payable Amount:</span>
                                            <span className="text-2xl font-black text-green-600">₹{(calculateAmounts().total || 0).toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </SlideIn>

                            <FadeIn delay={0.4}>
                                <div className="flex justify-end gap-4">
                                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Update Sales Request
                                    </Button>
                                </div>
                            </FadeIn>
                        </form>
                    </Form>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
