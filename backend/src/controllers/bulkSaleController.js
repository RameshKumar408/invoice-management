const XLSX = require('xlsx');
const { Transaction, Product, Contact } = require('../models');
const { asyncHandler } = require('../middleware/validation');

/**
 * @desc    Bulk upload sales from Excel file
 * @route   POST /api/transactions/bulk-sale
 * @access  Private
 *
 * Expected Excel columns:
 * Date | Customer Name | Product Name | Quantity | Unit Type | Inc. Price | Payment Method | Discount | Notes | Status
 */
const bulkSaleUpload = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const businessId = req.businessId;
    const createdBy = req.user._id;

    // Parse workbook
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows || rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows' });
    }

    const results = { success: [], errors: [] };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1=header, 2=first data)

        try {
            // Extract fields
            const customerName = String(row['Customer Name'] || '').trim();
            const productName = String(row['Product Name'] || '').trim();
            const quantity = Number(row['Quantity'] || 0);
            const unitType = String(row['Unit Type'] || 'single').trim().toLowerCase();
            const incPrice = Number(row['Inc. Price'] || 0);
            const paymentMethod = String(row['Payment Method'] || 'cash').trim().toLowerCase();
            const discount = Number(row['Discount'] || 0);
            const notes = String(row['Notes'] || '').trim();
            const status = String(row['Status'] || 'completed').trim().toLowerCase();
            const dateRaw = row['Date'];

            // Parse date
            let date;
            if (dateRaw) {
                if (typeof dateRaw === 'number') {
                    // Excel serial date
                    date = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                } else {
                    // Try DD/MM/YYYY or DD-MM-YYYY
                    const parts = String(dateRaw).split(/[\/\-]/);
                    if (parts.length === 3) {
                        const [d, m, y] = parts;
                        date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                    } else {
                        date = new Date(dateRaw);
                    }
                }
            } else {
                date = new Date();
            }

            // Validate required fields
            if (!customerName) {
                results.errors.push({ row: rowNum, error: 'Customer Name is required' });
                continue;
            }
            if (!productName) {
                results.errors.push({ row: rowNum, error: 'Product Name is required' });
                continue;
            }
            if (quantity <= 0) {
                results.errors.push({ row: rowNum, error: 'Quantity must be greater than 0' });
                continue;
            }

            // Find customer by name (case-insensitive)
            const customer = await Contact.findOne({
                businessId,
                type: 'customer',
                isActive: true,
                name: { $regex: new RegExp(`^${customerName}$`, 'i') }
            });

            if (!customer) {
                results.errors.push({ row: rowNum, error: `Customer "${customerName}" not found` });
                continue;
            }

            // Find product by name (case-insensitive)
            const product = await Product.findOne({
                businessId,
                isActive: true,
                name: { $regex: new RegExp(`^${productName}$`, 'i') }
            });

            if (!product) {
                results.errors.push({ row: rowNum, error: `Product "${productName}" not found` });
                continue;
            }

            // Check stock
            if (product.stock < quantity) {
                results.errors.push({
                    row: rowNum,
                    error: `Insufficient stock for "${productName}". Available: ${product.stock}, Requested: ${quantity}`
                });
                continue;
            }

            // Calculate prices
            const cgst = product.cgst || 0;
            const sgst = product.sgst || 0;
            const totalTaxRate = cgst + sgst;

            // incPrice is inclusive price. Derive base price.
            const resolvedIncPrice = incPrice > 0 ? incPrice : (product.price || 0);
            const basePrice = resolvedIncPrice / (1 + totalTaxRate / 100);
            const itemTotal = basePrice * quantity;

            const subtotal = itemTotal;
            const cgstAmount = itemTotal * (cgst / 100);
            const sgstAmount = itemTotal * (sgst / 100);
            const totalAmount = Math.max(0, subtotal + cgstAmount + sgstAmount - discount);

            // Generate invoice number
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const prefix = `${month}${year}`;
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const count = await Transaction.countDocuments({
                businessId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            const sequence = String(count + 1).padStart(5, '0');
            const invoiceNumber = `${prefix}-${sequence}`;

            // Update product stock
            product.stock -= quantity;
            await product.save();

            // Create transaction
            const transaction = await Transaction.create({
                type: 'sale',
                businessId,
                createdBy,
                customerId: customer._id,
                customerName: customer.name,
                invoiceNumber,
                date: isNaN(date) ? new Date() : date,
                products: [{
                    productId: product._id,
                    productName: product.name,
                    quantity,
                    price: Number(basePrice.toFixed(2)),
                    unitType: ['case', 'single'].includes(unitType) ? unitType : 'single',
                    HSN: product.HSN,
                    total: Number(itemTotal.toFixed(2))
                }],
                paymentMethod: ['cash', 'credit', 'card'].includes(paymentMethod) ? paymentMethod : 'cash',
                notes,
                subtotal: Number(subtotal.toFixed(2)),
                cgst: Number(cgstAmount.toFixed(2)),
                sgst: Number(sgstAmount.toFixed(2)),
                discount: discount,
                totalAmount: Number(totalAmount.toFixed(2)),
                paidAmount: paymentMethod !== 'credit' ? Number(totalAmount.toFixed(2)) : 0,
                status: ['pending', 'completed', 'cancelled'].includes(status) ? status : 'completed',
            });

            results.success.push({
                row: rowNum,
                invoiceNumber: transaction.invoiceNumber,
                customer: customer.name,
                product: product.name
            });

        } catch (err) {
            results.errors.push({ row: rowNum, error: err.message });
        }
    }

    res.json({
        success: true,
        message: `Processed ${rows.length} rows: ${results.success.length} created, ${results.errors.length} failed`,
        data: results
    });
});

module.exports = { bulkSaleUpload };
