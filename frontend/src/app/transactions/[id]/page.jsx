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
    Eye,
    MessageCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Invoice } from '@/components/Invoice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const captureRef = useRef();

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
    const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
    const [customNumber, setCustomNumber] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: invoiceRef,
        documentTitle: transaction ? `Invoice-${transaction.invoiceNumber || transaction._id}` : 'Invoice',
    });

    const generatePDFBlob = async () => {
        const element = captureRef.current;
        if (!element) return null;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Use the alternative jspdf.html() method which yields much higher quality and better alignment
        await pdf.html(element, {
            x: 0,
            y: 0,
            width: pdfWidth,
            windowWidth: 816, // Approx 210mm in pixels at 96dpi
            autoPaging: 'text',
            margin: [0, 0, 0, 0]
        });

        return {
            blob: pdf.output('blob'),
            pdf
        };
    };

    const handleDownloadPDF = async () => {
        try {
            setIsGenerating(true);
            const result = await generatePDFBlob();
            if (result) {
                result.pdf.save(`Invoice-${transaction.invoiceNumber || transaction._id}.pdf`);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

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

    const handleWhatsAppShare = async (number = null, forceShare = false) => {
        const cleanNumber = number ? number.replace(/[^0-9]/g, '') : null;

        if (!forceShare && !cleanNumber) {
            alert('Please provide a valid phone number');
            return;
        }

        try {
            setIsSharing(true);
            const result = await generatePDFBlob();
            if (!result) {
                alert('Invoice not ready for sharing');
                return;
            }

            const { blob } = result;
            const fileName = `Invoice-${transaction.invoiceNumber || transaction._id}.pdf`;
            const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

            // Helper for delay
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // 1. If "Forward/Share" is clicked (Generic link to pick contact in WhatsApp)
            if (forceShare && !cleanNumber) {
                // Always download first
                const url = URL.createObjectURL(blob);
                const link = document.body.appendChild(document.createElement('a'));
                link.href = url;
                link.download = fileName;
                link.click();
                link.remove();
                URL.revokeObjectURL(url);

                const message = `*Invoice from ${BUSINESS_DETAILS.name}*\n\n` +
                    `Hello,\n` +
                    `I am sending the invoice for the transaction. I have downloaded the PDF for you. Please attach it and send it.\n\n` +
                    `*Invoice No:* ${transaction.invoiceNumber || transaction._id}\n` +
                    `*Total Amount:* RS ${Number(transaction.totalAmount).toLocaleString('en-IN')}\n`;

                // WhatsApp API link without number opens contact picker
                const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

                // Wait for 3 seconds as requested
                await wait(3000);
                window.open(waUrl, '_blank');
            }
            // 2. Direct Message to a specific number
            else if (cleanNumber) {
                // Download it first so they have it ready to attach
                const url = URL.createObjectURL(blob);
                const link = document.body.appendChild(document.createElement('a'));
                link.href = url;
                link.download = fileName;
                link.click();
                link.remove();
                URL.revokeObjectURL(url);

                const message = `*Invoice from ${BUSINESS_DETAILS.name}*\n\n` +
                    `Hello ${contact?.name || ''},\n` +
                    `I am sending the invoice for your transaction. I have downloaded the PDF for you. Please attach it and send it to this number.\n\n` +
                    `*Invoice No:* ${transaction.invoiceNumber || transaction._id}\n` +
                    `*Total Amount:* RS ${Number(transaction.totalAmount).toLocaleString('en-IN')}\n`;

                const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

                // Wait for 3 seconds as requested
                await wait(3000);
                window.open(waUrl, '_blank');
            }

            setIsWhatsAppDialogOpen(false);
            setShowCustomInput(false);
            setCustomNumber('');
        } catch (error) {
            console.error('Error sharing PDF:', error);
            alert('Failed to generate or share PDF');
        } finally {
            setIsSharing(false);
        }
    };

    const getTypeColor = (type) => {
        return type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <Button variant="outline" onClick={() => router.push('/transactions')} size="sm" className="shrink-0">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Transaction Details</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                ID: {transaction._id}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                        {transaction.status === 'pending' && (
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                                onClick={handleComplete}
                                disabled={updating}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Mark as Completed</span>
                                <span className="sm:hidden">Complete</span>
                            </Button>
                        )}

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">View Invoice</span>
                                    <span className="sm:hidden">Invoice</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] w-[220mm] max-h-[95vh] overflow-y-auto p-0">
                                <DialogHeader className="p-3 sm:p-6 pb-2 border-b">
                                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                                        <DialogTitle className="text-base sm:text-xl font-bold">Invoice Preview</DialogTitle>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button size="sm" variant="outline" onClick={handlePrint} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">
                                                <Printer className="mr-1.5 h-3.5 w-3.5" />
                                                Print
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleDownloadPDF}
                                                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90"
                                                disabled={isGenerating}
                                            >
                                                {isGenerating ? (
                                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground mr-1.5" />
                                                ) : (
                                                    <Download className="mr-1.5 h-3.5 w-3.5" />
                                                )}
                                                PDF
                                            </Button>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full sm:w-auto sm:px-6 h-9 sm:h-10 text-xs sm:text-sm text-green-600 border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center justify-center gap-1.5"
                                            onClick={() => setIsWhatsAppDialogOpen(true)}
                                            disabled={isSharing}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="font-bold">WhatsApp</span>
                                        </Button>
                                    </div>
                                </DialogHeader>
                                <div className="flex justify-center bg-gray-100 dark:bg-slate-900/50 p-1 sm:p-8 overflow-hidden min-h-[60vh]">
                                    <div className="bg-white shadow-2xl origin-top transition-transform duration-500 transform scale-[0.55] sm:scale-[0.85] md:scale-100" style={{ width: '210mm' }}>
                                        <Invoice
                                            ref={invoiceRef}
                                            transaction={transaction}
                                            businessDetails={BUSINESS_DETAILS}
                                        />
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                            <Badge className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold leading-none ${transaction.type === 'sale' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {transaction.type.toUpperCase()}
                            </Badge>
                            <Badge className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold leading-none ${getStatusColor(transaction.status)}`}>
                                {transaction.status.toUpperCase()}
                            </Badge>
                        </div>
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
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between sm:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">Date</span>
                                    </div>
                                    <span className="font-medium text-sm sm:text-base">
                                        {new Date(transaction.date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between sm:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-sm">Payment Method</span>
                                    </div>
                                    <span className="font-medium capitalize text-sm sm:text-base">{transaction.paymentMethod}</span>
                                </div>

                                <div className="flex items-center justify-between sm:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">Invoice Number</span>
                                    </div>
                                    <span className="font-medium text-sm sm:text-base">{transaction.invoiceNumber || 'N/A'}</span>
                                </div>

                                {transaction.notes && (
                                    <div className="pt-2 border-t sm:border-t-0 sm:pt-0">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm">Notes</span>
                                        </div>
                                        <p className="font-medium text-sm pl-6">{transaction.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center sm:items-end p-4 rounded-xl bg-muted/30 border border-dashed text-center sm:text-right">
                                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
                                <p className={`text-3xl sm:text-4xl font-black ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
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
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                    <h3 className="font-bold text-lg sm:text-xl">{contact.name}</h3>
                                    <div className="space-y-1.5 text-sm sm:text-base text-muted-foreground mt-2">
                                        <p className="flex items-center gap-2">
                                            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <a
                                                href={`https://wa.me/${contact.phone?.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-primary transition-colors font-medium"
                                            >
                                                {contact.phone}
                                            </a>
                                        </p>
                                        <p>{contact.email}</p>
                                        {contact.address && (
                                            <p className="text-xs sm:text-sm">
                                                {typeof contact.address === 'object'
                                                    ? [contact.address.street, contact.address.city, contact.address.state, contact.address.zipCode].filter(Boolean).join(', ')
                                                    : contact.address}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Summary Info */}
                                <div className="bg-muted/30 p-4 rounded-xl border border-dashed space-y-3">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="font-medium text-muted-foreground">Invoice Total:</span>
                                        <span className="font-bold">RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="font-medium text-muted-foreground">Total Paid:</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">RS {Number(transaction.paidAmount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-sm sm:text-base font-bold">Balance Due:</span>
                                        <span className={`text-lg sm:text-xl font-black ${Number((transaction.totalAmount - (transaction.paidAmount || 0)).toFixed(2)) === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} >
                                            RS {Number(transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('en-IN')}
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
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[150px]">Product</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Qty</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Unit Price</TableHead>
                                        <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaction.products.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="py-3">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm sm:text-base truncate">{item.productName}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{item.productId?.category || 'No Category'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize text-xs sm:text-sm">{item.unitType || 'single'}</TableCell>
                                            <TableCell className="text-right font-medium text-xs sm:text-sm">{item.quantity}</TableCell>
                                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">RS {Number(item.price || 0).toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-right font-bold whitespace-nowrap text-xs sm:text-sm">
                                                RS {Number(item.total || 0).toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Transaction Breakdown */}
                        <div className="border-t mt-4 pt-4 px-4 sm:px-0 space-y-2 pb-4 sm:pb-0">
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
                                <span className="text-sm font-medium text-muted-foreground italic">Original Total (with GST):</span>
                                <span className="text-sm font-bold text-muted-foreground">RS {Number((transaction.subtotal || 0) + (transaction.sgst || 0) + (transaction.cgst || 0)).toLocaleString('en-IN')}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium text-green-600 dark:text-green-400">
                                    <span>Discount Amount (-):</span>
                                    <span>RS {Number(transaction.discount || 0).toLocaleString('en-IN')}</span>
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
                <Card className="border-t-4 border-t-primary overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <CreditCard className="h-5 w-5" />
                            Payment Records
                        </CardTitle>
                        <CardDescription>
                            Track received payments and record new ones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Split Payment Form */}
                        {transaction.status === 'pending' && (transaction.totalAmount - (transaction.paidAmount || 0) > 0.01) && (
                            <form onSubmit={handleAddPayment} className="bg-muted/50 p-4 rounded-lg border flex flex-col sm:flex-row items-end gap-4 shadow-sm animate-in fade-in duration-500">
                                <div className="w-full flex-1 space-y-2">
                                    <label className="text-xs sm:text-sm font-bold flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground uppercase tracking-wider">Enter Payment Amount</span>
                                        <Badge variant="outline" className="font-black text-primary border-primary/20">
                                            Due: RS {Number(transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('en-IN')}
                                        </Badge>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">RS </span>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-2 bg-background border-2 border-muted rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-bold text-lg"
                                            step="0.01"
                                            min="0"
                                            max={transaction.totalAmount - (transaction.paidAmount || 0)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={addingPayment || !paymentAmount}
                                    className="w-full sm:w-auto h-12 px-8 font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                    {addingPayment ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Saving...
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
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="text-xs uppercase tracking-wider font-bold">Date</TableHead>
                                                <TableHead className="text-xs uppercase tracking-wider font-bold">Method</TableHead>
                                                <TableHead className="text-right text-xs uppercase tracking-wider font-bold">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transaction.payments.map((payment, index) => (
                                                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="font-medium text-sm">
                                                        {new Date(payment.date).toLocaleDateString('en-GB')}
                                                    </TableCell>
                                                    <TableCell className="capitalize text-xs text-muted-foreground font-medium">
                                                        {payment.method || 'cash'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-green-600 text-sm">
                                                        RS {Number(payment.amount || 0).toLocaleString('en-IN')}
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
                                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/20">
                                    <p className="text-muted-foreground italic text-sm">No payment records found.</p>
                                    {transaction.status === 'completed' && (
                                        <p className="text-xs mt-2 text-green-600 dark:text-green-400 font-bold uppercase tracking-tight">Full payment received upon creation.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* WhatsApp Number Selection Dialog */}
            <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send via WhatsApp</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col gap-4">
                            {contact?.phone && (
                                <Button
                                    className="w-full justify-start h-12 border-2"
                                    variant="outline"
                                    onClick={() => handleWhatsAppShare(contact.phone)}
                                >
                                    <MessageCircle className="mr-2 h-5 w-5 text-green-500" />
                                    <div className="text-left">
                                        <div className="font-bold">Send to {contact.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{contact.phone}</div>
                                    </div>
                                </Button>
                            )}

                            <Button
                                className="w-full justify-start h-12 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                variant="outline"
                                onClick={() => handleWhatsAppShare(null, true)}
                            >
                                <Package className="mr-2 h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <div className="font-bold">Forward / Share PDF</div>
                                    <div className="text-[10px] text-muted-foreground">Attach to any contact in WhatsApp</div>
                                </div>
                            </Button>

                            {!showCustomInput ? (
                                <Button
                                    className="w-full justify-start h-12"
                                    variant="ghost"
                                    onClick={() => setShowCustomInput(true)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Send to a different number
                                </Button>
                            ) : (
                                <div className="space-y-2 p-3 bg-muted/50 rounded-lg animate-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="custom-number" className="text-xs font-bold uppercase">Enter WhatsApp Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="custom-number"
                                            placeholder="919876543210"
                                            value={customNumber}
                                            onChange={(e) => setCustomNumber(e.target.value)}
                                            className="flex-1 font-bold"
                                        />
                                        <Button
                                            onClick={() => handleWhatsAppShare(customNumber)}
                                            disabled={!customNumber}
                                            className="font-bold"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Add country code (e.g. 91)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden High-Quality Capture Container for PDF Generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm' }}>
                <div id="capture-invoice" ref={captureRef} style={{ background: 'white' }}>
                    <Invoice
                        transaction={transaction}
                        businessDetails={BUSINESS_DETAILS}
                    />
                </div>
            </div>
        </Layout>
    );
}

