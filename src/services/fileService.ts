import multer from 'multer';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { fileTypeFromBuffer } from 'file-type';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, and TXT files are allowed.'));
    }
  }
});

export class FileService {
  async extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Detect file type from buffer
      const fileType = await fileTypeFromBuffer(buffer);
      const ext = path.extname(filename).toLowerCase();
      
      // Extract text based on file type
      if (ext === '.pdf' || fileType?.mime === 'application/pdf') {
        return await this.extractFromPDF(buffer);
      } else if (ext === '.docx' || fileType?.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractFromDocx(buffer);
      } else if (ext === '.xlsx' || ext === '.xls' || fileType?.mime?.includes('spreadsheet')) {
        return await this.extractFromExcel(buffer);
      } else if (ext === '.txt') {
        return buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from file: ${error}`);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  private async extractFromExcel(buffer: Buffer): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let text = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      });
      
      return text;
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Failed to extract text from Excel file');
    }
  }

  async validateFile(file: Express.Multer.File): Promise<{ isValid: boolean; error?: string }> {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'File size exceeds 50MB limit' };
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: 'Invalid file type. Only PDF, DOCX, XLSX, and TXT files are allowed.' 
      };
    }

    return { isValid: true };
  }

  getFileInfo(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase()
    };
  }
}

export default new FileService();