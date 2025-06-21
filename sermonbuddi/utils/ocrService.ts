import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { createWorker } from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

interface ProcessingOptions {
  language?: string;
  imageEnhancement?: boolean;
  pageSegMode?: number;
  ocrEngineMode?: number;
}

export class OCRService {
  private static tesseractWorker: any = null;

  /**
   * Initialize Tesseract worker
   */
  private static async initializeTesseract(language: string = 'eng'): Promise<void> {
    if (this.tesseractWorker) {
      return;
    }

    try {
      console.log('🔍 Initializing Tesseract OCR worker...');
      this.tesseractWorker = await createWorker();
      
      await this.tesseractWorker.loadLanguage(language);
      await this.tesseractWorker.initialize(language);
      
      console.log('✅ Tesseract OCR worker initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract:', error);
      throw new Error('Failed to initialize OCR engine');
    }
  }

  /**
   * Clean up Tesseract worker
   */
  static async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      console.log('🧹 Tesseract worker cleaned up');
    }
  }

  /**
   * Enhance image for better OCR recognition
   */
  private static async enhanceImageForOCR(imageUri: string): Promise<string> {
    try {
      console.log('🖼️ Enhancing image for OCR...');
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
                 [
           { resize: { width: 2048 } }, // Increase resolution for better OCR
         ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.PNG, // PNG for better OCR
        }
      );

      console.log('✅ Image enhanced for OCR');
      return manipulatedImage.uri;
    } catch (error) {
      console.error('❌ Failed to enhance image:', error);
      return imageUri; // Return original if enhancement fails
    }
  }

  /**
   * Extract text from image using OCR
   */
  static async extractTextFromImage(
    imageUri: string, 
    options: ProcessingOptions = {}
  ): Promise<OCRResult> {
    try {
      const {
        language = 'eng',
        imageEnhancement = true,
        pageSegMode = 6, // Uniform block of text
        ocrEngineMode = 3, // Default engine mode
      } = options;

      console.log('🔍 Starting OCR text extraction from image...');

      // Initialize Tesseract if not already done
      await this.initializeTesseract(language);

      // Enhance image if requested
      let processedImageUri = imageUri;
      if (imageEnhancement) {
        processedImageUri = await this.enhanceImageForOCR(imageUri);
      }

      // Configure Tesseract parameters
      await this.tesseractWorker.setParameters({
        tessedit_pageseg_mode: pageSegMode,
        tessedit_ocr_engine_mode: ocrEngineMode,
      });

      // Perform OCR
      const { data } = await this.tesseractWorker.recognize(processedImageUri);
      
      console.log(`✅ OCR completed with ${data.confidence}% confidence`);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence,
        words: data.words?.map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
      };
         } catch (error) {
       console.error('❌ OCR extraction failed:', error);
       throw new Error(`OCR failed: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * Extract text from PDF (first convert to images, then OCR)
   */
  static async extractTextFromPDF(
    pdfUri: string,
    options: ProcessingOptions = {}
  ): Promise<OCRResult[]> {
    try {
      console.log('📄 Starting PDF text extraction...');
      
      // For now, we'll focus on image-based OCR
      // PDF text extraction would require additional libraries like pdf-parse
      throw new Error('PDF OCR not yet implemented. Please upload images or use document picker for text files.');
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract text from document file (TXT, DOC, etc.)
   */
  static async extractTextFromDocument(fileUri: string, mimeType: string): Promise<string> {
    try {
      console.log('📄 Extracting text from document...');

      if (mimeType === 'text/plain') {
        // Handle plain text files
        const content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return content;
      }

      // For other document types, we'd need additional parsing
      // For now, return a message indicating the limitation
      throw new Error(`Document type ${mimeType} requires server-side processing. Please upload plain text files or images.`);
    } catch (error) {
      console.error('❌ Document extraction failed:', error);
      throw error;
    }
  }

  /**
   * Process any file and extract text
   */
  static async processFile(
    fileUri: string,
    fileName: string,
    mimeType: string,
    options: ProcessingOptions = {}
  ): Promise<OCRResult | string> {
    try {
      console.log(`📁 Processing file: ${fileName} (${mimeType})`);

      // Determine file type and process accordingly
      if (mimeType.startsWith('image/')) {
        // Image file - use OCR
        return await this.extractTextFromImage(fileUri, options);
      } else if (mimeType === 'application/pdf') {
        // PDF file - convert to images and OCR
        const results = await this.extractTextFromPDF(fileUri, options);
        // Combine all pages
        return {
          text: results.map(r => r.text).join('\n\n'),
          confidence: results.reduce((avg, r) => avg + r.confidence, 0) / results.length,
        };
      } else if (mimeType.startsWith('text/') || 
                 mimeType === 'application/msword' ||
                 mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Text or document file
        return await this.extractTextFromDocument(fileUri, mimeType);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('❌ File processing failed:', error);
      throw error;
    }
  }

  /**
   * Get supported file types
   */
  static getSupportedFileTypes(): string[] {
    return [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
  }
} 