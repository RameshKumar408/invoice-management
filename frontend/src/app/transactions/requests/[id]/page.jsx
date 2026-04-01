'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, 
    Calendar, 
    User, 
    Package, 
    ShoppingCart, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    FileText,
    CreditCard,
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { FadeIn, SlideIn, ScaleOnHover } from '@/components/animations';

export default function SalesRequestDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                setLoading(true);
                const response = await api.getSalesRequests();
                const found = response.data.requests.find(r => r._id === id);
                if (found) {
                    setRequest(found);
                } else {
                    setError('Sales request not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load request details');
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching details...</p>
                </div>
            </Layout>
        );
    }

    if (error || !request) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto py-10 text-center space-y-4">
                    <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-100 shadow-sm inline-block">
                        <XCircle className="h-10 w-10 mx-auto mb-2" />
                        <h2 className="text-xl font-bold">{error || 'Something went wrong'}</h2>
                    </div>
                    <Button variant="outline" onClick={() => router.back()} className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Requests
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <ProtectedRoute>
            <Layout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <ScaleOnHover>
                                <Button variant="outline" size="sm" onClick={() => router.back()}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                            </ScaleOnHover>
                            <h1 className="text-2xl font-bold tracking-tight">Sales Request Details</h1>
                        </div>
                        {getStatusBadge(request.status)}
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Info Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-2">
                                <CardHeader className="bg-muted/30">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/20">
                                                <tr className="border-b text-left">
                                                    <th className="p-4 font-semibold">Product</th>
                                                    <th className="p-4 font-semibold text-center">Qty</th>
                                                    <th className="p-4 font-semibold text-right">Price</th>
                                                    <th className="p-4 font-semibold text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {request.products.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-medium text-primary">{item.productName}</div>
                                                        </td>
                                                        <td className="p-4 text-center">{item.quantity}</td>
                                                        <td className="p-4 text-right">₹{item.price.toLocaleString()}</td>
                                                        <td className="p-4 text-right font-medium">₹{item.total.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="p-6 space-y-3 bg-muted/5 border-t">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span>₹{request.subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Tax (GST)</span>
                                            <span>₹{(request.sgst + request.cgst).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Discount</span>
                                            <span className="text-red-500">- ₹{(request.discount || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t text-lg font-bold">
                                            <span>Grand Total</span>
                                            <span className="text-green-600 text-2xl font-black">₹{request.totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {request.notes && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-md flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic border-l-4 pl-4 py-2 bg-muted/20">
                                            {request.notes}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Customer & Tracking Column */}
                        <div className="space-y-6">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Customer Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-primary mt-1" />
                                        <div>
                                            <p className="font-bold text-lg">{request.customerName}</p>
                                            <p className="text-xs text-muted-foreground italic">Customer ID: {request._id.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Payment: {request.paymentMethod.toUpperCase()}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/10">
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Submitted By</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {request.salesmanName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-md">{request.salesmanName}</p>
                                            <p className="text-xs text-muted-foreground">Salesman</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm pt-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-muted-foreground font-medium">{new Date(request.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
