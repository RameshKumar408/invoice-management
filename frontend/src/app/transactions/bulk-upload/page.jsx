'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft,
    Download,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    Info
} from 'lucide-react';
import { api } from '@/lib/api';

// Sample data to populate the downloadable template
const SAMPLE_ROWS = [
    {
        'Date': '24/02/2026',
        'Customer Name': 'John Doe',
        'Product Name': 'Product A',
        'Quantity': 5,
        'Unit Type': 'case',
        'Inc. Price': 118,
        'Payment Method': 'cash',
        'Discount': 0,
        'Notes': 'Sample sale entry',
        'Status': 'completed'
    },
    {
        'Date': '24/02/2026',
        'Customer Name': 'Jane Smith',
        'Product Name': 'Product B',
        'Quantity': 2,
        'Unit Type': 'single',
        'Inc. Price': 59,
        'Payment Method': 'credit',
        'Discount': 10,
        'Notes': '',
        'Status': 'pending'
    }
];

const COLUMN_DESCRIPTIONS = [
    { col: 'Date', format: 'DD/MM/YYYY', required: true, example: '24/02/2026' },
    { col: 'Customer Name', format: 'Exact name as in system', required: true, example: 'John Doe' },
    { col: 'Product Name', format: 'Exact name as in system', required: true, example: 'Product A' },
    { col: 'Quantity', format: 'Number > 0', required: true, example: '5' },
    { col: 'Unit Type', format: 'case / single', required: false, example: 'case' },
    { col: 'Inc. Price', format: 'Inclusive price (with tax)', required: false, example: '118' },
    { col: 'Payment Method', format: 'cash / credit / card', required: false, example: 'cash' },
    { col: 'Discount', format: 'Flat discount amount', required: false, example: '0' },
    { col: 'Notes', format: 'Any text', required: false, example: 'Sample note' },
    { col: 'Status', format: 'completed / pending / cancelled', required: false, example: 'completed' },
];

export default function BulkSaleUploadPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    // Download sample Excel template
    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);

        // Set column widths
        ws['!cols'] = [
            { wch: 14 }, // Date
            { wch: 22 }, // Customer Name
            { wch: 22 }, // Product Name
            { wch: 10 }, // Quantity
            { wch: 12 }, // Unit Type
            { wch: 12 }, // Inc. Price
            { wch: 16 }, // Payment Method
            { wch: 10 }, // Discount
            { wch: 24 }, // Notes
            { wch: 14 }, // Status
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales');
        XLSX.writeFile(wb, 'bulk_sale_template.xlsx');
    };

    // Handle file selection & preview
    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        setFile(selected);
        setResults(null);
        setError('');

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                setPreviewData(rows.slice(0, 5)); // Preview first 5 rows
            } catch {
                setError('Failed to read Excel file. Please use the template format.');
            }
        };
        reader.readAsArrayBuffer(selected);
    };

    // Upload to server
    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError('');
        setResults(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.bulkSaleUpload(formData);
            setResults(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setPreviewData([]);
        setResults(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()} size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Bulk Sale Upload</h1>
                        <p className="text-sm text-muted-foreground">
                            Download the template, fill in your sales data, then upload to import all at once
                        </p>
                    </div>
                </div>

                {/* Step 1 — Download Template */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">1</div>
                            <div>
                                <CardTitle className="text-base">Download Sample Template</CardTitle>
                                <CardDescription>Get the Excel template with correct column headers and sample data</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={downloadTemplate} className="gap-2" variant="outline">
                            <Download className="h-4 w-4" />
                            Download Template (bulk_sale_template.xlsx)
                        </Button>

                        {/* Column guide */}
                        <div className="rounded-lg border overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">Column Reference Guide</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/20">
                                            <th className="text-left px-3 py-2 font-semibold">Column</th>
                                            <th className="text-left px-3 py-2 font-semibold">Format</th>
                                            <th className="text-left px-3 py-2 font-semibold">Required</th>
                                            <th className="text-left px-3 py-2 font-semibold">Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COLUMN_DESCRIPTIONS.map((c) => (
                                            <tr key={c.col} className="border-b last:border-0">
                                                <td className="px-3 py-2 font-mono font-medium">{c.col}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{c.format}</td>
                                                <td className="px-3 py-2">
                                                    {c.required
                                                        ? <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200" variant="outline">Required</Badge>
                                                        : <Badge className="text-[10px] bg-gray-100 text-gray-600" variant="outline">Optional</Badge>
                                                    }
                                                </td>
                                                <td className="px-3 py-2 font-mono text-blue-600">{c.example}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2 — Select File */}
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">2</div>
                            <div>
                                <CardTitle className="text-base">Select Your Filled Excel File</CardTitle>
                                <CardDescription>Upload the completed template (.xlsx or .xls)</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Drop zone */}
                        <div
                            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all duration-300"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            {file ? (
                                <div>
                                    <p className="font-semibold text-green-600">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(file.size / 1024).toFixed(1)} KB — click to change
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium">Click to select your Excel file</p>
                                    <p className="text-xs text-muted-foreground mt-1">Supports .xlsx and .xls formats, max 5 MB</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Preview table */}
                        {previewData.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2 text-muted-foreground">
                                    Preview (first {previewData.length} rows):
                                </p>
                                <div className="rounded-lg border overflow-x-auto">
                                    <Table className="text-xs min-w-[800px]">
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                {Object.keys(previewData[0]).map(k => (
                                                    <TableHead key={k} className="font-bold py-2 px-3">{k}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map((row, i) => (
                                                <TableRow key={i}>
                                                    {Object.values(row).map((val, j) => (
                                                        <TableCell key={j} className="py-1.5 px-3">{String(val)}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 3 — Upload */}
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">3</div>
                            <div>
                                <CardTitle className="text-base">Upload & Save to Database</CardTitle>
                                <CardDescription>All valid rows will be saved as sale transactions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-3 flex-wrap">
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="gap-2 min-w-[160px]"
                            >
                                {uploading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                                ) : (
                                    <><Upload className="h-4 w-4" /> Upload & Import</>
                                )}
                            </Button>
                            {(file || results) && (
                                <Button variant="outline" onClick={resetUpload}>
                                    Reset
                                </Button>
                            )}
                        </div>

                        {/* Results */}
                        {results && (
                            <div className="space-y-4 mt-2">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                                        <div className="text-2xl font-black text-green-600">{results.success?.length || 0}</div>
                                        <div className="text-xs font-semibold text-green-700 mt-0.5">Successfully Imported</div>
                                    </div>
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                                        <div className="text-2xl font-black text-red-600">{results.errors?.length || 0}</div>
                                        <div className="text-xs font-semibold text-red-700 mt-0.5">Failed Rows</div>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                                        <div className="text-2xl font-black text-blue-600">
                                            {(results.success?.length || 0) + (results.errors?.length || 0)}
                                        </div>
                                        <div className="text-xs font-semibold text-blue-700 mt-0.5">Total Rows</div>
                                    </div>
                                </div>

                                {/* Successes */}
                                {results.success?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-700">
                                            <CheckCircle2 className="h-4 w-4" /> Successful Imports
                                        </p>
                                        <div className="rounded-lg border overflow-x-auto">
                                            <Table className="text-xs">
                                                <TableHeader className="bg-green-50">
                                                    <TableRow>
                                                        <TableHead>Row</TableHead>
                                                        <TableHead>Invoice #</TableHead>
                                                        <TableHead>Customer</TableHead>
                                                        <TableHead>Product</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {results.success.map((s, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{s.row}</TableCell>
                                                            <TableCell className="font-mono font-medium">{s.invoiceNumber}</TableCell>
                                                            <TableCell>{s.customer}</TableCell>
                                                            <TableCell>{s.product}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {results.errors?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-red-700">
                                            <XCircle className="h-4 w-4" /> Failed Rows
                                        </p>
                                        <div className="rounded-lg border overflow-x-auto">
                                            <Table className="text-xs">
                                                <TableHeader className="bg-red-50">
                                                    <TableRow>
                                                        <TableHead>Row</TableHead>
                                                        <TableHead>Error</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {results.errors.map((e, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{e.row}</TableCell>
                                                            <TableCell className="text-red-600">{e.error}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {results.success?.length > 0 && (
                                    <Button onClick={() => router.push('/transactions')} className="w-full sm:w-auto">
                                        View All Transactions
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
