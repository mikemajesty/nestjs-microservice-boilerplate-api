# Excel

Excel file generation utility that converts data arrays into downloadable .xlsx files with customizable formatting, headers, and data types. Perfect for exporting user data, reports, and analytics.

## Purpose

This utility provides a **simple yet powerful way** to generate Excel files from your application data. Whether you need to export user lists, financial reports, or any tabular data, this utility handles the formatting and generation seamlessly.

## Basic Usage

```typescript
import { ExcelUtils } from '@/utils/excel'

export class UserExportService {
  async exportUsers(users: UserEntity[]): Promise<Buffer> {
    // Define the Excel structure
    const config = [
      { property: 'name', header: 'Full Name', type: String },
      { property: 'email', header: 'Email Address', type: String },
      { property: 'createdAt', header: 'Registration Date', type: Date },
      { property: 'isActive', header: 'Status', type: Boolean }
    ]

    // Transform data to match Excel format
    const data = users.map(user => ({
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isActive: user.isActive
    }))

    // Generate Excel buffer
    return await ExcelUtils.getExcelBuffer(
      { data, sheetName: 'Users Export' },
      config
    )
  }
}
```

## Advanced Customization Options

The `config` parameter accepts extensive customization through the `config` field, which follows the [write-excel-file](https://www.npmjs.com/package/write-excel-file) Cell interface:

### Cell Formatting

```typescript
const advancedConfig = [
  {
    property: 'revenue',
    header: 'Revenue',
    type: Number,
    config: {
      format: '#,##0.00',           // Number formatting with thousands separator
      style: {
        fontWeight: 'bold',          // Bold font
        backgroundColor: '#e6f3ff'   // Light blue background
      }
    }
  },
  {
    property: 'description',
    header: 'Description',
    type: String,
    config: {
      wrap: true,                   // Text wrapping
      width: 50,                    // Column width
      style: {
        alignment: {
          horizontal: 'left',        // Text alignment
          vertical: 'top'
        }
      }
    }
  },
  {
    property: 'deadline',
    header: 'Deadline',
    type: Date,
    config: {
      format: 'dd/mm/yyyy',         // Date formatting
      style: {
        color: '#ff0000',           // Red text color
        fontSize: 12
      }
    }
  }
]
```

### Conditional Formatting

```typescript
export class OrderExportService {
  async exportOrders(orders: OrderEntity[]): Promise<Buffer> {
    const config = [
      { property: 'orderId', header: 'Order ID', type: String },
      { property: 'customerName', header: 'Customer', type: String },
      { 
        property: 'total', 
        header: 'Total Amount', 
        type: Number,
        config: {
          format: '$#,##0.00',
          style: {
            fontWeight: 'bold',
            backgroundColor: '#f0f8f0'  // Light green for amounts
          }
        }
      },
      {
        property: 'status',
        header: 'Status',
        type: String,
        config: {
          style: {
            fontSize: 11,
            fontWeight: 'bold'
          }
        }
      }
    ]

    // Add conditional styling based on order status
    const data = orders.map(order => ({
      orderId: order.id,
      customerName: order.customer.name,
      total: order.total,
      status: order.status.toUpperCase()
    }))

    return await ExcelUtils.getExcelBuffer(
      { data, sheetName: `Orders Export - ${new Date().toISOString().split('T')[0]}` },
      config
    )
  }
}
```

### Financial Reports with Complex Formatting

```typescript
export class FinancialReportService {
  async generateMonthlyReport(transactions: TransactionEntity[]): Promise<Buffer> {
    const config = [
      {
        property: 'date',
        header: 'Date',
        type: Date,
        config: {
          format: 'dd/mm/yyyy',
          width: 15
        }
      },
      {
        property: 'category',
        header: 'Category',
        type: String,
        config: {
          width: 20,
          style: {
            fontWeight: 'bold',
            alignment: { horizontal: 'center' }
          }
        }
      },
      {
        property: 'income',
        header: 'Income',
        type: Number,
        config: {
          format: '$#,##0.00',
          style: {
            color: '#008000',           // Green for income
            fontWeight: 'bold'
          }
        }
      },
      {
        property: 'expense',
        header: 'Expense',
        type: Number,
        config: {
          format: '$#,##0.00',
          style: {
            color: '#ff0000',           // Red for expenses
            fontWeight: 'bold'
          }
        }
      },
      {
        property: 'balance',
        header: 'Running Balance',
        type: Number,
        config: {
          format: '$#,##0.00',
          style: {
            backgroundColor: '#f0f0f0',  // Gray background
            fontWeight: 'bold',
            borderStyle: 'thin'
          }
        }
      }
    ]

    const data = transactions.map(transaction => ({
      date: transaction.date,
      category: transaction.category,
      income: transaction.type === 'income' ? transaction.amount : 0,
      expense: transaction.type === 'expense' ? transaction.amount : 0,
      balance: transaction.runningBalance
    }))

    return await ExcelUtils.getExcelBuffer(
      { data, sheetName: 'Monthly Financial Report' },
      config
    )
  }
}
```

## Performance Limit

### 📊 **MAX_SYNC_LIMIT: 10,000 records**

The utility has a **built-in performance limit** to ensure optimal server performance and prevent memory issues:

```typescript
// This will work fine
const smallDataset = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `User ${i}` }))
await ExcelUtils.getExcelBuffer({ data: smallDataset }, config) // ✅ Success

// This will throw an exception
const largeDataset = Array.from({ length: 15000 }, (_, i) => ({ id: i, name: `User ${i}` }))
await ExcelUtils.getExcelBuffer({ data: largeDataset }, config) // ❌ ApiBadRequestException
```

### Handling Large Datasets

For datasets exceeding 10,000 records, consider these strategies:

**1. Pagination Approach:**
```typescript
export class LargeDataExportService {
  async exportLargeDataset(filters: ExportFilters): Promise<Buffer[]> {
    const PAGE_SIZE = 8000  // Stay under the limit
    let page = 1
    const buffers: Buffer[] = []

    while (true) {
      const data = await this.dataRepository.findPaginated(filters, page, PAGE_SIZE)
      
      if (data.length === 0) break

      const buffer = await ExcelUtils.getExcelBuffer(
        { data, sheetName: `Export Page ${page}` },
        this.getExportConfig()
      )
      
      buffers.push(buffer)
      page++
      
      if (data.length < PAGE_SIZE) break  // Last page
    }

    return buffers  // Return multiple Excel files
  }
}
```

**2. Streaming for Very Large Data:**
```typescript
export class StreamingExportService {
  async exportWithStreaming(filters: ExportFilters): Promise<void> {
    // For datasets > 50k records, use streaming solutions
    // Consider libraries like 'exceljs' with streaming capabilities
    // or implement batch processing with job queues
    
    if (await this.getRecordCount(filters) > 10000) {
      // Queue background job for large exports
      await this.jobQueue.add('large-export', { filters })
      throw new ApiUnprocessableEntityException('largeExportQueued', {
        context: 'StreamingExportService.exportWithStreaming',
        details: [{ 
          message: 'Export queued for background processing',
          estimatedTime: '5-10 minutes'
        }]
      })
    }

    // Process normally for smaller datasets
  }
}
```

## Controller Integration

```typescript
@Controller('exports')
export class ExportController {
  @Get('users.xlsx')
  @HttpCode(200)
  async exportUsers(
    @Query() filters: UserExportFilters,
    @Res() res: Response
  ): Promise<void> {
    const users = await this.userService.findForExport(filters)
    const excelBuffer = await this.userExportService.exportUsers(users)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="users-${Date.now()}.xlsx"`)
    res.setHeader('Content-Length', excelBuffer.length)
    
    res.end(excelBuffer)
  }

  @Get('financial-report.xlsx')
  async exportFinancialReport(
    @Query() filters: ReportFilters,
    @Res() res: Response
  ): Promise<void> {
    // Pre-check data size to avoid hitting the limit
    const recordCount = await this.transactionService.countRecords(filters)
    
    if (recordCount > 10000) {
      throw new ApiBadRequestException('datasetTooLarge', {
        context: 'ExportController.exportFinancialReport',
        details: [{ 
          recordCount, 
          limit: 10000,
          suggestion: 'Apply date range or category filters to reduce dataset size'
        }]
      })
    }

    const transactions = await this.transactionService.findForReport(filters)
    const excelBuffer = await this.financialReportService.generateMonthlyReport(transactions)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="financial-report-${Date.now()}.xlsx"`)
    res.end(excelBuffer)
  }
}
```

## Benefits

### Performance Optimized
- **Memory efficient** processing for datasets up to 10,000 records
- **Built-in protection** against memory exhaustion
- **Fast generation** using optimized write-excel-file library

### Highly Customizable  
- **Cell-level formatting** control (colors, fonts, borders)
- **Data type handling** (String, Number, Date, Boolean)
- **Column width and alignment** customization
- **Custom date and number formats**

### Developer Friendly
- **Simple API** with TypeScript support
- **Flexible configuration** through property mapping
- **Error handling** with clear limits and messages
- **Easy integration** with existing services and controllers

### Production Ready
- **Resource protection** with automatic limit enforcement  
- **Consistent error handling** using application exception format
- **Configurable sheet names** for better organization
- **Buffer output** ready for HTTP streaming or file storage