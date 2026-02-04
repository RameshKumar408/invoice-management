'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useReactToPrint } from 'react-to-print';
import {
    ArrowLeft,
    Receipt,
    User,
    Calendar,
    CreditCard,
    Package,
    FileText,
    CheckCircle,
    Printer,
    Download,
    Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import { Invoice } from '@/components/Invoice';

const BUSINESS_DETAILS = {
    name: 'SIVA LAKSHMI TRADERS',
    address: '11/10, Pandeeswara nagar, Pannaimara stop, THIRUMANGALAM, MDU-625706.',
    phone: '8072651414 , 8939992847',
    gstin: '33DCFPA7258Q1Z7',
    bank: {
        name: 'BANK OF BARODA',
        accountNo: '59440200000183',
        ifsc: 'IDIB000T145'
    }
};

export default function TransactionDetailPage({ params }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const invoiceRef = useRef();

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    const fetchTransaction = async () => {
        try {
            setLoading(true);
            const response = await api.getTransaction(id);

            if (response.success) {
                setTransaction(response.data.transaction);
            } else {
                setError('Transaction not found');
            }
        } catch (err) {
            console.error('Error fetching transaction:', err);
            setError('Error loading transaction details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchTransaction();
        }
    }, [id]);

    const handleComplete = async () => {
        try {
            setUpdating(true);
            const response = await api.updateTransactionStatus(id, 'completed');
            if (response.success) {
                await fetchTransaction();
            } else {
                alert(response.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error updating transaction status');
        } finally {
            setUpdating(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: transaction ? `Invoice-${transaction.invoiceNumber || transaction._id}` : 'Invoice',
    });

    const getTypeColor = (type) => {
        return type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading transaction details...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !transaction) {
        return (
            <Layout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => router.push('/transactions')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Transactions
                        </Button>
                    </div>
                    <Alert variant="destructive">
                        <AlertDescription>{error || 'Transaction not found'}</AlertDescription>
                    </Alert>
                </div>
            </Layout>
        );
    }

    const contact = transaction.customerId || transaction.vendorId;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => router.push('/transactions')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Transaction Details</h1>
                            <p className="text-muted-foreground">
                                Transaction ID: {transaction._id}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {transaction.status === 'pending' && (
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                                onClick={handleComplete}
                                disabled={updating}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Completed
                            </Button>
                        )}

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Invoice
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] w-[220mm] max-h-[95vh] overflow-y-auto p-0">
                                <DialogHeader className="p-6 pb-4">
                                    <DialogTitle className="flex items-center justify-between mr-8">
                                        <span>Invoice Preview</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handlePrint}>
                                                <Printer className="mr-2 h-4 w-4" />
                                                Print
                                            </Button>
                                            <Button size="sm" onClick={handlePrint}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Download PDF
                                            </Button>
                                        </div>
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-center bg-gray-100 p-4">
                                    <Invoice
                                        ref={invoiceRef}
                                        transaction={transaction}
                                        businessDetails={BUSINESS_DETAILS}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Badge className={`px-3 py-1 text-sm ${getTypeColor(transaction.type)}`}>
                            {transaction.type.toUpperCase()}
                        </Badge>
                        <Badge className={`px-3 py-1 text-sm ${getStatusColor(transaction.status)}`}>
                            {transaction.status.toUpperCase()}
                        </Badge>
                    </div>
                </div>

                {/* Transaction Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Transaction Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Date:</span>
                                    <span className="font-medium">
                                        {new Date(transaction.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Payment Method:</span>
                                    <span className="font-medium capitalize">{transaction.paymentMethod}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Invoice Number</span>
                                    <span className="font-medium capitalize">{transaction.invoiceNumber}</span>
                                </div>

                                {transaction.notes && (
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Notes:</span>
                                            <p className="font-medium text-sm mt-1">{transaction.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className={`text-3xl font-bold ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ₹{transaction.totalAmount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                {contact && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {transaction.type === 'sale' ? 'Customer' : 'Vendor'} Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="font-semibold text-lg">{contact.name}</h3>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>{contact.phone}</p>
                                        <p>{contact.email}</p>
                                        {contact.address && (
                                            <p>
                                                {typeof contact.address === 'object'
                                                    ? [contact.address.street, contact.address.city, contact.address.state, contact.address.zipCode].filter(Boolean).join(', ')
                                                    : contact.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Product Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Products ({transaction.products.length})
                        </CardTitle>
                        <CardDescription>
                            Items included in this transaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transaction.products.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{item.productName}</p>
                                                {item.productId && (
                                                    <p className="text-sm text-muted-foreground">
                                                        ID: {item.productId._id}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{item.unitType || 'single'}</TableCell>
                                        <TableCell>{item.productId?.category || 'N/A'}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            ₹{item.total.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Transaction Breakdown */}
                        <div className="border-t mt-4 pt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Subtotal:</span>
                                <span>₹{(transaction.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>SGST (2.5%):</span>
                                <span>₹{(transaction.sgst || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>CGST (2.5%):</span>
                                <span>₹{(transaction.cgst || 0).toFixed(2)}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span>Discount:</span>
                                    <span>-₹{(transaction.discount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="font-bold">Total Amount:</span>
                                <span className={`text-xl font-bold ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    ₹{transaction.totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
