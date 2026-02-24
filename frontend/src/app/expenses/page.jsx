'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { Plus, Search, Filter, Calendar, IndianRupee, Trash2, Info, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const expenseSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    amount: z.number().min(0, 'Amount must be positive'),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().optional(),
    denominations: z.object({
        '500': z.number().default(0).optional(),
        '200': z.number().default(0).optional(),
        '100': z.number().default(0).optional(),
        '50': z.number().default(0).optional(),
        '20': z.number().default(0).optional(),
        '10': z.number().default(0).optional(),
        '1': z.number().default(0).optional(),
    }).optional()
});

const denominations = ['500', '200', '100', '50', '20', '10', '1'];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({
        title: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            title: '',
            amount: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: '',
            denominations: {
                '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '1': 0
            }
        }
    });

    const today = new Date();
    const formatDateToInternal = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const [expenseDate, setExpenseDate] = useState(formatDateToInternal(today));

    useEffect(() => {
        setValue('date', expenseDate);
    }, [expenseDate, setValue]);

    const today2 = new Date();
    const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const monthOptions = [
        { value: '01', label: '01 - Jan' }, { value: '02', label: '02 - Feb' },
        { value: '03', label: '03 - Mar' }, { value: '04', label: '04 - Apr' },
        { value: '05', label: '05 - May' }, { value: '06', label: '06 - Jun' },
        { value: '07', label: '07 - Jul' }, { value: '08', label: '08 - Aug' },
        { value: '09', label: '09 - Sep' }, { value: '10', label: '10 - Oct' },
        { value: '11', label: '11 - Nov' }, { value: '12', label: '12 - Dec' },
    ];
    const yearOptions = Array.from({ length: 10 }, (_, i) => (2024 + i).toString());

    useEffect(() => {
        loadExpenses();
    }, [filters]);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const response = await api.getExpenses(filters);
            if (response.success) {
                setExpenses(response.data.expenses);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load expenses:', error);
            setError('Failed to load expenses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        try {
            const response = await api.createExpense(data);
            if (response.success) {
                setSuccess('Expense recorded successfully');
                setIsAddDialogOpen(false);
                reset();
                loadExpenses();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Failed to record expense:', error);
            setError(error.response?.data?.message || 'Failed to record expense');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        setError('');
        try {
            const response = await api.deleteExpense(id);
            if (response.success) {
                setSuccess('Expense deleted successfully');
                loadExpenses();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Failed to delete expense:', error);
            setError('Failed to delete expense');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount).replace('₹', 'RS ');
    };

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Expenses</h1>
                            <p className="text-muted-foreground">Manage and track your business expenditures</p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Expense
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Add New Expense</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details below to record a new expense.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                                            <Input
                                                id="title"
                                                placeholder="e.g., Petrol, Rent, Tea"
                                                className="h-11 shadow-sm focus:ring-2 focus:ring-primary/20"
                                                {...register('title', { required: true })}
                                            />
                                            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold">Date <span className="text-[10px] font-normal text-muted-foreground">(dd/mm/yyyy)</span></Label>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="DD/MM/YYYY"
                                                    value={expenseDate ? expenseDate.split('-').reverse().join('/') : ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const parts = val.split('/');
                                                        if (parts.length === 3) {
                                                            const [d, m, y] = parts;
                                                            if (y.length === 4) {
                                                                setExpenseDate(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                                                            }
                                                        }
                                                    }}
                                                    className="h-11 pr-10 shadow-sm border-muted-foreground/20 rounded-lg"
                                                />
                                                <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center pointer-events-none">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <input
                                                    type="date"
                                                    value={expenseDate || ''}
                                                    onChange={(e) => setExpenseDate(e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee className="h-4 w-4 text-primary" />
                                            <Label className="text-base font-bold">Cash Denominations</Label>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border rounded-xl bg-muted/30">
                                            {denominations.map((denom) => (
                                                <div key={denom} className="space-y-1.5">
                                                    <Label htmlFor={`denom-${denom}`} className="text-[11px] font-bold uppercase text-muted-foreground">
                                                        {denom === '1' ? 'Ones (₹1)' : `₹${denom}`}
                                                    </Label>
                                                    <Input
                                                        id={`denom-${denom}`}
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-10 text-center bg-background border-muted-foreground/20"
                                                        {...register(`denominations.${denom}`, {
                                                            valueAsNumber: true,
                                                            setValueAs: v => v === "" ? 0 : Number(v)
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="amount" className="text-sm font-semibold">Total Amount (RS)</Label>
                                            <div className="relative group">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold z-10">₹</span>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    className="h-12 pl-8 shadow-sm focus:ring-2 focus:ring-primary/20 border-muted-foreground/20 rounded-lg group-hover:border-primary/50 transition-all duration-300"
                                                    placeholder="0.00"
                                                    {...register('amount', { valueAsNumber: true })}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic mt-1 font-medium">Enter the total expense amount manually</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="text-sm font-semibold">Notes (Optional)</Label>
                                            <Input
                                                id="notes"
                                                placeholder="Additional details..."
                                                className="h-12 shadow-sm focus:ring-2 focus:ring-primary/20 border-muted-foreground/20 rounded-lg group-hover:border-primary/50 transition-all duration-300"
                                                {...register('notes')}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">Record Expense</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="filter-title">Search Title</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="filter-title"
                                            name="title"
                                            placeholder="Search by title..."
                                            className="pl-9"
                                            value={filters.title}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="filter-startDate">From Date <span className="text-[10px] text-muted-foreground font-normal">(dd/mm/yyyy)</span></Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="DD/MM/YYYY"
                                            value={filters.startDate ? filters.startDate.split('-').reverse().join('/') : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const parts = val.split('/');
                                                if (parts.length === 3) {
                                                    const [d, m, y] = parts;
                                                    if (y.length === 4) {
                                                        setFilters(prev => ({ ...prev, startDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, page: 1 }));
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
                                            value={filters.startDate || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="filter-endDate">To Date <span className="text-[10px] text-muted-foreground font-normal">(dd/mm/yyyy)</span></Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="DD/MM/YYYY"
                                            value={filters.endDate ? filters.endDate.split('-').reverse().join('/') : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const parts = val.split('/');
                                                if (parts.length === 3) {
                                                    const [d, m, y] = parts;
                                                    if (y.length === 4) {
                                                        setFilters(prev => ({ ...prev, endDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, page: 1 }));
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
                                            value={filters.endDate || ''}
                                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setFilters({ title: '', startDate: '', endDate: '', page: 1, limit: 10 })}
                                    >
                                        Reset Filters
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expenses Table */}
                    <Card>
                        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Expense History</CardTitle>
                                <CardDescription>A list of all your recorded expenses</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">Total Expenses</p>
                                <p className="text-2xl font-bold text-primary">
                                    {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Denominations</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    No expenses found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            expenses.map((expense) => (
                                                <TableRow key={expense._id}>
                                                    <TableCell className="font-medium">
                                                        {format(new Date(expense.date), 'dd-MM-yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-semibold">{expense.title}</p>
                                                            {expense.notes && <p className="text-xs text-muted-foreground">{expense.notes}</p>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-red-500">
                                                        {formatCurrency(expense.amount)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                                    <Info className="mr-1 h-3 w-3" />
                                                                    View
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Denomination Breakdown</DialogTitle>
                                                                    <DialogDescription>
                                                                        Cash breakdown for "{expense.title}"
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                                    {Object.entries(expense.denominations || {})
                                                                        .filter(([_, count]) => count > 0)
                                                                        .map(([denom, count]) => (
                                                                            <div key={denom} className="flex justify-between p-2 rounded bg-muted/50">
                                                                                <span className="font-medium">₹{denom} x {count}</span>
                                                                                <span className="text-muted-foreground">₹{Number(denom) * count}</span>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t flex justify-between font-bold">
                                                                    <span>Total</span>
                                                                    <span>{formatCurrency(expense.amount)}</span>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(expense._id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {expenses.length} of {pagination.total} expenses
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.current === 1}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.current === pagination.pages}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
