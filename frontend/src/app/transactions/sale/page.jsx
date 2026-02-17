'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Layout } from '@/components/Layout';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    ShoppingCart,
    AlertCircle,
    User,
    CreditCard,
    FileText,
    Package
} from 'lucide-react';
import { api } from '@/lib/api';
import { FadeIn, SlideIn, FormFieldAnimation, ScaleOnHover } from '@/components/animations';

// Form validation schema
const saleFormSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    paymentMethod: z.enum(['cash', 'credit', 'card'], {
        required_error: 'Payment method is required',
    }),
    notes: z.string().optional(),
    products: z.array(z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be positive'),
        incPrice: z.number().min(0, 'Inc. Price must be positive').optional(),
        unitType: z.enum(['case', 'single']),
    })).min(1, 'At least one product is required'),
    discount: z.number().min(0, 'Discount must be positive').optional(),
    initialPayment: z.number().min(0, 'Initial payment must be positive').optional(),
});

export default function AddSalePage() {
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState(null);

    const form = useForm({
        resolver: zodResolver(saleFormSchema),
        defaultValues: {
            customerId: '',
            paymentMethod: 'cash',
            notes: '',
            products: [{ productId: '', quantity: 1, price: 0, incPrice: 0, unitType: 'case' }],
            discount: 0,
            initialPayment: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'products',
    });

    // Fetch customers and products
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersResponse, productsResponse] = await Promise.all([
                    api.getContacts({ type: 'customer', limit: 1000 }),
                    api.getProducts({ limit: 1000 })
                ]);

                if (customersResponse.success) {
                    setCustomers(customersResponse.data.contacts);
                }

                if (productsResponse.success) {
                    setProducts(productsResponse.data.products);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
            }
        };

        fetchData();
    }, []);

    // Update price when product is selected
    const handleProductChange = (index, productId) => {
        const selectedProduct = products.find(p => p._id === productId);
        const customerId = form.getValues('customerId');
        const selectedCustomer = customers.find(c => c._id === customerId);

        if (selectedProduct) {
            let incPrice;
            const cgst = selectedProduct.cgst || 0;
            const sgst = selectedProduct.sgst || 0;
            const totalTaxRate = cgst + sgst;

            // Check if customer has a custom special price for this product
            const customSpecial = selectedCustomer?.customProductPrices?.find(cp => cp.productId === productId || cp.productId?._id === productId);

            if (customSpecial && customSpecial.inclusivePrice) {
                incPrice = customSpecial.inclusivePrice;
                const basePrice = incPrice / (1 + totalTaxRate / 100);
                form.setValue(`products.${index}.price`, Number(basePrice.toFixed(2)));
                form.setValue(`products.${index}.incPrice`, Number(incPrice.toFixed(2)));
            } else {
                incPrice = selectedProduct.price || 0;
                const basePrice = incPrice / (1 + totalTaxRate / 100);
                form.setValue(`products.${index}.price`, Number(basePrice.toFixed(2)));
                form.setValue(`products.${index}.incPrice`, Number(incPrice.toFixed(2)));
            }
        }
    };

    // Watch for customer change to update all product prices
    const watchCustomerId = form.watch('customerId');
    useEffect(() => {
        const productFields = form.getValues('products');
        if (productFields && productFields.length > 0) {
            productFields.forEach((field, index) => {
                if (field.productId) {
                    handleProductChange(index, field.productId);
                }
            });
        }
    }, [watchCustomerId, products, customers]);

    // Handle Inclusive Price change
    const onIncPriceChange = (index, incPrice) => {
        const productId = form.getValues(`products.${index}.productId`);
        const selectedProduct = products.find(p => p._id === productId);

        if (selectedProduct) {
            const cgst = selectedProduct.cgst || 0;
            const sgst = selectedProduct.sgst || 0;
            const totalTaxRate = cgst + sgst;
            const basePrice = incPrice / (1 + totalTaxRate / 100);

            form.setValue(`products.${index}.price`, Number(basePrice.toFixed(2)));
        } else {
            form.setValue(`products.${index}.price`, incPrice);
        }
    };

    // Handle Base Price change
    const onPriceChange = (index, price) => {
        const productId = form.getValues(`products.${index}.productId`);
        const selectedProduct = products.find(p => p._id === productId);

        if (selectedProduct) {
            const cgst = selectedProduct.cgst || 0;
            const sgst = selectedProduct.sgst || 0;
            const totalTaxRate = cgst + sgst;
            const incPrice = price * (1 + totalTaxRate / 100);

            form.setValue(`products.${index}.incPrice`, Number(incPrice.toFixed(2)));
        }
    };

    // Calculate amounts
    const calculateAmounts = () => {
        const watchedProducts = form.watch('products');
        const discountAmount = form.watch('discount') || 0;
        const initialPayment = form.watch('initialPayment') || 0;

        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;

        watchedProducts.forEach(p => {
            const product = products.find(prod => prod._id === p.productId);
            const itemPrice = p.price || 0;
            const itemQty = p.quantity || 0;
            const itemTotal = itemPrice * itemQty;

            subtotal += itemTotal;

            const cgstRate = product?.cgst || 0;
            const sgstRate = product?.sgst || 0;

            totalCgst += itemTotal * (cgstRate / 100);
            totalSgst += itemTotal * (sgstRate / 100);
        });

        const originalAmount = subtotal + totalCgst + totalSgst;
        const total = originalAmount - discountAmount;
        const balanceDue = Math.max(0, total - initialPayment);

        return {
            subtotal,
            sgst: totalSgst,
            cgst: totalCgst,
            originalAmount,
            total: Math.max(0, total),
            discountAmount,
            balanceDue
        };
    };

    const onSubmit = (data) => {
        const amounts = calculateAmounts();
        const saleData = {
            type: 'sale',
            customerId: data.customerId,
            products: data.products,
            paymentMethod: data.paymentMethod,
            notes: data.notes,
            subtotal: amounts.subtotal,
            sgst: amounts.sgst,
            cgst: amounts.cgst,
            discount: data.discount || 0,
            initialPayment: data.initialPayment || 0,
            totalAmount: amounts.total,
        };
        setPendingData(saleData);
        setIsConfirmOpen(true);
    };

    const processSale = async (status) => {
        try {
            setLoading(true);
            setError('');
            setIsConfirmOpen(false);

            const finalData = { ...pendingData, status };
            const response = await api.createTransaction(finalData);

            if (response.success) {
                setSuccess('Sale recorded successfully!');
                setTimeout(() => {
                    router.push('/transactions');
                }, 2000);
            } else {
                setError(response.message || 'Failed to record sale');
            }
        } catch (err) {
            console.error('Error creating sale:', err);
            setError(err.response?.data?.message || 'Error recording sale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <FadeIn delay={0.1}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <ScaleOnHover>
                            <Button variant="outline" onClick={() => router.back()} size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </ScaleOnHover>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Record a new sale transaction for your customers
                            </p>
                        </div>
                    </div>
                </FadeIn>

                {error && (
                    <FadeIn>
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </FadeIn>
                )}

                {success && (
                    <FadeIn>
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    </FadeIn>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Customer & Payment Info */}
                        <SlideIn direction="up" delay={0.2}>
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
                                    <div className="space-y-1.5">
                                        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Customer & Payment Information
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            Select the customer and payment details
                                        </CardDescription>
                                    </div>
                                    <ScaleOnHover className="w-full sm:w-auto">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push('/contacts/new')}
                                            className="w-full sm:w-auto"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Customer
                                        </Button>
                                    </ScaleOnHover>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <FormFieldAnimation delay={0.3}>
                                            <FormField
                                                control={form.control}
                                                name="customerId"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="flex items-center gap-1">
                                                            <User className="h-4 w-4" />
                                                            Customer *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Combobox
                                                                options={customers.map(c => ({
                                                                    label: `${c.name} - ${c.phone}`,
                                                                    value: c._id
                                                                }))}
                                                                value={field.value}
                                                                onValueChange={field.onChange}
                                                                placeholder="Select a customer"
                                                                searchPlaceholder="Search customer..."
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormFieldAnimation>

                                        <FormFieldAnimation delay={0.4}>
                                            <FormField
                                                control={form.control}
                                                name="paymentMethod"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-1">
                                                            <CreditCard className="h-4 w-4" />
                                                            Payment Method *
                                                        </FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="transition-all duration-300 focus:scale-105">
                                                                    <SelectValue placeholder="Select payment method" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="cash">Cash</SelectItem>
                                                                <SelectItem value="credit">Credit</SelectItem>
                                                                <SelectItem value="card">Card</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </FormFieldAnimation>
                                    </div>

                                    <FormFieldAnimation delay={0.5}>
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-1">
                                                        <FileText className="h-4 w-4" />
                                                        Notes
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Additional notes about this sale..."
                                                            {...field}
                                                            className="transition-all duration-300 focus:scale-105"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </FormFieldAnimation>
                                </CardContent>
                            </Card>
                        </SlideIn>

                        {/* Products */}
                        <SlideIn direction="up" delay={0.3}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5" />
                                            <span>Products</span>
                                        </div>

                                    </CardTitle>
                                    <CardDescription>
                                        Add products to this sale transaction
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4 sm:p-6">
                                    {fields.map((field, index) => {
                                        const selectedProduct = products.find(
                                            p => p._id === form.watch(`products.${index}.productId`)
                                        );

                                        return (
                                            <div key={field.id} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 items-end p-3 sm:p-4 border rounded-lg relative group transition-all duration-300 hover:shadow-md bg-card/50">
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.productId`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col lg:col-span-3 min-w-0">
                                                            <FormLabel className="flex items-center gap-1">
                                                                <Package className="h-4 w-4" />
                                                                Product *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Combobox
                                                                    options={products.map(p => ({
                                                                        label: `${p.name} - Stock: ${p.stock}`,
                                                                        value: p._id
                                                                    }))}
                                                                    value={field.value}
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value);
                                                                        handleProductChange(index, value);
                                                                    }}
                                                                    placeholder="Select product"
                                                                    searchPlaceholder="Search product..."
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.unitType`}
                                                    render={({ field }) => (
                                                        <FormItem className="lg:col-span-1">
                                                            <FormLabel>Type *</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                                                                        <SelectValue placeholder="Select type" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="case">Case</SelectItem>
                                                                    <SelectItem value="single">Single</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem className="lg:col-span-1">
                                                            <FormLabel>Quantity *</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    max={selectedProduct?.stock || 999}
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.incPrice`}
                                                    render={({ field }) => (
                                                        <FormItem className="lg:col-span-2">
                                                            <FormLabel>Inc. Price</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        field.onChange(val);
                                                                        onIncPriceChange(index, val);
                                                                    }}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.price`}
                                                    render={({ field }) => (
                                                        <FormItem className="lg:col-span-2">
                                                            <FormLabel>Price *</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        field.onChange(val);
                                                                        onPriceChange(index, val);
                                                                    }}
                                                                    className="transition-all duration-300 focus:scale-105"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="space-y-2 lg:col-span-2">
                                                    <Label>Total</Label>
                                                    <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted font-medium overflow-hidden truncate">
                                                        RS {Number(form.watch(`products.${index}.quantity`) * form.watch(`products.${index}.price`)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end lg:col-span-1">
                                                    <ScaleOnHover>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length === 1}
                                                            className="h-10 w-10 transition-all duration-300"
                                                            title="Remove Product"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </ScaleOnHover>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Stock warning */}
                                    {fields.some((_, index) => {
                                        const productId = form.watch(`products.${index}.productId`);
                                        const quantity = form.watch(`products.${index}.quantity`);
                                        const product = products.find(p => p._id === productId);
                                        return product && quantity > product.stock;
                                    }) && (
                                            <FadeIn>
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        Some products have insufficient stock. Please check the quantities.
                                                    </AlertDescription>
                                                </Alert>
                                            </FadeIn>
                                        )}

                                    <div className="flex justify-center sm:justify-end">
                                        <ScaleOnHover className="w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => append({ productId: '', quantity: 1, price: 0, incPrice: 0, unitType: 'case' })}
                                                className="w-full sm:w-auto border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Another Product
                                            </Button>
                                        </ScaleOnHover>
                                    </div>

                                    {/* Total Amount Section */}
                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Subtotal:</span>
                                            <span>RS {Number(calculateAmounts().subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>SGST:</span>
                                            <span>RS {Number(calculateAmounts().sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>CGST:</span>
                                            <span>RS {Number(calculateAmounts().cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-t border-dashed">
                                            <span className="font-medium text-blue-600">Original Amount:</span>
                                            <span className="font-bold text-blue-600">RS {Number(calculateAmounts().originalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        {/* Discount Input Field */}
                                        <div className="flex justify-between items-center py-2 border-y border-dashed bg-muted/40 px-2 rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm sm:text-base">Discount Amount (-):</span>
                                            </div>
                                            <div className="w-24 sm:w-32">
                                                <FormField
                                                    control={form.control}
                                                    name="discount"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0 text-right">
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                                    className="text-right h-9 transition-all duration-300 focus:ring-2 focus:ring-primary/50 bg-background"
                                                                    placeholder="0.00"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Initial Payment Field */}
                                        <div className="flex justify-between items-center py-2 border-b border-dashed bg-green-500/10 px-2 rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm sm:text-base text-green-700 dark:text-green-400">Initial Payment:</span>
                                            </div>
                                            <div className="w-24 sm:w-32">
                                                <FormField
                                                    control={form.control}
                                                    name="initialPayment"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-0 text-right">
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                                    className="text-right h-9 transition-all duration-300 focus:ring-2 focus:ring-green-500/50 bg-background border-green-500/30"
                                                                    placeholder="0.00"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="text-base sm:text-lg font-bold">Total Amount (Payable):</span>
                                            <span className="text-2xl sm:text-3xl font-bold text-green-600">
                                                RS {Number(calculateAmounts().total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </SlideIn>

                        {/* Submit Button */}
                        <FadeIn delay={0.4}>
                            <div className="flex justify-end gap-4">
                                <ScaleOnHover>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        className="w-32"
                                    >
                                        Cancel
                                    </Button>
                                </ScaleOnHover>
                                <ScaleOnHover>
                                    <Button type="submit" disabled={loading} className="w-48">
                                        {loading ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Recording Sale...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Record Sale
                                            </>
                                        )}
                                    </Button>
                                </ScaleOnHover>
                            </div>
                        </FadeIn>
                    </form>
                </Form>
            </div>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Sale Payment</DialogTitle>
                        <DialogDescription>
                            Please select the payment status for this sale.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 py-4">
                        <Button
                            className="bg-green-600 hover:bg-green-700 h-12 sm:h-auto order-1 sm:order-none"
                            onClick={() => processSale('completed')}
                        >
                            Payment Completed
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-12 sm:h-auto order-2 sm:order-none"
                            onClick={() => processSale('pending')}
                        >
                            Payment Pending
                        </Button>
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <Button type="button" variant="secondary" onClick={() => setIsConfirmOpen(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
