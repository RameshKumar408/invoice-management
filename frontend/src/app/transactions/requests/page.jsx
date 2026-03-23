'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Eye, 
    Edit, 
    Check, 
    X,
    User,
    Calendar,
    ShoppingCart,
    Loader2,
    AlertCircle,
    FileText
} from 'lucide-react';
import { FadeIn, SlideIn, ScaleOnHover, StaggerContainer, StaggerItem } from '@/components/animations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign } from 'lucide-react';

export default function SalesRequestsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvePaidAmount, setApprovePaidAmount] = useState(0);
    const [approvePaymentMethod, setApprovePaymentMethod] = useState('cash');

    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.getSalesRequests({ 
                salesmanId: user?.role === 'salesman' ? user._id : undefined 
            });
            if (response.success) {
                setRequests(response.data.requests);
            }
        } catch (err) {
            console.error('Error fetching sales requests:', err);
            setError('Failed to load sales requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const handleApprove = (request) => {
        setSelectedRequest(request);
        setApprovePaidAmount(request.totalAmount);
        setApprovePaymentMethod(request.paymentMethod || 'cash');
        setIsApproveDialogOpen(true);
    };

    const confirmApproval = async () => {
        if (!selectedRequest) return;
        
        try {
            setActionLoading(selectedRequest._id);
            setIsApproveDialogOpen(false);
            
            const response = await api.approveSalesRequest(selectedRequest._id, {
                paidAmount: approvePaidAmount,
                paymentMethod: approvePaymentMethod
            });
            
            if (response.success) {
                fetchRequests();
                alert('Sales request approved and converted to invoice!');
            } else {
                alert(response.message || 'Approval failed');
            }
        } catch (err) {
            console.error('Approval error:', err);
            alert(err.response?.data?.message || 'Error approving request');
        } finally {
            setActionLoading(null);
            setSelectedRequest(null);
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject this sales request?')) return;
        
        try {
            setActionLoading(id);
            const response = await api.rejectSalesRequest(id);
            if (response.success) {
                fetchRequests();
            }
        } catch (err) {
            console.error('Rejection error:', err);
            alert(err.response?.data?.message || 'Error rejecting request');
        } finally {
            setActionLoading(null);
        }
    };

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

    return (
        <ProtectedRoute roles={['admin', 'staff', 'salesman']}>
            <Layout>
                <div className="space-y-6">
                    <FadeIn delay={0.1}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Sales Requests</h1>
                                <p className="text-muted-foreground">
                                    {isAdminOrStaff 
                                        ? "Review and approve sales submitted by salesmen" 
                                        : "Track the status of your submitted sales requests"}
                                </p>
                            </div>
                            {user?.role === 'salesman' && (
                                <ScaleOnHover>
                                    <Button onClick={() => router.push('/transactions/sale')} className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                                        <ShoppingCart className="h-4 w-4" />
                                        New Request
                                    </Button>
                                </ScaleOnHover>
                            )}
                        </div>
                    </FadeIn>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                            <p className="text-muted-foreground animate-pulse">Loading requests...</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <Card className="border-dashed py-20">
                            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="p-4 rounded-full bg-muted">
                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-semibold">No sales requests found</h2>
                                    <p className="text-muted-foreground">When salesmen submit orders, they will appear here.</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <StaggerContainer className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                            {requests.map((request) => (
                                <StaggerItem key={request._id}>
                                    <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300">
                                        <CardHeader className="bg-muted/30 pb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <User className="h-4 w-4 text-primary" />
                                                        {request.customerName}
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-2">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(request.date).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
                                                <div className="space-y-1">
                                                    {request.products.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="truncate max-w-[200px]">{item.productName} x {item.quantity}</span>
                                                            <span className="font-medium text-primary">₹{item.total.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                    {request.products.length > 3 && (
                                                        <p className="text-xs text-muted-foreground italic">+ {request.products.length - 3} more items</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t font-semibold">
                                                <span className="text-sm">Total Amount</span>
                                                <span className="text-lg text-primary">₹{request.totalAmount.toLocaleString()}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 italic">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {request.salesmanName?.[0]}
                                                </div>
                                                Submitted by {request.salesmanName}
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => router.push(`/transactions/requests/${request._id}`)}>
                                                    <Eye className="h-3.5 w-3.5" /> Details
                                                </Button>
                                                
                                                {request.status === 'pending' && isAdminOrStaff && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                                                            disabled={actionLoading === request._id}
                                                            onClick={() => handleApprove(request)}
                                                        >
                                                            {actionLoading === request._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                                            Approve
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive" 
                                                            className="h-8 gap-1"
                                                            disabled={actionLoading === request._id}
                                                            onClick={() => handleReject(request._id)}
                                                        >
                                                            <X className="h-3.5 w-3.5" /> Reject
                                                        </Button>
                                                    </>
                                                )}

                                                {request.status === 'pending' && isAdminOrStaff && (
                                                     <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 gap-1"
                                                        onClick={() => router.push(`/transactions/requests/${request._id}/edit`)}
                                                     >
                                                        <Edit className="h-3.5 w-3.5" /> Edit
                                                     </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </StaggerContainer>
                    )}
                </div>

                {/* Approval Dialog */}
                <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Approve Sales Request
                            </DialogTitle>
                            <DialogDescription>
                                Specify payment details to convert this to an invoice.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Order Total</Label>
                                <div className="text-2xl font-bold text-primary">₹{selectedRequest?.totalAmount.toLocaleString()}</div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="paidAmount" className="text-right text-xs">Paid Amt</Label>
                                <Input
                                    id="paidAmount"
                                    type="number"
                                    value={approvePaidAmount}
                                    onChange={(e) => setApprovePaidAmount(Number(e.target.value))}
                                    className="col-span-3 h-8"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="method" className="text-right text-xs">Method</Label>
                                <Select value={approvePaymentMethod} onValueChange={setApprovePaymentMethod}>
                                    <SelectTrigger className="col-span-3 h-8">
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit">Credit / None</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {approvePaidAmount < (selectedRequest?.totalAmount || 0) && (
                                <div className="bg-amber-50 border border-amber-200 p-2 rounded text-[10px] text-amber-800 animate-in fade-in duration-300">
                                    <strong>Partial Payment:</strong> Invoice will be marked as "Pending" (Balance: ₹{(selectedRequest.totalAmount - approvePaidAmount).toLocaleString()}).
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">Confirm Approval</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Layout>
        </ProtectedRoute>
    );
}
