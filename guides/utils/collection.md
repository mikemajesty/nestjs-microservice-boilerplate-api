# Collection

Native TypeScript collection utilities that eliminate the need for external dependencies like Lodash. This utility provides **performance-optimized, type-safe collection operations** that are specifically tailored for application needs without the bloat of third-party libraries.

## Why Not Lodash?

Instead of adding heavy dependencies like Lodash, Ramda, or other utility libraries, CollectionUtil provides **exactly what you need** with:

### 🚀 **Zero Dependencies**
- **No external library bloat** in your bundle
- **Full control** over implementation and performance
- **No security vulnerabilities** from third-party dependencies
- **Smaller bundle size** for better application performance

### 🎯 **Application-Specific Optimizations**
- **Tailored for your domain** rather than generic use cases
- **Integration with your exception system** (ApiInternalServerException)
- **Consistent with your coding patterns** and architecture
- **Type safety** with your specific data structures

### 🔧 **Maintenance Control**
- **Easy debugging** since you own the implementation
- **Custom optimizations** for your specific use cases
- **No breaking changes** from library updates
- **Performance tuning** for your data patterns

## Central Hub for List Operations

**IMPORTANT**: All collection manipulation logic should be implemented here. This prevents:
- ❌ **Scattered array logic** throughout the codebase
- ❌ **Inconsistent implementations** of the same operations
- ❌ **Performance issues** from repeated inline operations
- ❌ **Maintenance nightmares** when logic needs updates

### ✅ **What Belongs in CollectionUtil**:
- Array transformations and manipulations
- Mathematical operations on collections
- Grouping and sorting operations
- Data aggregation and calculations
- Custom filtering and searching logic

## Practical Usage Examples

### Data Aggregation in Services

```typescript
export class SalesReportService {
  async generateSalesReport(salesData: SalesEntity[]): Promise<SalesReportOutput> {
    // Group sales by month using centralized logic
    const salesByMonth = CollectionUtil.groupBy(
      salesData.map(sale => sale.toObject()),
      'month'
    )

    // Calculate totals using centralized math operations
    const totalRevenue = CollectionUtil.sumBy(
      salesData.map(sale => sale.toObject()),
      'amount'
    )

    // Find best and worst performing months
    const monthlyTotals = Object.entries(salesByMonth).map(([month, sales]) => ({
      month,
      total: CollectionUtil.sumBy(sales, 'amount')
    }))

    const bestMonth = CollectionUtil.maxBy(monthlyTotals, 'total')
    const worstMonth = CollectionUtil.minBy(monthlyTotals, 'total')

    return {
      totalRevenue,
      salesByMonth,
      bestPerformingMonth: bestMonth,
      worstPerformingMonth: worstMonth,
      averageMonthlyRevenue: totalRevenue / Object.keys(salesByMonth).length
    }
  }
}
```

### User Management Operations

```typescript
export class UserAnalyticsService {
  async analyzeUserBehavior(users: UserEntity[]): Promise<UserAnalyticsOutput> {
    const userData = users.map(user => user.toObject())

    // Group users by registration month for growth analysis
    const usersByMonth = CollectionUtil.groupBy(userData, 'registrationMonth')
    
    // Check for duplicate emails (data quality)
    const emails = userData.map(user => user.email)
    const hasDuplicateEmails = CollectionUtil.hasDuplicated(emails)

    if (hasDuplicateEmails) {
      // Log data quality issue
      await this.logger.warn('Duplicate emails detected in user data')
    }

    // Calculate age demographics
    const ages = userData.map(user => user.age).filter(age => age > 0)
    const avgAge = CollectionUtil.sum(ages) / ages.length
    const youngestUser = CollectionUtil.min(ages)
    const oldestUser = CollectionUtil.max(ages)

    return {
      totalUsers: userData.length,
      userGrowthByMonth: usersByMonth,
      demographics: {
        averageAge: Math.round(avgAge),
        youngestUser,
        oldestUser,
        ageRange: oldestUser - youngestUser
      },
      dataQuality: {
        hasDuplicateEmails
      }
    }
  }
}
```

### Batch Processing with Chunking

```typescript
export class EmailBatchService {
  async sendBulkEmails(recipients: EmailRecipient[]): Promise<BatchEmailOutput> {
    // Prevent overwhelming email service with large batches
    const emailBatches = CollectionUtil.chunk(recipients, 100)
    
    const results: EmailBatchResult[] = []

    for (const batch of emailBatches) {
      try {
        const batchResult = await this.emailService.sendBatch(batch)
        results.push({
          batchSize: batch.length,
          success: true,
          sentCount: batchResult.sentCount
        })
      } catch (error) {
        results.push({
          batchSize: batch.length,
          success: false,
          error: error.message
        })
      }
    }

    // Aggregate batch results
    const totalSent = CollectionUtil.sumBy(
      results.filter(r => r.success), 
      'sentCount'
    )
    const totalFailed = recipients.length - totalSent

    return {
      totalRecipients: recipients.length,
      totalBatches: emailBatches.length,
      totalSent,
      totalFailed,
      successRate: (totalSent / recipients.length) * 100,
      batchResults: results
    }
  }
}
```

### Product Inventory Management

```typescript
export class InventoryService {
  async analyzeInventoryLevels(products: ProductEntity[]): Promise<InventoryAnalysisOutput> {
    const productData = products.map(product => product.toObject())

    // Group products by category for category-level analysis
    const productsByCategory = CollectionUtil.groupBy(productData, 'category')

    // Sort products by stock level (nulls last for out-of-stock items)
    const productsByStock = CollectionUtil.sortNullLast(
      productData, 
      'stockLevel', 
      SortEnum.asc
    )

    // Find products needing immediate attention
    const lowStockProducts = productsByStock.slice(0, 10) // Bottom 10
    const highestStockProduct = CollectionUtil.maxBy(productData, 'stockLevel')
    const lowestStockProduct = CollectionUtil.minBy(
      productData.filter(p => p.stockLevel > 0), // Exclude out-of-stock
      'stockLevel'
    )

    // Calculate category-level metrics
    const categoryMetrics = Object.entries(productsByCategory).map(([category, products]) => ({
      category,
      totalProducts: products.length,
      totalValue: CollectionUtil.sumBy(products, 'value'),
      averagePrice: CollectionUtil.sumBy(products, 'price') / products.length,
      totalStock: CollectionUtil.sumBy(products, 'stockLevel')
    }))

    const highestValueCategory = CollectionUtil.maxBy(categoryMetrics, 'totalValue')

    return {
      totalProducts: productData.length,
      lowStockAlert: lowStockProducts,
      topStockProduct: highestStockProduct,
      criticalStockProduct: lowestStockProduct,
      categoryBreakdown: categoryMetrics,
      mostValuableCategory: highestValueCategory,
      inventoryHealth: {
        outOfStockCount: productData.filter(p => p.stockLevel === 0).length,
        lowStockCount: productData.filter(p => p.stockLevel > 0 && p.stockLevel < 10).length
      }
    }
  }
}
```

### Order Processing Analytics

```typescript
export class OrderAnalyticsService {
  async processOrderMetrics(orders: OrderEntity[]): Promise<OrderMetricsOutput> {
    const orderData = orders.map(order => order.toObject())

    // Group orders by status for pipeline analysis
    const ordersByStatus = CollectionUtil.groupBy(orderData, 'status')
    
    // Group by customer for customer behavior analysis
    const ordersByCustomer = CollectionUtil.groupBy(orderData, 'customerId')

    // Find high-value customers
    const customerValues = Object.entries(ordersByCustomer).map(([customerId, customerOrders]) => ({
      customerId,
      orderCount: customerOrders.length,
      totalValue: CollectionUtil.sumBy(customerOrders, 'total'),
      averageOrderValue: CollectionUtil.sumBy(customerOrders, 'total') / customerOrders.length
    }))

    const topCustomer = CollectionUtil.maxBy(customerValues, 'totalValue')
    const mostFrequentCustomer = CollectionUtil.maxBy(customerValues, 'orderCount')

    // Calculate order distribution metrics
    const orderValues = orderData.map(order => order.total)
    const totalRevenue = CollectionUtil.sum(orderValues)
    const averageOrderValue = totalRevenue / orderData.length
    const highestOrder = CollectionUtil.max(orderValues)
    const lowestOrder = CollectionUtil.min(orderValues.filter(val => val > 0))

    return {
      orderPipeline: ordersByStatus,
      revenueMetrics: {
        totalRevenue,
        averageOrderValue,
        highestOrderValue: highestOrder,
        lowestOrderValue: lowestOrder
      },
      customerInsights: {
        topValueCustomer: topCustomer,
        mostActiveCustomer: mostFrequentCustomer,
        customerDistribution: customerValues
      },
      operationalMetrics: {
        totalOrders: orderData.length,
        pendingOrders: ordersByStatus['pending']?.length || 0,
        completedOrders: ordersByStatus['completed']?.length || 0
      }
    }
  }
}
```

## Benefits of Centralized Collections

### 🎯 **Performance Optimization**
- **Single place** to optimize array operations for your data patterns
- **Memory efficient** implementations tailored to your use cases
- **Consistent performance** across all collection operations
- **Easy profiling** and optimization of bottlenecks

### 🔧 **Maintenance Benefits**
- **Single source of truth** for collection logic
- **Easy updates** when algorithms need improvement
- **Consistent behavior** across entire application
- **Centralized testing** of collection operations

### 📊 **Type Safety & Developer Experience**
- **Full TypeScript support** with proper generic types
- **IDE autocompletion** for all collection methods
- **Compile-time safety** preventing common array operation errors
- **Consistent API** that's familiar to all developers

### 🚀 **Bundle Size & Performance**
- **Smaller application bundle** without heavy utility libraries
- **Faster startup time** due to reduced dependencies
- **Better tree shaking** with only used functions included
- **No external dependency vulnerabilities**

CollectionUtil transforms scattered array operations into a **maintainable, performant, and type-safe collection management system** that grows with your application needs.