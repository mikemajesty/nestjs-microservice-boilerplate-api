# ConvertMongooseFilter Decorator

Transforms **manual, complex MongoDB query construction** into elegant, type-safe, automatic filter object generation with built-in regex optimization, case-insensitive search, and MongoDB-specific operators.

## The Problem: Manual MongoDB Filter Hell

### ❌ **Without ConvertMongooseFilter - Manual Nightmare**

```typescript
// UGLY: Manual MongoDB query construction
import { FilterQuery } from 'mongoose'

export class CatRepository {
  async paginate(input: CatListInput): Promise<CatListOutput> {
    // ❌ Manual validation - error prone!
    const allowedFilterFields = ['name', 'breed', 'age', 'color']
    const where: FilterQuery<CatDocument> = { 
      $or: [],
      $and: [],
      deletedAt: null
    }
    
    if (input.search) {
      Object.keys(input.search).forEach(key => {
        // ❌ Manual check for each field
        if (!allowedFilterFields.includes(key)) {
          throw new Error(`Filter field '${key}' not allowed`)
        }
      })
      
      // ❌ Manual ID handling
      if (input.search.id) {
        where._id = input.search.id
        delete input.search.id
      }
      
      // ❌ Manual regex construction for LIKE searches
      if (input.search.name) {
        if (Array.isArray(input.search.name)) {
          // Multiple name search with regex
          where.$or?.push(...input.search.name.map(name => ({
            name: {
              $regex: this.escapeRegex(name),
              $options: 'i'  // Case insensitive
            }
          })))
        } else {
          // Single name search
          where.$and?.push({
            name: {
              $regex: this.escapeRegex(input.search.name),
              $options: 'i'
            }
          })
        }
      }
      
      // ❌ Manual type conversion for each field
      if (input.search.age) {
        if (Array.isArray(input.search.age)) {
          // Multiple age search with $or
          where.$or?.push(...input.search.age.map(age => ({
            age: Number(age)
          })))
        } else {
          // Single age search
          where.$and?.push({
            age: Number(input.search.age)
          })
        }
      }
      
      // ❌ Manual breed filtering
      if (input.search.breed) {
        if (Array.isArray(input.search.breed)) {
          where.$or?.push(...input.search.breed.map(breed => ({
            breed: {
              $regex: this.escapeRegex(breed),
              $options: 'i'
            }
          })))
        } else {
          where.$and?.push({
            breed: {
              $regex: this.escapeRegex(input.search.breed),
              $options: 'i'
            }
          })
        }
      }
      
      // ❌ Manual cleanup of empty operators
      if (!where.$or?.length) delete where.$or
      if (!where.$and?.length) delete where.$and
    }
    
    // ❌ Finally use the manually constructed query
    const cats = await this.entity.paginate(where, {
      page: input.page,
      limit: input.limit,
      sort: input.sort
    })
    
    return {
      docs: cats.docs.map(u => new CatEntity(u.toObject({ virtuals: true })).toObject()),
      limit: input.limit,
      page: input.page,
      total: cats.totalDocs
    }
  }
  
  // ❌ Manual regex escaping
  private escapeRegex(text: string): string {\n    return text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')\n  }\n  \n  // ❌ Repeat the same logic for EVERY method!\n  async findByBreed(input: CatListInput): Promise<CatListOutput> {\n    // ❌ Copy-paste the same 70+ lines of validation and conversion...\n  }\n}\n```\n\n### 🔥 **Problems with Manual Approach:**\n\n1. **Code Duplication** - Same filter logic repeated in every method\n2. **MongoDB Query Complexity** - Manual `$or`, `$and`, `$regex` construction\n3. **Type Conversion Hell** - Manual string → number, string → ObjectId\n4. **Regex Escaping** - Manual special character handling\n5. **Case Sensitivity Issues** - Manual `$options: 'i'` management\n6. **Array vs Single Logic** - Manual `$or` vs `$and` decision\n7. **ID Field Special Handling** - Manual `_id` transformation\n8. **Operator Cleanup** - Manual empty `$or`/`$and` removal\n\n## ✅ **The Elegant Solution: ConvertMongooseFilter**\n\n```typescript\nimport { ConvertMongooseFilter, SearchTypeEnum } from '@/utils/decorators/database'\n\nexport class CatRepository {\n  \n  // ✅ BEAUTIFUL: Single decorator with complete MongoDB automation!\n  @ConvertMongooseFilter<CatEntity>([\n    { name: 'name', type: SearchTypeEnum.like },                      // Auto: $regex with case-insensitive\n    { name: 'breed', type: SearchTypeEnum.like },                     // Auto: $regex with escaping\n    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' },    // Auto: string → number conversion\n    { name: 'color', type: SearchTypeEnum.equal },                    // Auto: exact match or $or for arrays\n    { name: 'ownerId', type: SearchTypeEnum.equal, format: 'ObjectId' } // Auto: string → ObjectId conversion\n  ])\n  @ValidateDatabaseSortAllowed<CatEntity>({ name: 'createdAt' }, { name: 'breed' })\n  async paginate({ limit, page, search, sort }: CatListInput): Promise<CatListOutput> {\n    // ✅ MongoDB query automatically validated, converted, and ready!\n    const cats = await this.entity.paginate(search as FilterQuery<IEntity>, {\n      page,\n      limit,\n      sort: sort as object  // ✅ Ready to use!\n    })\n\n    return {\n      docs: cats.docs.map(u => new CatEntity(u.toObject({ virtuals: true })).toObject()),\n      limit,\n      page,\n      total: cats.totalDocs\n    }\n  }\n  \n  // ✅ Same validation automatically applied to all methods!\n  @ConvertMongooseFilter<CatEntity>([\n    { name: 'breed', type: SearchTypeEnum.like },\n    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'isVaccinated', type: SearchTypeEnum.equal, format: 'Boolean' }\n  ])\n  async findByBreed(input: CatSearchInput): Promise<CatSearchOutput> {\n    // ✅ Zero boilerplate - just business logic!\n    return this.entity.find(input.search)\n      .sort(input.sort)\n      .limit(input.limit)\n  }\n}\n```\n\n## Advanced MongoDB Features & Optimizations\n\n### **🔍 MongoDB Regex Optimization**\n\n```typescript\nexport class ProductRepository {\n  \n  @ConvertMongooseFilter<ProductEntity>([\n    { name: 'name', type: SearchTypeEnum.like },        // Auto-optimized regex\n    { name: 'description', type: SearchTypeEnum.like }, // Case-insensitive search\n    { name: 'tags', type: SearchTypeEnum.like },        // Array field regex search\n    { name: 'category', type: SearchTypeEnum.equal },   // Exact match\n    { name: 'price', type: SearchTypeEnum.equal, format: 'Number' }\n  ])\n  async search(input: ProductSearchInput): Promise<ProductSearchOutput> {\n    // ✅ Automatic MongoDB optimizations:\n    // Input:  { search: { name: 'laptop', tags: ['electronics', 'computers'] } }\n    // Output: {\n    //   $and: [{ name: { $regex: 'laptop', $options: 'i' } }],\n    //   $or: [\n    //     { tags: { $regex: 'electronics', $options: 'i' } },\n    //     { tags: { $regex: 'computers', $options: 'i' } }\n    //   ]\n    // }\n    \n    return this.entity.paginate(input.search, {\n      page: input.page,\n      limit: input.limit,\n      sort: input.sort\n    })\n  }\n}\n```\n\n### **🆔 ObjectId & Type Conversions**\n\n```typescript\nexport class OrderRepository {\n  \n  @ConvertMongooseFilter<OrderEntity>([\n    { name: 'customerId', type: SearchTypeEnum.equal, format: 'ObjectId' }, // String → ObjectId\n    { name: 'status', type: SearchTypeEnum.equal },                         // String (no conversion)\n    { name: 'total', type: SearchTypeEnum.equal, format: 'Number' },        // String → Number\n    { name: 'isPaid', type: SearchTypeEnum.equal, format: 'Boolean' },      // String → Boolean\n    { name: 'orderDate', type: SearchTypeEnum.equal, format: 'Date' },      // String → Date\n    { name: 'customerName', type: SearchTypeEnum.like }                     // Regex search\n  ])\n  async search(input: OrderSearchInput): Promise<OrderSearchOutput> {\n    // ✅ Automatic type conversions:\n    // Input:  { customerId: '507f1f77bcf86cd799439011', total: '99.50', isPaid: 'true' }\n    // Output: { customerId: ObjectId('507f1f77bcf86cd799439011'), total: 99.50, isPaid: true }\n    \n    return this.entity.paginate(input.search, {\n      populate: ['customer', 'items']\n    })\n  }\n}\n```\n\n### **🗺️ Field Mapping & Custom Database Fields**\n\n```typescript\nexport class UserRepository {\n  \n  @ConvertMongooseFilter<UserEntity>([\n    { name: 'email', type: SearchTypeEnum.equal },\n    { name: 'fullName', type: SearchTypeEnum.like, map: 'full_name' },      // Frontend → DB mapping\n    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'department', type: SearchTypeEnum.equal, map: 'dept_id', format: 'ObjectId' }, // Map + convert\n    { name: 'isActive', type: SearchTypeEnum.equal, map: 'active', format: 'Boolean' }      // Map + convert\n  ])\n  async search(input: UserSearchInput): Promise<UserSearchOutput> {\n    // ✅ Automatic field mapping:\n    // Input:  { fullName: 'John', department: '507f...', isActive: 'true' }\n    // Output: { full_name: /john/i, dept_id: ObjectId('507f...'), active: true }\n    \n    return this.entity.paginate(input.search)\n  }\n}\n```\n\n## Real-World MongoDB Repository Examples\n\n### **🐱 Cat Repository with Complex Filtering**\n\n```typescript\nexport class CatRepository extends MongoRepository<CatDocument> {\n  \n  @ConvertMongooseFilter<CatEntity>([\n    { name: 'name', type: SearchTypeEnum.like },\n    { name: 'breed', type: SearchTypeEnum.like },\n    { name: 'age', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'color', type: SearchTypeEnum.equal },\n    { name: 'isVaccinated', type: SearchTypeEnum.equal, format: 'Boolean' },\n    { name: 'weight', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'ownerId', type: SearchTypeEnum.equal, format: 'ObjectId' },\n    { name: 'microchipId', type: SearchTypeEnum.equal }\n  ])\n  @ValidateDatabaseSortAllowed<CatEntity>(\n    { name: 'createdAt' }, { name: 'breed' }, { name: 'age' }\n  )\n  async paginate({ limit, page, search, sort }: CatListInput): Promise<CatListOutput> {\n    const cats = await this.entity.paginate(search as FilterQuery<IEntity>, {\n      page,\n      limit,\n      sort: sort as object,\n      populate: ['owner']\n    })\n\n    return {\n      docs: cats.docs.map(u => new CatEntity(u.toObject({ virtuals: true })).toObject()),\n      limit,\n      page,\n      total: cats.totalDocs\n    }\n  }\n}\n```\n\n### **📝 Blog Post Repository with Text Search**\n\n```typescript\nexport class BlogRepository {\n  \n  @ConvertMongooseFilter<BlogPostEntity>([\n    { name: 'title', type: SearchTypeEnum.like },                         // Full-text regex search\n    { name: 'content', type: SearchTypeEnum.like },                       // Content search\n    { name: 'author', type: SearchTypeEnum.like },                        // Author name search\n    { name: 'tags', type: SearchTypeEnum.like },                          // Array field search\n    { name: 'category', type: SearchTypeEnum.equal },                     // Exact category match\n    { name: 'status', type: SearchTypeEnum.equal },                       // Published/Draft status\n    { name: 'authorId', type: SearchTypeEnum.equal, format: 'ObjectId' }, // Author ObjectId\n    { name: 'publishDate', type: SearchTypeEnum.equal, format: 'Date' },  // Date filtering\n    { name: 'viewCount', type: SearchTypeEnum.equal, format: 'Number' },  // Numeric filtering\n    { name: 'isFeatured', type: SearchTypeEnum.equal, format: 'Boolean' } // Boolean flag\n  ])\n  async search(input: BlogSearchInput): Promise<BlogSearchOutput> {\n    // ✅ Complex MongoDB query generation:\n    // Input: { title: 'nodejs', tags: ['tutorial', 'backend'], isFeatured: 'true' }\n    // Output: {\n    //   $and: [\n    //     { title: { $regex: 'nodejs', $options: 'i' } },\n    //     { isFeatured: true }\n    //   ],\n    //   $or: [\n    //     { tags: { $regex: 'tutorial', $options: 'i' } },\n    //     { tags: { $regex: 'backend', $options: 'i' } }\n    //   ]\n    // }\n    \n    return this.entity.paginate(input.search, {\n      populate: ['author', 'category'],\n      sort: input.sort\n    })\n  }\n}\n```\n\n### **🛒 E-commerce Product Repository**\n\n```typescript\nexport class ProductRepository {\n  \n  @ConvertMongooseFilter<ProductEntity>([\n    { name: 'name', type: SearchTypeEnum.like },\n    { name: 'description', type: SearchTypeEnum.like },\n    { name: 'brand', type: SearchTypeEnum.equal },\n    { name: 'category', type: SearchTypeEnum.equal, map: 'category_id', format: 'ObjectId' },\n    { name: 'price', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'inStock', type: SearchTypeEnum.equal, format: 'Boolean' },\n    { name: 'rating', type: SearchTypeEnum.equal, format: 'Number' },\n    { name: 'tags', type: SearchTypeEnum.like },                          // Array search\n    { name: 'sellerId', type: SearchTypeEnum.equal, format: 'ObjectId' },\n    { name: 'isActive', type: SearchTypeEnum.equal, format: 'Boolean' }\n  ])\n  async search(input: ProductSearchInput): Promise<ProductSearchOutput> {\n    const products = await this.entity.paginate(input.search as FilterQuery<ProductDocument>, {\n      page: input.page,\n      limit: input.limit,\n      sort: input.sort,\n      populate: ['category', 'seller', 'reviews']\n    })\n\n    return {\n      docs: products.docs.map(p => new ProductEntity(p.toObject()).toObject()),\n      total: products.totalDocs,\n      page: input.page,\n      limit: input.limit\n    }\n  }\n}\n```\n\n## MongoDB Query Examples\n\n### **📨 API Request Examples**\n\n```bash\n# ✅ Valid filtering requests - automatic MongoDB query generation\nGET /cats?search=name:fluffy,breed:persian,age:3,isVaccinated:true\nGET /products?search=name:laptop,price:999,inStock:true,tags:gaming\nGET /posts?search=title:nodejs,author:john,isFeatured:true\n\n# ❌ Invalid filtering - automatic rejection\nGET /cats?search=secretData:value,name:fluffy\n# Response: 400 Bad Request\n# {\n#   \"error\": \"filter secretData not allowed, allowed list: name, breed, age, color, isVaccinated\"\n# }\n\n# ❌ Invalid type conversion - automatic validation\nGET /products?search=price:not-a-number\n# Response: 400 Bad Request\n# {\n#   \"error\": \"invalid number filter\"\n# }\n\nGET /orders?search=customerId:invalid-objectid\n# Response: 400 Bad Request\n# {\n#   \"error\": \"invalid objectId filter\"\n# }\n```\n\n### **🔄 MongoDB Query Transformation Examples**\n\n```typescript\n// Input from API request\nconst input = {\n  search: {\n    name: 'fluffy',              // LIKE search\n    breed: ['persian', 'maine'],  // LIKE array search  \n    age: '3',                    // String → Number\n    isVaccinated: 'true',        // String → Boolean\n    ownerId: '507f1f77bcf86cd799439011' // String → ObjectId\n  }\n}\n\n// After ConvertMongooseFilter transformation\nconst transformedInput = {\n  search: {\n    $and: [\n      { name: { $regex: 'fluffy', $options: 'i' } },\n      { age: 3 },\n      { isVaccinated: true },\n      { ownerId: ObjectId('507f1f77bcf86cd799439011') }\n    ],\n    $or: [\n      { breed: { $regex: 'persian', $options: 'i' } },\n      { breed: { $regex: 'maine', $options: 'i' } }\n    ],\n    deletedAt: null  // ✅ Automatic soft delete filtering\n  }\n}\n\n// Ready for MongoDB paginate!\n```\n\n### **🎯 Advanced MongoDB Operators**\n\n```typescript\n// Complex filtering examples\nconst complexQuery = {\n  // Generated from: search=name:john,age:25,tags:developer,nodejs\n  $and: [\n    { name: { $regex: 'john', $options: 'i' } },  // Case-insensitive name search\n    { age: 25 }                                   // Exact age match\n  ],\n  $or: [\n    { tags: { $regex: 'developer', $options: 'i' } }, // Array field search\n    { tags: { $regex: 'nodejs', $options: 'i' } }\n  ],\n  deletedAt: null  // Automatic soft delete\n}\n\n// MongoDB performance optimized:\n// - Uses indexes on exact match fields\n// - Efficient regex patterns with case insensitivity\n// - Proper $or/$and structure for optimal query planning\n```\n\n## MongoDB-Specific Optimizations\n\n### **🔍 Regex Optimization & Security**\n\n```javascript\n// ✅ Automatic regex escaping and optimization\n// Input: search=name:user.name@domain.com\n// Output: { name: { $regex: 'user\\\\.name@domain\\\\.com', $options: 'i' } }\n\n// ✅ Diacritic-sensitive regex (accents handled)\n// Input: search=name:josé\n// Matches: José, jose, JOSE, José María, etc.\n```\n\n### **📊 Performance Benefits**\n\n```javascript\n// ✅ Efficient array filtering\n// Input: search=tags:nodejs,react,vue\ndb.posts.find({\n  $or: [\n    { tags: { $regex: 'nodejs', $options: 'i' } },\n    { tags: { $regex: 'react', $options: 'i' } },\n    { tags: { $regex: 'vue', $options: 'i' } }\n  ]\n})\n\n// ✅ Index-friendly exact matches\n// Input: search=category:electronics,status:active\ndb.products.find({\n  $and: [\n    { category: 'electronics' },  // Uses category index\n    { status: 'active' }          // Uses status index\n  ]\n})\n```\n\n### **🗑️ Automatic Soft Delete**\n\n```javascript\n// ✅ Every query automatically includes soft delete filtering\nconst query = {\n  $and: [/* user filters */],\n  $or: [/* user filters */],\n  deletedAt: null  // ✅ Always added automatically\n}\n\n// Ensures deleted documents never appear in results\n```\n\n## Why ConvertMongooseFilter is Essential\n\n### **🎯 MongoDB Query Mastery**\n- **Automatic `$or`/`$and`** structure based on search type\n- **Regex optimization** with proper escaping and case-insensitivity\n- **Type conversion** for ObjectId, Number, Date, Boolean\n- **Field mapping** from frontend to database field names\n\n### **🛡️ Security & Performance**\n- **Field whitelisting** prevents unauthorized filtering\n- **Regex injection prevention** through proper escaping\n- **Index-friendly queries** with optimal operator selection\n- **Soft delete protection** automatically included\n\n### **⚡ MongoDB-Specific Features**\n- **Array field searching** with multiple regex patterns\n- **ObjectId validation** and conversion\n- **Diacritic-sensitive** regex patterns\n- **Paginate-ready** query structure\n\n### **🔧 Developer Experience**\n- **Type-safe** with full TypeScript support\n- **Zero boilerplate** - single decorator replaces 70+ lines\n- **Consistent API** across all MongoDB repositories\n- **Auto-cleanup** of empty `$or`/`$and` operators\n\n**ConvertMongooseFilter transforms complex, error-prone MongoDB query construction into elegant, type-safe, automatic filter generation that's secure, performant, and MongoDB-optimized!** 🚀