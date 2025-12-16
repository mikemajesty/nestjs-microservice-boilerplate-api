# Mongoose

MongoDB-specific utilities for enhanced text filtering, ObjectId handling, and query optimization.

## Key Text Filtering Features

### escapeParentheses()

Safely escapes parentheses in filter strings to prevent regex injection issues.

```typescript
MongoUtils.escapeParentheses('user(admin)')     // → 'user\\(admin\\)'
MongoUtils.escapeParentheses(['test(1)', 'user(2)'])  // → ['test\\(1\\)', 'user\\(2\\)']
```

**Why Used**: Prevents regex errors when user input contains parentheses, which are special regex characters that can break MongoDB text queries.

### diacriticSensitiveRegex()

Converts text to regex patterns that match accented variations, perfect for Portuguese/Spanish content.

```typescript
MongoUtils.diacriticSensitiveRegex('jose')    // → 'jos[e,é,ë,è,ê]'
MongoUtils.diacriticSensitiveRegex('João')    // → 'J[o,ó,ö,ò,ô][a,á,à,ä,â,ã]o'
MongoUtils.diacriticSensitiveRegex(['ana', 'carlos'])  // → ['[a,á,à,ä,â,ã]n[a,á,à,ä,â,ã]', 'c[a,á,à,ä,â,ã]rlos']
```

**Character Mappings**:
- `a` → `[a,á,à,ä,â,ã]`
- `e` → `[e,é,ë,è,ê]` 
- `i` → `[i,í,ï,ì,î]`
- `o` → `[o,ó,ö,ò,ô]`
- `c` → `[c,ç]`
- `u` → `[u,ü,ú,ù]`

### Combined Text Processing

```typescript
// Complete text filter processing
MongoUtils.createRegexFilterText('José(admin)')
// 1. Escapes parentheses: 'José\\(admin\\)'  
// 2. Adds diacritic patterns: 'J[o,ó,ö,ò,ô]s[e,é,ë,è,ê]\\(admin\\)'
```

## Benefits for MongoDB Filters

### Flexible User Search
```javascript
// User searches for "jose" but database has "José"
db.users.find({ name: { $regex: 'jos[e,é,ë,è,ê]', $options: 'i' } })
// ✅ Matches: José, jose, Jose, Josè, etc.

// User searches for "sao paulo" but database has "São Paulo"  
db.locations.find({ city: { $regex: 's[a,á,à,ä,â,ã]o p[a,á,à,ä,â,ã]ulo', $options: 'i' } })
// ✅ Matches: São Paulo, sao paulo, Sao Paulo, etc.
```

### Safe Input Handling
```javascript
// User input: "Test(1)" - without escaping would break regex
// With escaping: safely handled as literal text match
```

## Other Utilities

### ObjectId Helpers
```typescript
MongoUtils.createObjectId()                    // → new ObjectId
MongoUtils.isObjectId('507f1f77bcf86cd799439011')  // → true/false
MongoUtils.toObjectId('507f1f77bcf86cd799439011')  // → ObjectId instance
```

### Pagination Support  
```typescript
MongoUtils.calculateSkip(2, 10)  // → 10 (page 2, limit 10)
```

## Real-World Impact

**Without diacritic handling:**
- User searches "jose" → No results (database has "José")
- User searches "sao paulo" → No results (database has "São Paulo")

**With diacritic handling:**  
- User searches "jose" → ✅ Finds "José", "jose", "José Carlos"
- User searches "sao paulo" → ✅ Finds "São Paulo", "SAO PAULO"

This is especially valuable for Brazilian/international applications where users may type without accents but expect to find accented content.