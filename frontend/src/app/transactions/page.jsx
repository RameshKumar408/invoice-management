'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus,
    Search,
    Filter,
    ArrowUpDown,
    Eye,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Printer
} from 'lucide-react';
import { api } from '@/lib/api';
import { useReactToPrint } from 'react-to-print';
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

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [printFilter, setPrintFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [transactionToPrint, setTransactionToPrint] = useState(null);
    const tableRef = useRef(null);
    const printRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: transactionToPrint ? `Invoice-${transactionToPrint.invoiceNumber || transactionToPrint._id}` : 'Invoice',
        onAfterPrint: async () => {
            if (transactionToPrint && !transactionToPrint.isPrinted) {
                try {
                    const response = await api.updateTransactionPrintStatus(transactionToPrint._id, true);
                    if (response.success) {
                        setTransactions(prev => prev.map(t =>
                            t._id === transactionToPrint._id ? { ...t, isPrinted: true } : t
                        ));
                    }
                } catch (err) {
                    console.error('Error updating print status:', err);
                }
            }
            setTransactionToPrint(null);
        }
    });

    useEffect(() => {
        if (transactionToPrint) {
            handlePrint();
        }
    }, [transactionToPrint]);

    const scrollToTable = () => {
        if (window.innerWidth < 768) {
            tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = { page, limit: 10 };

            if (typeFilter !== 'all') params.type = typeFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (printFilter !== 'all') params.isPrinted = printFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.getTransactions(params);
            if (response.success) {
                setTransactions(response.data.transactions);
                setTotalPages(response.data.pagination.pages);
            } else {
                setError('Failed to fetch transactions');
            }
        } catch (err) {
            setError('Error loading transactions');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const setQuickDate = (range) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start = new Date(today);
        let end = new Date(today);

        switch (range) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'week':
                start.setDate(today.getDate() - 7);
                break;
            case 'month':
                start.setDate(today.getDate() - 31);
                break;
            default:
                break;
        }

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        setPage(1);
    };

    const fetchSummary = async () => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.getTransactionSummary(params);
            if (response.success) {
                setSummary(response.data.summary);
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchSummary();
    }, [page, typeFilter, statusFilter, printFilter, startDate, endDate]);

    const filteredTransactions = transactions.filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        return (
            transaction.customerName?.toLowerCase().includes(searchLower) ||
            transaction.vendorName?.toLowerCase().includes(searchLower) ||
            transaction._id.toLowerCase().includes(searchLower) ||
            transaction.products.some(p => p.productName.toLowerCase().includes(searchLower))
        );
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

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">P&L Balance Sheet</h1>
                        <p className="text-muted-foreground">
                            Manage your sales and purchase transactions
                        </p>
                    </div>

                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Summary Cards */}
                {summary && (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Card
                            className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 shadow-sm cursor-pointer hover:scale-105"
                            onClick={() => {
                                setTypeFilter('sale');
                                setPage(1);
                                scrollToTable();
                            }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Sales</CardTitle>
                                <div className="p-2 bg-green-50 rounded-full">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-green-600">
                                    RS {Number(summary.sales.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-bold bg-green-50 text-green-700 border-green-200">
                                        {summary.sales.transactionCount} Orders
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 shadow-sm cursor-pointer hover:scale-105"
                            onClick={() => {
                                setTypeFilter('purchase');
                                setPage(1);
                                scrollToTable();
                            }}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Purchases</CardTitle>
                                <div className="p-2 bg-red-50 rounded-full">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black text-red-600">
                                    RS {Number(summary.purchases.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                                        {summary.purchases.transactionCount} Orders
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 shadow-sm ${summary.profitLoss >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Net Profit/Loss</CardTitle>
                                <div className={`p-2 rounded-full ${summary.profitLoss >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                    <DollarSign className={`h-5 w-5 ${summary.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-black ${summary.profitLoss >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    RS {Number(summary.profitLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Overall Performance
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg">Filters</CardTitle>
                        <div className="flex flex-wrap bg-muted p-1 rounded-lg gap-1 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-3 text-xs font-medium ${startDate === endDate && startDate === (new Date().toISOString().split('T')[0]) ? 'bg-white shadow-sm' : ''}`}
                                onClick={() => setQuickDate('today')}
                            >
                                Today
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium"
                                onClick={() => setQuickDate('yesterday')}
                            >
                                Yesterday
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium"
                                onClick={() => setQuickDate('week')}
                            >
                                Week
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium"
                                onClick={() => setQuickDate('month')}
                            >
                                Month
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium text-red-500 hover:text-red-600"
                                onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                    setTypeFilter('all');
                                    setStatusFilter('all');
                                    setPrintFilter('all');
                                    setPage(1);
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="sale">Sales</SelectItem>
                                        <SelectItem value="purchase">Purchases</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Print Status</label>
                                <Select value={printFilter} onValueChange={setPrintFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Printed</SelectItem>
                                        <SelectItem value="false">Not Printed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={startDate ? startDate.split('-').reverse().join('/') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const parts = val.split('/');
                                            if (parts.length === 3) {
                                                const [d, m, y] = parts;
                                                if (y.length === 4) {
                                                    setStartDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                                }
                                            }
                                        }}
                                        className="pr-10"
                                    />
                                    <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="date"
                                        value={startDate || ''}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setPage(1);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={endDate ? endDate.split('-').reverse().join('/') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const parts = val.split('/');
                                            if (parts.length === 3) {
                                                const [d, m, y] = parts;
                                                if (y.length === 4) {
                                                    setEndDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                                }
                                            }
                                        }}
                                        className="pr-10"
                                    />
                                    <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <input
                                        type="date"
                                        value={endDate || ''}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setPage(1);
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card ref={tableRef}>
                    <CardHeader>
                        <CardTitle> History</CardTitle>
                        <CardDescription>
                            {filteredTransactions.length} of {transactions.length} transactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading transactions...</p>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No transactions found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-md border overflow-x-auto bg-white">
                                    <Table className="min-w-[1000px]">
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold">Date</TableHead>
                                                <TableHead className="font-bold">Type</TableHead>
                                                <TableHead className="font-bold">Contact</TableHead>
                                                <TableHead className="font-bold">Products</TableHead>
                                                <TableHead className="font-bold">Amount</TableHead>
                                                <TableHead className="font-bold">Balance</TableHead>
                                                <TableHead className="font-bold">Status</TableHead>
                                                <TableHead className="font-bold">Print Status</TableHead>
                                                <TableHead className="font-bold">Payment</TableHead>
                                                <TableHead className="text-right font-bold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTransactions.map((transaction) => (
                                                <TableRow key={transaction._id}>
                                                    <TableCell>
                                                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getTypeColor(transaction.type)}>
                                                            {transaction.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.customerName || transaction.vendorName || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {transaction.products.slice(0, 2).map((product, index) => (
                                                                <div key={index} className="text-sm">
                                                                    {product.productName} (×{product.quantity})
                                                                </div>
                                                            ))}
                                                            {transaction.products.length > 2 && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    +{transaction.products.length - 2} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`font-medium ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            RS {Number(transaction.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`font-bold ${Number((transaction.totalAmount - (transaction.paidAmount || 0)).toFixed(2)) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            RS {Number(transaction.totalAmount - (transaction.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(transaction.status)}>
                                                            {transaction.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.isPrinted ? (
                                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                                Printed
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground border-slate-200">
                                                                Not Printed
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {transaction.paymentMethod}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setTransactionToPrint(transaction)}
                                                                title="Print Invoice"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={`/transactions/${transaction._id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between">
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
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Hidden printable area */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    {transactionToPrint && (
                        <Invoice
                            transaction={transactionToPrint}
                            businessDetails={BUSINESS_DETAILS}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}
