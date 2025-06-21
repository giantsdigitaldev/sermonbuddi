import { FileService } from './fileService';
import { MarkdownConverter } from './markdownConverter';
import { OCRService } from './ocrService';
import { supabase } from './supabase';

export interface ProcessedDocument {
  id: string;
  user_id: string;
  original_filename: string;
  file_path: string;
  raw_text: string;
  markdown_content: string;
  ocr_confidence?: number;
  metadata: {
    title?: string;
    author?: string;
    date?: string;
    type?: 'sermon' | 'study' | 'notes' | 'general';
    topics?: string[];
    scripture_references?: string[];
    word_count: number;
    processing_method: 'ocr' | 'text_extraction' | 'manual';
  };
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentProcessingOptions {
  title?: string;
  author?: string;
  type?: 'sermon' | 'study' | 'notes' | 'general';
  enableOCR?: boolean;
  ocrLanguage?: string;
  projectId?: string;
}

export class DocumentProcessingService {
  
  /**
   * Process a document file end-to-end
   */
  static async processDocument(
    fileUri: string,
    fileName: string,
    mimeType: string,
    userId: string,
    options: DocumentProcessingOptions = {}
  ): Promise<ProcessedDocument> {
    try {
      console.log(`📄 Starting document processing for: ${fileName}`);
      
      const {
        title = fileName.replace(/\.[^/.]+$/, ''), // Remove extension
        author = '',
        type = 'general',
        enableOCR = true,
        ocrLanguage = 'eng',
        projectId,
      } = options;

      // Create initial document record
      const documentId = await this.createDocumentRecord(
        fileName,
        mimeType,
        userId,
        { title, author, type }
      );

      try {
        // Step 1: Upload file to storage
        console.log('📤 Uploading file to storage...');
        const uploadedFile = await FileService.uploadFile(
          projectId || 'default',
          fileUri,
          fileName,
          mimeType,
          0, // File size will be calculated automatically
          `Processed document: ${title}`
        );

        if (!uploadedFile) {
          throw new Error('Failed to upload file to storage');
        }

        // Step 2: Extract text based on file type
        console.log('🔍 Extracting text from document...');
        let extractedText = '';
        let ocrConfidence = undefined;

        const result = await OCRService.processFile(
          fileUri,
          fileName,
          mimeType,
          { language: ocrLanguage }
        );

        if (typeof result === 'string') {
          extractedText = result;
        } else {
          extractedText = result.text;
          ocrConfidence = result.confidence;
        }

        if (!extractedText.trim()) {
          throw new Error('No text could be extracted from the document');
        }

        // Step 3: Convert to structured markdown
        console.log('📝 Converting to markdown...');
        const markdownContent = await MarkdownConverter.convertToMarkdown(
          extractedText,
          {
            title,
            author,
            type,
            source: 'document_upload',
          },
          {
            addFrontmatter: true,
            structureContent: true,
            extractKeyPoints: true,
            extractScriptures: true,
          }
        );

        // Step 4: Extract metadata
        const metadata = this.extractDocumentMetadata(extractedText, markdownContent);

        // Step 5: Update document record with processed data
        const processedDocument = await this.updateDocumentRecord(
          documentId,
          {
            file_path: uploadedFile.storage_path,
            raw_text: extractedText,
            markdown_content: markdownContent,
            ocr_confidence: ocrConfidence,
            metadata: {
              ...metadata,
              title,
              author,
              type,
              processing_method: mimeType.startsWith('image/') ? 'ocr' : 'text_extraction',
            },
            status: 'completed',
          }
        );

        console.log('✅ Document processing completed successfully');
        return processedDocument;

      } catch (processingError) {
        // Update document record with error
        await this.updateDocumentRecord(documentId, {
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : String(processingError),
        });
        throw processingError;
      }

    } catch (error) {
      console.error('❌ Document processing failed:', error);
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create initial document record in database
   */
  private static async createDocumentRecord(
    filename: string,
    mimeType: string,
    userId: string,
    metadata: { title: string; author: string; type: string }
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          original_filename: filename,
          mime_type: mimeType,
          user_id: userId,
          status: 'processing',
          metadata: {
            ...metadata,
            word_count: 0,
            processing_method: 'unknown',
          },
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('❌ Failed to create document record:', error);
      throw new Error('Failed to create document record in database');
    }
  }

  /**
   * Update document record with processed data
   */
  private static async updateDocumentRecord(
    documentId: string,
    updates: Partial<ProcessedDocument>
  ): Promise<ProcessedDocument> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to update document record:', error);
      throw new Error('Failed to update document record in database');
    }
  }

  /**
   * Extract metadata from processed text and markdown
   */
  private static extractDocumentMetadata(rawText: string, markdown: string) {
    const wordCount = rawText.split(/\s+/).length;
    
    // Extract topics (simple keyword extraction)
    const topics = this.extractTopics(rawText);
    
    // Extract scripture references
    const scriptureRefs = this.extractScriptureReferences(rawText);

    return {
      word_count: wordCount,
      topics,
      scripture_references: scriptureRefs,
    };
  }

  /**
   * Extract topics from text using keyword analysis
   */
  private static extractTopics(text: string): string[] {
    const commonTopics = [
      'faith', 'hope', 'love', 'grace', 'mercy', 'salvation', 'prayer', 'worship',
      'discipleship', 'ministry', 'service', 'witness', 'mission', 'fellowship',
      'forgiveness', 'redemption', 'sanctification', 'holiness', 'justice',
      'compassion', 'stewardship', 'leadership', 'community', 'family',
      'marriage', 'parenting', 'youth', 'wisdom', 'guidance', 'strength',
    ];

    const topics: string[] = [];
    const lowercaseText = text.toLowerCase();

    commonTopics.forEach(topic => {
      if (lowercaseText.includes(topic)) {
        topics.push(topic);
      }
    });

    return topics.slice(0, 10); // Limit to top 10 topics
  }

  /**
   * Extract scripture references from text
   */
  private static extractScriptureReferences(text: string): string[] {
    const scripturePattern = /\b\d*\s*[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
    const refs: string[] = [];
    
    let match;
    while ((match = scripturePattern.exec(text)) !== null) {
      refs.push(match[0].trim());
    }

    return Array.from(new Set(refs));
  }

  /**
   * Get processed document by ID
   */
  static async getProcessedDocument(documentId: string): Promise<ProcessedDocument | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Failed to get processed document:', error);
      return null;
    }
  }

  /**
   * Get all processed documents for a user
   */
  static async getUserDocuments(userId: string, limit = 50): Promise<ProcessedDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get user documents:', error);
      return [];
    }
  }

  /**
   * Delete processed document and associated files
   */
  static async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      // Get document info first
      const document = await this.getProcessedDocument(documentId);
      if (!document || document.user_id !== userId) {
        throw new Error('Document not found or access denied');
      }

      // Delete from storage if file exists
      if (document.file_path) {
        try {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([document.file_path]);
          
          if (storageError) {
            console.warn('⚠️ Failed to delete file from storage:', storageError);
          }
        } catch (storageError) {
          console.warn('⚠️ Storage deletion error:', storageError);
        }
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log('✅ Document deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Search documents by content or metadata
   */
  static async searchDocuments(
    userId: string,
    query: string,
    filters: {
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<ProcessedDocument[]> {
    try {
      let queryBuilder = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      // Add text search if supported
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `raw_text.ilike.%${query}%,markdown_content.ilike.%${query}%,original_filename.ilike.%${query}%`
        );
      }

      // Add filters
      if (filters.type) {
        queryBuilder = queryBuilder.eq('metadata->type', filters.type);
      }
      
      if (filters.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to search documents:', error);
      return [];
    }
  }

  /**
   * Generate AI-ready prompt from processed document
   */
  static generateAIPrompt(document: ProcessedDocument, customPrompt?: string): string {
    const basePrompt = customPrompt || `
Please analyze the following document and provide insights on:

1. **Main Theme**: What is the central message or theme?
2. **Key Points**: What are the most important takeaways?
3. **Scripture Context**: How do the referenced scriptures support the message?
4. **Practical Application**: What actionable insights can be applied?
5. **Discussion Questions**: What questions would help deepen understanding?
6. **Summary**: Provide a concise summary of the document.

Please structure your response clearly and provide specific examples from the text.
`;

    let prompt = basePrompt + '\n\n';
    prompt += `**Document Title**: ${document.metadata.title || 'Untitled'}\n`;
    prompt += `**Document Type**: ${document.metadata.type || 'General'}\n`;
    
    if (document.metadata.author) {
      prompt += `**Author**: ${document.metadata.author}\n`;
    }
    
    if (document.metadata.scripture_references && document.metadata.scripture_references.length > 0) {
      prompt += `**Scripture References**: ${document.metadata.scripture_references.join(', ')}\n`;
    }
    
    if (document.metadata.topics && document.metadata.topics.length > 0) {
      prompt += `**Topics**: ${document.metadata.topics.join(', ')}\n`;
    }
    
    prompt += `**Word Count**: ${document.metadata.word_count}\n\n`;
    prompt += '**Document Content**:\n\n';
    prompt += document.markdown_content;

    return prompt;
  }
} 