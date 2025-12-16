# Text

Simple text transformation utilities for common string manipulation tasks.

## Available Methods

### snakeCase(text)

Converts any text format to snake_case.

```typescript
TextUtils.snakeCase('UserName')           // → 'user_name'
TextUtils.snakeCase('product-category')   // → 'product_category' 
TextUtils.snakeCase('Order Status')       // → 'order_status'
TextUtils.snakeCase('camelCaseExample')   // → 'camel_case_example'
```

### capitalizeFirstLetter(text)

Capitalizes the first letter of a string.

```typescript
TextUtils.capitalizeFirstLetter('hello')      // → 'Hello'
TextUtils.capitalizeFirstLetter('user name')  // → 'User name'
TextUtils.capitalizeFirstLetter('API')        // → 'API'
```

### removeAccents(text)

Removes accents and diacritics from text.

```typescript
TextUtils.removeAccents('José da Silva')  // → 'Jose da Silva'
TextUtils.removeAccents('São Paulo')      // → 'Sao Paulo'
TextUtils.removeAccents('Açaí')          // → 'Acai'
```

### slugify(text)

Creates URL-friendly slugs from text.

```typescript
TextUtils.slugify('My Blog Post Title')     // → 'my-blog-post-title'
TextUtils.slugify('Product Name & Price')   // → 'product-name-price'
TextUtils.slugify('  Special   Chars!  ')  // → 'special-chars'
```

## Common Use Cases

```typescript
// Database column names
const columnName = TextUtils.snakeCase('createdAt')  // → 'created_at'

// Display titles
const title = TextUtils.capitalizeFirstLetter(user.name)  // → 'John'

// Search optimization (Brazilian content)
const searchText = TextUtils.removeAccents(searchQuery)

// SEO-friendly URLs
const postSlug = TextUtils.slugify('Como configurar o NestJS')  // → 'como-configurar-o-nestjs'
```