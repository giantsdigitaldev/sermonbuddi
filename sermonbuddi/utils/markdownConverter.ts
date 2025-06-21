interface DocumentMetadata {
  title?: string;
  author?: string;
  date?: string;
  source?: string;
  type?: 'sermon' | 'study' | 'notes' | 'general';
  topics?: string[];
  scripture?: string[];
}

interface MarkdownSection {
  type: 'header' | 'paragraph' | 'list' | 'quote' | 'scripture' | 'keypoint';
  content: string;
  level?: number; // For headers
}

export class MarkdownConverter {
  
  /**
   * Convert raw extracted text to structured markdown
   */
  static async convertToMarkdown(
    rawText: string,
    metadata: DocumentMetadata = {},
    options: {
      addFrontmatter?: boolean;
      structureContent?: boolean;
      extractKeyPoints?: boolean;
      extractScriptures?: boolean;
    } = {}
  ): Promise<string> {
    try {
      console.log('📝 Converting text to markdown...');
      
      const {
        addFrontmatter = true,
        structureContent = true,
        extractKeyPoints = true,
        extractScriptures = true,
      } = options;

      let markdown = '';

      // Add frontmatter if requested
      if (addFrontmatter) {
        markdown += this.generateFrontmatter(metadata);
        markdown += '\n\n';
      }

      // Clean and process the raw text
      const cleanedText = this.cleanText(rawText);
      
      if (structureContent) {
        // Structure the content intelligently
        const sections = this.parseTextIntoSections(cleanedText);
        markdown += this.sectionsToMarkdown(sections);
      } else {
        // Simple conversion
        markdown += cleanedText;
      }

      // Extract and add key points if requested
      if (extractKeyPoints) {
        const keyPoints = this.extractKeyPoints(cleanedText);
        if (keyPoints.length > 0) {
          markdown += '\n\n## Key Points\n\n';
          keyPoints.forEach(point => {
            markdown += `- ${point}\n`;
          });
        }
      }

      // Extract and add scripture references if requested
      if (extractScriptures) {
        const scriptures = this.extractScriptureReferences(cleanedText);
        if (scriptures.length > 0) {
          markdown += '\n\n## Scripture References\n\n';
          scriptures.forEach(scripture => {
            markdown += `- ${scripture}\n`;
          });
        }
      }

      // Add metadata section for AI processing
      markdown += this.generateAIMetadataSection(rawText, metadata);

      console.log('✅ Text converted to markdown');
      return markdown;
         } catch (error) {
       console.error('❌ Markdown conversion failed:', error);
       throw new Error(`Markdown conversion failed: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

  /**
   * Generate YAML frontmatter
   */
  private static generateFrontmatter(metadata: DocumentMetadata): string {
    const frontmatter = {
      title: metadata.title || 'Untitled Document',
      author: metadata.author || '',
      date: metadata.date || new Date().toISOString().split('T')[0],
      type: metadata.type || 'general',
      topics: metadata.topics || [],
      scripture: metadata.scripture || [],
      source: metadata.source || 'document_upload',
      processed_at: new Date().toISOString(),
    };

    let yaml = '---\n';
    Object.entries(frontmatter).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          yaml += `${key}:\n`;
          value.forEach(item => yaml += `  - "${item}"\n`);
        }
      } else if (value) {
        yaml += `${key}: "${value}"\n`;
      }
    });
    yaml += '---';

    return yaml;
  }

  /**
   * Clean and normalize text
   */
  private static cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Fix common OCR errors
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/–/g, '-')
      .replace(/—/g, '--')
      // Remove page numbers and headers/footers (common patterns)
      .replace(/^Page \d+.*$/gm, '')
      .replace(/^\d+\s*$/gm, '')
      // Clean up paragraph breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Parse text into logical sections
   */
  private static parseTextIntoSections(text: string): MarkdownSection[] {
    const sections: MarkdownSection[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect headers (common patterns)
      if (this.isHeaderLine(line)) {
        sections.push({
          type: 'header',
          content: line,
          level: this.getHeaderLevel(line),
        });
      }
      // Detect scripture references
      else if (this.isScriptureReference(line)) {
        sections.push({
          type: 'scripture',
          content: line,
        });
      }
      // Detect key points (numbered lists, bullet points)
      else if (this.isKeyPoint(line)) {
        sections.push({
          type: 'keypoint',
          content: line,
        });
      }
      // Detect quotes
      else if (this.isQuote(line)) {
        sections.push({
          type: 'quote',
          content: line,
        });
      }
      // Regular paragraphs
      else {
        sections.push({
          type: 'paragraph',
          content: line,
        });
      }
    }

    return sections;
  }

  /**
   * Convert sections to markdown
   */
  private static sectionsToMarkdown(sections: MarkdownSection[]): string {
    let markdown = '';

    sections.forEach(section => {
      switch (section.type) {
        case 'header':
          const headerLevel = '#'.repeat(section.level || 2);
          markdown += `${headerLevel} ${section.content}\n\n`;
          break;
        case 'scripture':
          markdown += `> **${section.content}**\n\n`;
          break;
        case 'keypoint':
          markdown += `- ${section.content}\n`;
          break;
        case 'quote':
          markdown += `> ${section.content}\n\n`;
          break;
        case 'paragraph':
          markdown += `${section.content}\n\n`;
          break;
      }
    });

    return markdown;
  }

  /**
   * Check if a line is a header
   */
  private static isHeaderLine(line: string): boolean {
    // Common header patterns
    const headerPatterns = [
      /^[A-Z][A-Z\s]{3,}$/, // ALL CAPS headers
      /^\d+\.\s*[A-EGLMPRST][a-z]+/, // Numbered sections like "1. Introduction"
      /^(Introduction|Conclusion|Summary|Key Points|Main Points|Application|Prayer|Closing)/i,
    ];

    return headerPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Get header level based on content
   */
  private static getHeaderLevel(line: string): number {
    if (/^(Introduction|Conclusion)/i.test(line)) return 1;
    if (/^\d+\./.test(line)) return 2;
    return 3;
  }

  /**
   * Check if a line is a scripture reference
   */
  private static isScriptureReference(line: string): boolean {
    const scripturePattern = /\b\d*\s*[A-Z][a-z]+\s+\d+:\d+(-\d+)?/;
    return scripturePattern.test(line);
  }

  /**
   * Check if a line is a key point
   */
  private static isKeyPoint(line: string): boolean {
    const keyPointPatterns = [
      /^[•·▪▫◦‣⁃]\s+/,          // Bullet points
      /^[a-zA-Z]\.\s+/,          // Lettered lists (a. b. c.)
      /^\d+\.\s+/,               // Numbered lists
      /^[-*+]\s+/,               // Dash/asterisk/plus bullets
    ];

    return keyPointPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Check if a line is a quote
   */
  private static isQuote(line: string): boolean {
    return line.startsWith('"') && line.endsWith('"');
  }

  /**
   * Extract key points from text
   */
  private static extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (this.isKeyPoint(trimmed)) {
        // Clean up the key point
        const cleaned = trimmed.replace(/^[•·▪▫◦‣⁃\-*+a-zA-Z\d\.\)\s]+/, '').trim();
        if (cleaned) {
          keyPoints.push(cleaned);
        }
      }
    });

    return keyPoints;
  }

  /**
   * Extract scripture references from text
   */
  private static extractScriptureReferences(text: string): string[] {
    const scriptureRefs: string[] = [];
    const scripturePattern = /\b\d*\s*[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
    
    let match;
    while ((match = scripturePattern.exec(text)) !== null) {
      scriptureRefs.push(match[0].trim());
    }

         return Array.from(new Set(scriptureRefs)); // Remove duplicates
  }

  /**
   * Generate AI metadata section for better processing
   */
  private static generateAIMetadataSection(rawText: string, metadata: DocumentMetadata): string {
    const wordCount = rawText.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    let aiSection = '\n\n---\n\n## AI Processing Metadata\n\n';
    aiSection += `- **Word Count**: ${wordCount}\n`;
    aiSection += `- **Estimated Reading Time**: ${estimatedReadingTime} minutes\n`;
    aiSection += `- **Document Type**: ${metadata.type || 'general'}\n`;
    aiSection += `- **Processing Date**: ${new Date().toLocaleDateString()}\n`;
    
    if (metadata.topics && metadata.topics.length > 0) {
      aiSection += `- **Topics**: ${metadata.topics.join(', ')}\n`;
    }
    
    aiSection += '\n### AI Instructions\n\n';
    aiSection += 'This document has been processed and structured for AI analysis. ';
    aiSection += 'Key points and scripture references have been extracted where possible. ';
    aiSection += 'Please analyze the content for themes, insights, and actionable items.\n';

    return aiSection;
  }

  /**
   * Generate a summary of the document for AI processing
   */
  static generateDocumentSummary(markdown: string): string {
    const lines = markdown.split('\n');
    const summary = {
      headers: [] as string[],
      keyPoints: [] as string[],
      scriptures: [] as string[],
      wordCount: 0,
    };

    lines.forEach(line => {
      if (line.startsWith('#')) {
        summary.headers.push(line.replace(/^#+\s*/, ''));
      } else if (line.startsWith('- ')) {
        summary.keyPoints.push(line.replace(/^-\s*/, ''));
      } else if (line.startsWith('> **')) {
        summary.scriptures.push(line.replace(/^>\s*\*\*|\*\*$/g, ''));
      }
    });

    summary.wordCount = markdown.split(/\s+/).length;

    return `## Document Summary

**Structure**: ${summary.headers.length} sections
**Key Points**: ${summary.keyPoints.length} identified
**Scripture References**: ${summary.scriptures.length} found
**Word Count**: ${summary.wordCount}

**Main Sections**:
${summary.headers.map(h => `- ${h}`).join('\n')}

This document is ready for AI analysis and processing.`;
  }
} 