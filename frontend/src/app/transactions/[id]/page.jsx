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

    const [paymentAmount, setPaymentAmount] = useState('');
    const [addingPayment, setAddingPayment] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: transaction ? `Invoice-${transaction.invoiceNumber || transaction._id}` : 'Invoice',
    });

    const handleAddPayment = async (e) => {
        if (e) e.preventDefault();

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            setAddingPayment(true);
            const response = await api.addTransactionPayment(id, { amount });
            if (response.success) {
                setPaymentAmount('');
                await fetchTransaction();
            } else {
                alert(response.message || 'Failed to add payment');
            }
        } catch (err) {
            console.error('Error adding payment:', err);
            alert(err.response?.data?.message || 'Error adding payment');
        } finally {
            setAddingPayment(false);
        }
    };

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
                                        {new Date(transaction.date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
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
                                        RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            <div className="grid gap-6 md:grid-cols-2">
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

                                {/* Payment Summary Info */}
                                <div className="bg-muted/50 p-4 rounded-xl border space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Invoice Total:</span>
                                        <span className="font-bold">RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-muted-foreground">Total Paid:</span>
                                        <span className="font-bold text-green-600">RS {Number(transaction.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-sm font-bold">Balance Due:</span>
                                        <span className="text-lg font-black text-red-600">
                                            RS {Number(transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
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
                                        <TableCell className="text-right">RS {Number(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            RS {Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Transaction Breakdown */}
                        <div className="border-t mt-4 pt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Subtotal:</span>
                                <span>RS {Number(transaction.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>SGST :</span>
                                <span>RS {Number(transaction.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>CGST :</span>
                                <span>RS {Number(transaction.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                <span className="font-medium text-blue-600">Original Amount:</span>
                                <span className="font-bold text-blue-600">RS {Number((transaction.subtotal || 0) + (transaction.sgst || 0) + (transaction.cgst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span>Discount Amount (-):</span>
                                    <span>RS {Number(transaction.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t">
                                <span className="font-bold">Total Amount (Payable):</span>
                                <span className={`text-xl font-bold ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History & Add Payment */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <CreditCard className="h-5 w-5" />
                            Payment History & Split Payments
                        </CardTitle>
                        <CardDescription>
                            Track received payments and record new ones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Split Payment Form */}
                        {transaction.status === 'pending' && (transaction.totalAmount - (transaction.paidAmount || 0) > 0.01) && (
                            <form onSubmit={handleAddPayment} className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col md:flex-row items-end gap-4 shadow-sm animate-in fade-in duration-500">
                                <div className="flex-1 space-y-2">
                                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                        Enter Payment Amount
                                        <Badge variant="outline" className="bg-blue-100 border-blue-200">Pending: RS {Number(transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold">RS </span>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border-2 border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-lg"
                                            step="0.01"
                                            min="0"
                                            max={transaction.totalAmount - (transaction.paidAmount || 0)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={addingPayment || !paymentAmount}
                                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                    {addingPayment ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Processing...
                                        </div>
                                    ) : (
                                        'Record Payment'
                                    )}
                                </Button>
                            </form>
                        )}

                        {/* Payments List */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Payment Records</h3>
                            {transaction.payments && transaction.payments.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transaction.payments.map((payment, index) => (
                                                <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                                                    <TableCell className="font-medium">
                                                        {new Date(payment.date).toLocaleDateString('en-GB')}
                                                    </TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">
                                                        {payment.method || 'cash'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        RS {Number(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Initial payment if transaction was completed immediately */}
                                            {transaction.payments.length === 0 && transaction.status === 'completed' && (
                                                <TableRow>
                                                    <TableCell className="font-medium">
                                                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                                                    </TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">
                                                        {transaction.paymentMethod}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                                    <p className="text-muted-foreground italic">No payment records found.</p>
                                    {transaction.status === 'completed' && (
                                        <p className="text-xs mt-1 text-green-600 font-medium">This transaction was paid in full upon creation.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
