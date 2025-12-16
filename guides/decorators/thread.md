# RunInNewThread Decorator

Transforms **CPU-intensive operations** from blocking nightmares into elegant, non-blocking, multi-threaded solutions with a simple decorator annotation.

## The Problem: CPU-Intensive Operations Block Everything

### ❌ **Native Worker Thread Implementation**

```typescript
// UGLY: Manual Worker Thread setup (100+ lines of boilerplate)
import { Worker, isMainThread, parentPort } from 'worker_threads'
import { writeFileSync } from 'fs'
import { join } from 'path'

export class NativeThreadExample {
  async calculatePrimes(limit: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      // Create worker file manually
      const workerCode = `
        const { parentPort } = require('worker_threads')
        
        parentPort.on('message', (limit) => {
          const primes = []
          for (let i = 2; i <= limit; i++) {
            let isPrime = true
            for (let j = 2; j <= Math.sqrt(i); j++) {
              if (i % j === 0) {
                isPrime = false
                break
              }
            }
            if (isPrime) primes.push(i)
          }
          parentPort.postMessage(primes)
        })
      `
      
      const workerPath = join(__dirname, 'temp-worker.js')
      writeFileSync(workerPath, workerCode)
      
      // Complex worker setup
      const worker = new Worker(workerPath)
      let timeoutId: NodeJS.Timeout
      
      // Manual timeout handling
      timeoutId = setTimeout(() => {
        worker.terminate()
        reject(new Error('Worker timeout'))
      }, 30000)
      
      // Manual event handling
      worker.on('message', (result) => {
        clearTimeout(timeoutId)
        worker.terminate()
        resolve(result)
      })
      
      worker.on('error', (error) => {
        clearTimeout(timeoutId)
        worker.terminate()
        reject(error)
      })
      
      worker.on('exit', (code) => {
        clearTimeout(timeoutId)
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
      
      // Send data to worker
      worker.postMessage(limit)
    })
  }
}
```

### ❌ **The Blocking Problem**

```typescript
// PROBLEM: This freezes your entire application!
export class BlockingService {
  async heavyCalculation(): Promise<number> {
    console.log('Starting calculation...')
    
    // This blocks the main thread for ~30 seconds
    let result = 0
    for (let i = 0; i < 10000000000; i++) {
      result += Math.sqrt(i)
    }
    
    console.log('Calculation finished!')
    return result
  }
}

// Your API becomes unresponsive:
// ❌ GET /health -> TIMEOUT (blocked by calculation)
// ❌ GET /users -> TIMEOUT (blocked by calculation)  
// ❌ POST /orders -> TIMEOUT (blocked by calculation)
```

## ✅ **The Elegant Solution: RunInNewThread**

```typescript
import { RunInNewThread } from '@/utils/decorators/workers'

export class ElegantThreadService {
  
  @RunInNewThread(30000) // 30 second timeout
  async calculatePrimes(limit: number): Promise<number[]> {
    // This runs in a separate thread - main thread stays free!
    const primes: number[] = []
    
    for (let i = 2; i <= limit; i++) {
      let isPrime = true
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false
          break
        }
      }
      if (isPrime) primes.push(i)
    }
    
    return primes
  }

  @RunInNewThread(60000) // 60 second timeout
  async heavyCalculation(): Promise<number> {
    console.log('Starting calculation...')
    
    // Runs in separate thread - API remains responsive!
    let result = 0
    for (let i = 0; i < 10000000000; i++) {
      result += Math.sqrt(i)
    }
    
    console.log('Calculation finished!')
    return result
  }
}

// Your API stays responsive:
// ✅ GET /health -> 200 OK (instant response)
// ✅ GET /users -> 200 OK (instant response)
// ✅ POST /orders -> 201 Created (instant response)
```

## Perfect Use Cases for RunInNewThread

### **🧮 Mathematical Computations**

```typescript
export class MathService {
  
  @RunInNewThread(120000) // 2min timeout
  async solveComplexEquation(matrix: number[][]): Promise<Solution> {
    // CPU-intensive matrix operations
    const eigenValues = this.calculateEigenValues(matrix)
    const eigenVectors = this.calculateEigenVectors(matrix)
    const decomposition = this.performSVD(matrix)
    
    return {
      eigenValues,
      eigenVectors, 
      decomposition,
      determinant: this.calculateDeterminant(matrix)
    }
  }

  @RunInNewThread(300000) // 5min timeout
  async monteCarloPi(iterations: number): Promise<number> {
    let inside = 0
    
    for (let i = 0; i < iterations; i++) {
      const x = Math.random()
      const y = Math.random()
      
      if (x * x + y * y <= 1) {
        inside++
      }
    }
    
    return 4 * inside / iterations
  }
}
```

### **📊 Data Analysis & Statistics**

```typescript
export class AnalyticsService {
  
  @RunInNewThread(180000) // 3min timeout
  async calculateCorrelationMatrix(dataset: DataPoint[]): Promise<CorrelationMatrix> {
    const features = this.extractFeatures(dataset)
    const correlations: number[][] = []
    
    // CPU-intensive correlation calculations
    for (let i = 0; i < features.length; i++) {
      correlations[i] = []
      for (let j = 0; j < features.length; j++) {
        correlations[i][j] = this.pearsonCorrelation(features[i], features[j])
      }
    }
    
    return {
      matrix: correlations,
      features: features.map(f => f.name),
      significance: this.calculateSignificance(correlations)
    }
  }

  @RunInNewThread(240000) // 4min timeout
  async performRegression(data: RegressionData): Promise<RegressionResult> {
    // CPU-intensive regression analysis
    const coefficients = this.leastSquares(data.x, data.y)
    const predictions = data.x.map(x => this.predict(x, coefficients))
    const residuals = data.y.map((y, i) => y - predictions[i])
    
    return {
      coefficients,
      predictions,
      rSquared: this.calculateRSquared(data.y, predictions),
      residuals,
      pValues: this.calculatePValues(coefficients, residuals)
    }
  }
}
```

### **🖼️ Image Processing (CPU Tasks)**

```typescript
export class ImageService {
  
  @RunInNewThread(90000) // 1.5min timeout
  async applyComplexFilters(imageBuffer: Buffer, filters: Filter[]): Promise<Buffer> {
    let processedImage = imageBuffer
    
    // CPU-intensive pixel manipulation
    for (const filter of filters) {
      switch (filter.type) {
        case 'gaussian_blur':
          processedImage = this.gaussianBlur(processedImage, filter.radius)
          break
        case 'edge_detection':
          processedImage = this.sobelOperator(processedImage)
          break
        case 'noise_reduction':
          processedImage = this.medianFilter(processedImage)
          break
        case 'color_correction':
          processedImage = this.histogramEqualization(processedImage)
          break
      }
    }
    
    return this.optimizeImage(processedImage)
  }

  @RunInNewThread(60000) // 1min timeout
  async generateThumbnails(imageBuffer: Buffer, sizes: number[]): Promise<ThumbnailSet> {
    const thumbnails: { [size: number]: Buffer } = {}
    
    // CPU-intensive image resizing
    for (const size of sizes) {
      thumbnails[size] = this.resizeImage(imageBuffer, size, size)
    }
    
    return {
      original: imageBuffer,
      thumbnails,
      metadata: this.extractImageMetadata(imageBuffer)
    }
  }
}
```

### **🔍 Text Processing & NLP**

```typescript
export class TextAnalysisService {
  
  @RunInNewThread(150000) // 2.5min timeout
  async analyzeSentiment(documents: string[]): Promise<SentimentAnalysis[]> {
    const results = []
    
    // CPU-intensive NLP processing
    for (const document of documents) {
      const tokens = this.tokenize(document)
      const features = this.extractFeatures(tokens)
      const sentiment = this.classifysentiment(features)
      const keywords = this.extractKeywords(tokens)
      const entities = this.namedEntityRecognition(tokens)
      
      results.push({
        document,
        sentiment,
        confidence: sentiment.confidence,
        keywords,
        entities,
        wordCount: tokens.length
      })
    }
    
    return results
  }

  @RunInNewThread(300000) // 5min timeout
  async buildLanguageModel(corpus: string[]): Promise<LanguageModel> {
    // CPU-intensive model training
    const vocabulary = this.buildVocabulary(corpus)
    const nGrams = this.extractNGrams(corpus, 3)
    const wordVectors = this.trainWordEmbeddings(vocabulary)
    
    return {
      vocabulary,
      nGrams,
      wordVectors,
      perplexity: this.calculatePerplexity(nGrams),
      modelSize: vocabulary.size
    }
  }
}
```

## Performance Benefits

### **🚀 True Parallelism**

```typescript
const mathService = new MathService()
const analyticsService = new AnalyticsService()
const imageService = new ImageService()

console.log('Starting parallel computations...')
const start = Date.now()

// All run in parallel threads - main thread free!
const [equation, correlation, thumbnails] = await Promise.all([
  mathService.solveComplexEquation(complexMatrix),    // Thread 1
  analyticsService.calculateCorrelationMatrix(data),  // Thread 2
  imageService.generateThumbnails(imageBuffer, [64, 128, 256])  // Thread 3
])

console.log(`All computations completed in ${Date.now() - start}ms`)
console.log('API was responsive throughout!')
```

### **📈 CPU Utilization**

```bash
# Before: Single thread maxed out
CPU Usage: [████████████████████████████████] 100% (1 core)
API Response Time: TIMEOUT

# After: Multiple cores utilized efficiently
CPU Usage: [████████] [████████] [████████] [████████] 100% (4 cores)
API Response Time: <50ms
```

## Why RunInNewThread is Revolutionary

### **🎯 Zero Configuration**
- **Single decorator** replaces 100+ lines of boilerplate
- **Automatic resource management**
- **Built-in timeout handling**
- **Error propagation with proper stack traces**

### **🛡️ Production Ready**
- **Works with TypeScript** (ts-node development)
- **Works with compiled JavaScript** (production builds)
- **Automatic file detection** (.ts vs .js)
- **Graceful worker termination**
- **Memory leak prevention**

### **⚡ Performance**
- **True thread parallelism**
- **Non-blocking main thread**
- **CPU core utilization**
- **Scalable concurrent execution**

### **🔧 Type Safety**
- **Full TypeScript support**
- **Parameter type preservation**
- **Return type preservation**
- **Compile-time error checking**

**RunInNewThread transforms Node.js from a single-threaded bottleneck into a multi-core powerhouse for CPU-intensive operations!** 🚀