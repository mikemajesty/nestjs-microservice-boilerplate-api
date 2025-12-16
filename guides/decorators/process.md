# RunInNewProcess Decorator

Transforms **memory-intensive operations** from dangerous memory leaks and crashes into safe, isolated, scalable solutions with complete memory isolation.

## The Problem: Memory-Intensive Operations Are Dangerous

### ❌ **Native Child Process Implementation**

```typescript
// UGLY: Manual Child Process setup (150+ lines of boilerplate)
import { fork, ChildProcess } from 'child_process'
import { writeFileSync } from 'fs'
import { join } from 'path'

export class NativeProcessExample {
  async processLargeDataset(data: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Create process file manually
      const processCode = `
        process.on('message', ({ data }) => {
          try {
            const result = data.map(item => {
              // Heavy processing
              let temp = item
              for (let i = 0; i < 1000; i++) {
                temp = temp * 2 / 2 + 1
              }
              return Math.floor(temp)
            })
            
            process.send({ success: result })
          } catch (error) {
            process.send({ error: error.message })
          } finally {
            process.exit()
          }
        })
      `
      
      writeFileSync(join(__dirname, 'temp-process.js'), processCode)
      
      // Complex process setup
      const child = fork(join(__dirname, 'temp-process.js'))
      let timeoutId: NodeJS.Timeout
      
      // Manual timeout handling
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM')
        reject(new Error('Process timeout'))
      }, 60000)
      
      // Manual event handling
      child.on('message', (message: any) => {
        clearTimeout(timeoutId)
        
        if (message.error) {
          child.kill()
          reject(new Error(message.error))
        } else {
          child.kill()
          resolve(message.success)
        }
      })
      
      child.on('error', (error) => {
        clearTimeout(timeoutId)
        child.kill()
        reject(error)
      })
      
      child.on('exit', (code) => {
        clearTimeout(timeoutId)
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`))
        }
      })
      
      // Send data to process
      child.send({ data })
    })
  }
}
```

### ❌ **The Memory Leak Problem**

```typescript
// DANGER: This can crash your application!
export class DangerousMemoryService {
  async processHugeFile(filePath: string): Promise<ProcessedData> {
    console.log('Loading 5GB file into memory...')
    
    // Loads massive file into main process memory
    const hugeBuffer = readFileSync(filePath) // 5GB file
    const hugeArray = new Array(100000000).fill(hugeBuffer) // 500GB in memory!
    
    // Heavy processing with massive memory allocation
    const processed = hugeArray.map(buffer => {
      return this.intensiveProcessing(buffer) // More memory allocation
    })
    
    // Memory might never be freed properly
    // GC struggles with such large objects
    // Can cause OOM crashes
    
    return processed
  }
  
  // 💥 RESULT: 
  // - Memory usage: 500GB+ 
  // - Application crash: "JavaScript heap out of memory"
  // - Server downtime
  // - Data loss
}
```

## ✅ **The Safe Solution: RunInNewProcess**

```typescript
import { RunInNewProcess } from '@/utils/decorators/process'

export class SafeMemoryService {
  
  @RunInNewProcess(300000) // 5min timeout
  async processLargeDataset(data: any[]): Promise<any[]> {
    // Runs in completely isolated process!
    return data.map(item => {
      // Heavy processing with safe memory isolation
      let temp = item
      for (let i = 0; i < 1000; i++) {
        temp = temp * 2 / 2 + 1
      }
      return Math.floor(temp)
    })
    // Process terminates, ALL memory automatically freed
  }

  @RunInNewProcess(600000) // 10min timeout  
  async processHugeFile(filePath: string): Promise<ProcessedData> {
    console.log('Loading 5GB file in isolated process...')
    
    // Safe: Runs in separate process with isolated memory space
    const hugeBuffer = readFileSync(filePath) // 5GB file - in separate process
    const hugeArray = new Array(100000000).fill(hugeBuffer) // 500GB - in separate process
    
    // Heavy processing in complete isolation
    const processed = hugeArray.map(buffer => {
      return this.intensiveProcessing(buffer) // Safe memory allocation
    })
    
    return processed
    // ✅ Process terminates, 500GB memory instantly freed!
    // ✅ Main process never affected
    // ✅ Zero memory leaks
  }
}
```

## Perfect Use Cases for RunInNewProcess

### **📄 Document Processing & PDF Generation**

```typescript
export class DocumentService {
  
  @RunInNewProcess(420000) // 7min timeout
  async generateMassivePDFReport(data: ReportData): Promise<Buffer> {
    // Memory-intensive PDF generation in isolated process
    const document = new PDFDocument()
    
    // Add thousands of pages with charts, tables, images
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i]
      
      document.addPage()
      this.addSection(document, section)
      
      if (section.charts) {
        // Generate high-resolution charts (memory intensive)
        const chartImages = this.generateHighResCharts(section.data)
        chartImages.forEach(chart => {
          document.image(chart, { width: 800, height: 600 })
        })
      }
      
      if (section.tables) {
        // Render complex tables with thousands of rows
        this.renderLargeTable(document, section.tables)
      }
    }
    
    // Convert to buffer (memory intensive)
    const pdfBuffer = document.getBuffer()
    return this.compressPDF(pdfBuffer)
    // Process ends, all PDF generation memory freed
  }

  @RunInNewProcess(240000) // 4min timeout
  async convertMultipleDocuments(filePaths: string[]): Promise<ConversionResult[]> {
    const results = []
    
    for (const filePath of filePaths) {
      // Each document loads into isolated process memory
      const originalBuffer = readFileSync(filePath) // Could be 100MB+ each
      
      let convertedBuffer: Buffer
      
      if (filePath.endsWith('.docx')) {
        convertedBuffer = this.convertWordToPDF(originalBuffer)
      } else if (filePath.endsWith('.xlsx')) {
        convertedBuffer = this.convertExcelToPDF(originalBuffer)
      } else if (filePath.endsWith('.pptx')) {
        convertedBuffer = this.convertPowerPointToPDF(originalBuffer)
      }
      
      results.push({
        originalPath: filePath,
        convertedBuffer,
        originalSize: originalBuffer.length,
        convertedSize: convertedBuffer.length
      })
    }
    
    return results
    // All document buffers freed when process terminates
  }
}
```

### **🖼️ Image/Video Processing (Memory Tasks)**

```typescript
export class MediaProcessingService {
  
  @RunInNewProcess(900000) // 15min timeout
  async batchProcessLargeImages(imagePaths: string[]): Promise<ProcessedImage[]> {
    const results = []
    
    for (const imagePath of imagePaths) {
      // Load high-resolution image (50-200MB each)
      const imageBuffer = readFileSync(imagePath)
      
      // Memory-intensive operations in isolated process
      const resizedVersions = {
        thumbnail: this.resizeImage(imageBuffer, 150, 150),
        small: this.resizeImage(imageBuffer, 500, 500),
        medium: this.resizeImage(imageBuffer, 1200, 1200),
        large: this.resizeImage(imageBuffer, 2400, 2400)
      }
      
      // Apply memory-intensive filters
      const filteredVersions = {
        blur: this.applyGaussianBlur(imageBuffer, 5),
        sharp: this.applySharpeningFilter(imageBuffer),
        vintage: this.applyVintageEffect(imageBuffer),
        hdr: this.applyHDREffect(imageBuffer)
      }
      
      // Generate metadata (memory intensive for large images)
      const metadata = this.extractFullMetadata(imageBuffer)
      const colorPalette = this.extractColorPalette(imageBuffer)
      
      results.push({
        originalPath: imagePath,
        resized: resizedVersions,
        filtered: filteredVersions,
        metadata,
        colorPalette
      })
    }
    
    return results
    // All image buffers freed when process terminates
  }

  @RunInNewProcess(1200000) // 20min timeout
  async processVideo(videoPath: string, options: VideoProcessingOptions): Promise<ProcessedVideo> {
    // Load entire video into memory for processing (GB of data)
    const videoBuffer = readFileSync(videoPath)
    
    // Memory-intensive video operations
    const extractedFrames = this.extractAllFrames(videoBuffer)
    const processedFrames = extractedFrames.map(frame => {
      return this.processFrame(frame, options)
    })
    
    // Reassemble video
    const processedVideo = this.assembleVideo(processedFrames, options.codec)
    
    // Generate thumbnail strip
    const thumbnails = this.generateThumbnailStrip(extractedFrames)
    
    return {
      processedVideo,
      thumbnails,
      originalSize: videoBuffer.length,
      processedSize: processedVideo.length,
      frameCount: extractedFrames.length
    }
    // GB of video data freed when process terminates
  }
}
```

### **💾 Data Import/Export & ETL**

```typescript
export class DataProcessingService {
  
  @RunInNewProcess(600000) // 10min timeout
  async importLargeCSV(csvPath: string): Promise<ImportResult> {
    // Load massive CSV file (GB of data)
    const csvContent = readFileSync(csvPath, 'utf-8')
    const rows = csvContent.split('\n')
    
    console.log(`Processing ${rows.length} rows...`)
    
    const processedData = []
    const errors = []
    
    // Memory-intensive processing of millions of rows
    for (let i = 0; i < rows.length; i++) {
      try {
        const columns = rows[i].split(',')
        const processedRow = {
          id: parseInt(columns[0]),
          name: this.cleanString(columns[1]),
          email: this.validateEmail(columns[2]),
          data: JSON.parse(columns[3] || '{}'),
          processed_at: new Date()
        }
        
        processedData.push(processedRow)
      } catch (error) {
        errors.push({ row: i, error: error.message })
      }
    }
    
    return {
      totalRows: rows.length,
      processedRows: processedData.length,
      errors: errors.length,
      data: processedData,
      errorDetails: errors
    }
    // GB of CSV data freed when process terminates
  }

  @RunInNewProcess(900000) // 15min timeout
  async generateLargeExcelReport(data: ReportData[]): Promise<Buffer> {
    // Memory-intensive Excel generation with millions of rows
    const workbook = new ExcelJS.Workbook()
    
    // Create multiple sheets with massive data
    const summarySheet = workbook.addWorksheet('Summary')
    const detailSheet = workbook.addWorksheet('Details')
    const chartsSheet = workbook.addWorksheet('Charts')
    
    // Add millions of rows (memory intensive)
    data.forEach((item, index) => {
      detailSheet.addRow([
        item.id,
        item.name,
        item.value,
        item.date,
        item.category,
        JSON.stringify(item.metadata)
      ])
    })
    
    // Generate charts and graphs (memory intensive)
    const chartData = this.generateChartData(data)
    this.addChartsToSheet(chartsSheet, chartData)
    
    // Apply styling and formatting (memory intensive)
    this.applyExcelStyling(workbook)
    
    // Convert to buffer (memory intensive)
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
    // All Excel data freed when process terminates
  }
}
```

### **🧠 Machine Learning & AI**

```typescript
export class MLService {
  
  @RunInNewProcess(1800000) // 30min timeout
  async trainModel(trainingData: TrainingDataset): Promise<TrainedModel> {
    console.log('Loading training dataset into isolated process...')
    
    // Load massive training dataset (GB of data)
    const features = this.extractFeatures(trainingData)
    const labels = this.extractLabels(trainingData)
    
    // Memory-intensive model training
    const model = this.initializeModel(features[0].length)
    
    // Training iterations (very memory intensive)
    for (let epoch = 0; epoch < 1000; epoch++) {
      // Forward pass
      const predictions = this.forwardPass(model, features)
      
      // Calculate loss
      const loss = this.calculateLoss(predictions, labels)
      
      // Backward pass
      const gradients = this.backwardPass(model, features, labels, predictions)
      
      // Update weights
      this.updateWeights(model, gradients)
      
      if (epoch % 100 === 0) {
        console.log(`Epoch ${epoch}, Loss: ${loss}`)
      }
    }
    
    // Validate model
    const validationResults = this.validateModel(model, trainingData.validationSet)
    
    return {
      model: this.serializeModel(model),
      accuracy: validationResults.accuracy,
      loss: validationResults.loss,
      trainedEpochs: 1000,
      featureCount: features[0].length
    }
    // GB of training data freed when process terminates
  }

  @RunInNewProcess(600000) // 10min timeout
  async processLargeDataset(dataset: MLDataset): Promise<ProcessedDataset> {
    // Load and process massive dataset in isolated memory
    const rawData = this.loadDataset(dataset.path)
    
    console.log(`Processing ${rawData.length} samples...`)
    
    // Memory-intensive data preprocessing
    const cleanedData = this.cleanData(rawData)
    const normalizedData = this.normalizeData(cleanedData)
    const augmentedData = this.augmentData(normalizedData)
    const encodedData = this.encodeFeatures(augmentedData)
    
    // Feature engineering (memory intensive)
    const engineeredFeatures = this.engineerFeatures(encodedData)
    
    // Split into train/test/validation
    const splits = this.splitDataset(engineeredFeatures, {
      train: 0.7,
      test: 0.2,
      validation: 0.1
    })
    
    return {
      original_size: rawData.length,
      processed_size: splits.train.length + splits.test.length + splits.validation.length,
      feature_count: engineeredFeatures[0].features.length,
      splits
    }
    // All dataset processing memory freed
  }
}
```

## Memory Safety Benefits

### **🛡️ Complete Memory Isolation**

```typescript
// Example: Processing multiple large files safely
const documentService = new DocumentService()
const mediaService = new MediaProcessingService()
const dataService = new DataProcessingService()

console.log('Main process memory before:', process.memoryUsage())

// All run in separate processes with isolated memory
const [pdfReport, processedImages, csvImport] = await Promise.all([
  documentService.generateMassivePDFReport(reportData),    // Process 1: ~2GB
  mediaService.batchProcessLargeImages(imagePaths),        // Process 2: ~3GB  
  dataService.importLargeCSV('massive-dataset.csv')       // Process 3: ~1GB
])

console.log('Main process memory after:', process.memoryUsage())
// Main process memory unchanged! 6GB was used and freed automatically
```

### **📊 Resource Management**

```bash
# Before: Memory leak disaster
Main Process Memory: 250MB → 5GB → 12GB → 💥 CRASH
Garbage Collection: Struggling, long pauses
Application Status: Unresponsive, then dead

# After: Perfect isolation
Main Process Memory: 250MB → 250MB → 250MB ✅ Stable
Child Process 1: 0MB → 2GB → 0MB ✅ Terminated
Child Process 2: 0MB → 3GB → 0MB ✅ Terminated 
Child Process 3: 0MB → 1GB → 0MB ✅ Terminated
Application Status: Always responsive ✅
```

## Why RunInNewProcess is Essential

### **🎯 Zero Memory Leaks**
- **Complete process isolation** - zero shared memory
- **Automatic cleanup** when process terminates
- **No garbage collection struggles** in main process
- **Predictable memory usage**

### **🛡️ Crash Protection**
- **Main process protected** from child process crashes
- **Out-of-memory errors** contained to child process
- **Failed operations** don't affect other operations
- **Service availability** maintained during heavy processing

### **⚡ Scalable Processing**
- **Parallel process execution** without memory conflicts
- **Resource-intensive operations** run safely
- **Memory-intensive tasks** don't block other services
- **Predictable performance** regardless of data size

### **🔧 Production Reliability**
- **Works with TypeScript** (ts-node development)
- **Works with compiled JavaScript** (production builds) 
- **IPC communication** with proper error handling
- **Process timeout management**
- **Graceful process termination**

**RunInNewProcess transforms dangerous memory operations into safe, isolated, scalable solutions that protect your application from memory-related crashes and performance degradation!** 🚀