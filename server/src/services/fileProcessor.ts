import { Storage } from '@google-cloud/storage';
import { createWorker, Worker } from 'tesseract.js';
import { fromBuffer as pdfFromBuffer, FromBufferResult } from 'pdf2pic';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import prisma from '../lib/prisma';

interface ProcessResult {
  insights: unknown;
  text: string;
  metadata: Record<string, unknown>;
}

export class FileProcessor {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
  }

  async processFile(fileId: string): Promise<void> {
    const file = await prisma.projectFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const startTime = Date.now();

    try {
      await prisma.fileAnalysis.upsert({
        where: { fileId },
        create: {
          fileId,
          status: 'processing',
        },
        update: {
          status: 'processing',
        }
      });

      let insights: unknown = {};
      let extractedText = '';
      let metadata: Record<string, unknown> = {};

      switch (file.mimeType.split('/')[0]) {
        case 'image': {
          const imageResult = await this.processImage(file.url);
          insights = imageResult.insights;
          extractedText = imageResult.text;
          metadata = imageResult.metadata;
          break;
        }

        case 'application': {
          if (file.mimeType === 'application/pdf') {
            const pdfResult = await this.processPDF(file.url);
            insights = pdfResult.insights;
            extractedText = pdfResult.text;
            metadata = pdfResult.metadata;
          }
          break;
        }

        case 'video': {
          const videoResult = await this.processVideo(file.url);
          insights = videoResult.insights;
          extractedText = videoResult.text;
          metadata = videoResult.metadata;
          break;
        }

        default:
          break;
      }

      const processingTime = (Date.now() - startTime) / 1000;

      await prisma.fileAnalysis.update({
        where: { fileId },
        data: {
          status: 'completed',
          contentType: file.mimeType,
          insights,
          extractedText,
          metadata,
          processingTime
        }
      });

    } catch (error) {
      console.error(`Error processing file ${fileId}:`, error);
      
      await prisma.fileAnalysis.update({
        where: { fileId },
        data: {
          status: 'failed',
          processingTime: (Date.now() - startTime) / 1000
        }
      });

      throw error;
    }
  }

  private async processImage(url: string): Promise<ProcessResult> {
    const imageBuffer = await this.downloadFile(url);
    
    // Generate thumbnail for potential use
    await sharp(imageBuffer)
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const worker = await this.createOcrWorker();
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const insights = await this.analyzeImageContent(imageBuffer, text);
    const metadata = await sharp(imageBuffer).metadata();

    return {
      insights,
      text: text.trim(),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha
      }
    };
  }

  private async processPDF(url: string): Promise<ProcessResult> {
    const pdfBuffer = await this.downloadFile(url);
    
    const converter: FromBufferResult = pdfFromBuffer(pdfBuffer, {
      density: 200,
      saveFilename: 'untitled',
      savePath: '/tmp',
      format: 'png',
      width: 2000,
      height: 2000
    });

    const images = await converter.bulk(-1);

    let fullText = '';
    const insights: unknown[] = [];

    for (const image of images) {
      const worker = await this.createOcrWorker();
      const { data: { text } } = await worker.recognize(image.path);
      await worker.terminate();
      
      fullText += `${text}\n`;
      
      const pageInsights = await this.analyzeTextContent(text);
      insights.push(...pageInsights);
    }

    return {
      insights: this.consolidateInsights(insights),
      text: fullText.trim(),
      metadata: {
        pages: images.length,
        format: 'pdf'
      }
    };
  }

  private async processVideo(url: string): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const insights: unknown[] = [];
      let metadata: Record<string, unknown> = {};

      ffmpeg(url)
        .screenshots({
          count: 5,
          folder: '/tmp',
          filename: 'screenshot-%i.png'
        })
        .on('end', async () => {
          try {
            for (let i = 1; i <= 5; i++) {
              const screenshotPath = `/tmp/screenshot-${i}.png`;
              const screenshotBuffer = readFileSync(screenshotPath);

              const worker = await this.createOcrWorker();
              const { data: { text } } = await worker.recognize(screenshotBuffer);
              await worker.terminate();
              
              if (text.trim()) {
                const textInsights = await this.analyzeTextContent(text);
                insights.push(...textInsights);
              }
            }

            resolve({
              insights: this.consolidateInsights(insights),
              text: '',
              metadata
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject)
        .ffprobe((err, data) => {
          if (!err && data) {
            metadata = {
              duration: data.format?.duration,
              width: data.streams?.[0]?.width,
              height: data.streams?.[0]?.height,
              format: data.format?.format_name
            };
          }
        });
    });
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from ${url}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private async analyzeImageContent(imageBuffer: Buffer, text: string): Promise<unknown[]> {
    const insights: unknown[] = [];
    const normalizedText = text.toLowerCase();
    
    if (normalizedText.includes('dashboard') || normalizedText.includes('analytics')) {
      insights.push({
        type: 'metric',
        confidence: 0.8,
        content: 'Analytics dashboard detected',
        keywords: ['dashboard', 'analytics', 'metrics']
      });
    }
    
    if (normalizedText.includes('before') || normalizedText.includes('after')) {
      insights.push({
        type: 'comparison',
        confidence: 0.9,
        content: 'Before/after comparison detected',
        keywords: ['before', 'after', 'comparison']
      });
    }

    const colorAnalysis = await this.analyzeImageColors(imageBuffer);
    if (colorAnalysis.dominantColors.length > 0) {
      insights.push({
        type: 'design',
        confidence: 0.7,
        content: 'Color palette analysis',
        colors: colorAnalysis.dominantColors
      });
    }

    return insights;
  }

  private async analyzeTextContent(text: string): Promise<unknown[]> {
    const insights: unknown[] = [];
    const normalized = text.toLowerCase();
    
    const problemKeywords = ['problem', 'challenge', 'issue', 'pain point', 'difficulty'];
    const solutionKeywords = ['solution', 'approach', 'strategy', 'implementation'];
    const impactKeywords = ['result', 'improvement', 'increase', 'decrease', 'success'];

    if (problemKeywords.some(keyword => normalized.includes(keyword))) {
      insights.push({
        type: 'problem',
        confidence: 0.8,
        content: this.extractSentencesContaining(text, problemKeywords),
        keywords: problemKeywords
      });
    }

    if (solutionKeywords.some(keyword => normalized.includes(keyword))) {
      insights.push({
        type: 'solution',
        confidence: 0.8,
        content: this.extractSentencesContaining(text, solutionKeywords),
        keywords: solutionKeywords
      });
    }

    if (impactKeywords.some(keyword => normalized.includes(keyword))) {
      insights.push({
        type: 'impact',
        confidence: 0.8,
        content: this.extractSentencesContaining(text, impactKeywords),
        keywords: impactKeywords
      });
    }

    const metricPattern = /(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*)/g;
    const metrics = text.match(metricPattern);
    if (metrics && metrics.length > 0) {
      insights.push({
        type: 'metric',
        confidence: 0.9,
        content: 'Performance metrics detected',
        metrics: metrics
      });
    }

    return insights;
  }

  private extractSentencesContaining(text: string, keywords: string[]): string {
    const sentences = text.split(/[.!?]+/);
    return sentences
      .filter(sentence => 
        keywords.some(keyword => 
          sentence.toLowerCase().includes(keyword.toLowerCase())
        )
      )
      .join('. ')
      .trim();
  }

  private async analyzeImageColors(imageBuffer: Buffer): Promise<{ dominantColors: string[] }> {
    const stats = await sharp(imageBuffer).stats();
    const dominant = stats.dominant;
    if (!dominant) {
      return { dominantColors: [] };
    }

    return {
      dominantColors: [
        `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`
      ]
    };
  }

  private consolidateInsights(insights: unknown[]): unknown[] {
    const grouped = new Map<string, any>();
    
    for (const insight of insights as Array<Record<string, any>>) {
      const type = insight.type ?? 'general';
      const content = typeof insight.content === 'string' ? insight.content : JSON.stringify(insight.content ?? '');
      const key = `${type}-${content.substring(0, 50)}`;
      if (!grouped.has(key)) {
        grouped.set(key, insight);
      } else {
        const existing = grouped.get(key);
        existing.confidence = Math.max(existing.confidence ?? 0, insight.confidence ?? 0);
      }
    }
    
    return Array.from(grouped.values());
  }

  private async createOcrWorker(): Promise<Worker> {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    return worker;
  }
}
