#!/usr/bin/env python3

import os
import sys
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import fitz  # PyMuPDF
from PIL import Image
import io
import tempfile
import shutil
import re
import pandas as pd

# Setup paths
script_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(script_dir))
os.chdir(script_dir)

from langchain.schema import Document

# Import table extraction libraries
try:
    import tabula
    TABULA_AVAILABLE = True
except ImportError:
    TABULA_AVAILABLE = False

try:
    import camelot
    CAMELOT_AVAILABLE = True
except ImportError:
    CAMELOT_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedDocumentLoader:
    def __init__(self):
        """Initialize document loader with OCR-based table extraction"""
        
        logger.info("✅ Document loader initialized with OCR-based table extraction")
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """Get current usage statistics"""
        return {
            "ocr_enabled": True,
            "table_extraction": "Tesseract + Tabula/Camelot",
            "api_status": "running"
        }
    
    def load_document_with_tables(self, file_path: str) -> List[Document]:
        """Load document with enhanced extraction: text, tables, and images"""
        documents = []
        
        try:
            # Load PDF
            pdf_document = fitz.open(file_path)
            
            # Extract native tables first
            native_tables = self._extract_native_tables(file_path)
            for i, table_text in enumerate(native_tables):
                documents.append(Document(
                    page_content=table_text,
                    metadata={"source": file_path, "content_type": "native_table", "table_index": i + 1}
                ))
            
            # Process each page with enhanced image extraction
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                
                # Extract text
                text = page.get_text()
                if text.strip():
                    documents.append(Document(
                        page_content=text,
                        metadata={"source": file_path, "page": page_num + 1, "content_type": "text"}
                    ))
                
                # Enhanced image extraction - try multiple methods
                images_found = self._extract_images_enhanced(page, pdf_document, page_num, file_path)
                for img_info in images_found:
                    try:
                        # Extract all types of data from image
                        image_contents = self._extract_all_image_data(img_info)
                        for content_type, content in image_contents.items():
                            if content:
                                documents.append(Document(
                                    page_content=content,
                                    metadata={
                                        "source": file_path, 
                                        "page": page_num + 1, 
                                        "content_type": content_type,
                                        "image_index": img_info['index'],
                                        "extraction_method": img_info.get('method', 'standard')
                                    }
                                ))
                    except Exception as e:
                        logger.warning(f"Failed to process image {img_info['index']}: {e}")
            
            pdf_document.close()
            logger.info(f"✅ Loaded {len(documents)} documents from {file_path}")
            return documents
            
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {e}")
            return []
    
    def _extract_native_tables(self, file_path: str) -> List[str]:
        """Extract native tables from PDF using tabula and camelot"""
        table_texts = []
        
        try:
            # Try tabula first (good for simple tables)
            if TABULA_AVAILABLE:
                try:
                    tables = tabula.read_pdf(file_path, pages='all', multiple_tables=True)
                    for i, table in enumerate(tables):
                        if not table.empty:
                            table_text = f"\n[NATIVE PDF TABLE {i+1}]\n"
                            table_text += "=" * 50 + "\n"
                            table_text += table.to_string(index=False)
                            table_text += "\n" + "=" * 50 + "\n"
                            table_texts.append(table_text)
                            logger.info(f"Extracted native table {i+1} from PDF using tabula")
                except Exception as e:
                    logger.warning(f"Tabula extraction failed: {e}")
            
            # Try camelot for complex tables
            if CAMELOT_AVAILABLE:
                try:
                    tables = camelot.read_pdf(file_path, pages='all')
                    for i, table in enumerate(tables):
                        if table.df is not None and not table.df.empty:
                            table_text = f"\n[NATIVE PDF TABLE {i+1} - Accuracy: {table.accuracy:.1f}%]\n"
                            table_text += "=" * 50 + "\n"
                            table_text += table.df.to_string(index=False, header=False)
                            table_text += "\n" + "=" * 50 + "\n"
                            table_texts.append(table_text)
                            logger.info(f"Extracted native table {i+1} from PDF using camelot (accuracy: {table.accuracy:.1f}%)")
                except Exception as e:
                    logger.warning(f"Camelot extraction failed: {e}")
                    
        except Exception as e:
            logger.error(f"Error extracting native tables from PDF {file_path}: {e}")
        
        return table_texts
    
    def _extract_images_enhanced(self, page, pdf_document, page_num: int, file_path: str) -> List[Dict]:
        """Extract images from PDF page using multiple methods"""
        images_found = []
        
        try:
            # Method 1: Extract embedded images
            image_list = page.get_images()
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    pix = fitz.Pixmap(pdf_document, xref)
                    
                    if pix.n - pix.alpha < 4:  # GRAY or RGB
                        img_data = pix.tobytes("png")
                        img_path = self._save_temp_image(img_data, page_num, img_index)
                        
                        images_found.append({
                            'path': img_path,
                            'index': img_index + 1,
                            'page': page_num + 1,
                            'method': 'embedded_object',
                            'size': len(img_data)
                        })
                        logger.info(f"Extracted embedded image {img_index + 1} from page {page_num + 1}")
                    
                    pix = None
                except Exception as e:
                    logger.warning(f"Failed to extract embedded image {img_index}: {e}")
            
            # Method 2: Extract full page as image (for pages that are mostly images)
            page_rect = page.rect
            if page_rect.width > 0 and page_rect.height > 0:
                try:
                    # Convert page to image
                    mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
                    pix = page.get_pixmap(matrix=mat)
                    img_data = pix.tobytes("png")
                    
                    # Only save if it's a substantial image (not just text)
                    if len(img_data) > 10000:  # More than 10KB
                        img_path = self._save_temp_image(img_data, page_num, len(images_found))
                        
                        images_found.append({
                            'path': img_path,
                            'index': len(images_found) + 1,
                            'page': page_num + 1,
                            'method': 'full_page',
                            'size': len(img_data)
                        })
                        logger.info(f"Extracted full page image from page {page_num + 1}")
                    
                    pix = None
                except Exception as e:
                    logger.warning(f"Failed to extract full page image: {e}")
            
        except Exception as e:
            logger.error(f"Error extracting images from page {page_num + 1}: {e}")
        
        return images_found
    
    def _save_temp_image(self, img_data: bytes, page_num: int, img_index: int) -> str:
        """Save image data to temporary file"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
        temp_file.write(img_data)
        temp_file.close()
        return temp_file.name
    
    def _extract_all_image_data(self, image_info: Dict[str, Any]) -> Dict[str, str]:
        """Extract all types of data from image: text and tables"""
        results = {
            "image_text": "",
            "image_table": ""
        }
        
        try:
            # Pre-analyze with Tesseract
            import pytesseract
            import cv2
            
            image = cv2.imread(image_info['path'])
            if image is None:
                return results
            
            # Get text from image
            text = pytesseract.image_to_string(image)
            
            # 1. Extract text content
            if text.strip():
                results["image_text"] = self._format_text_results(text, image_info)
            
            # 2. Detect and extract tables
            table_text = self._extract_table_from_image(image_info)
            if table_text:
                results["image_table"] = table_text
                
        except Exception as e:
            logger.error(f"Image extraction failed: {e}")
        finally:
            try:
                if os.path.exists(image_info['path']):
                    os.unlink(image_info['path'])
            except:
                pass
        
        return results
    
    def _extract_table_from_image(self, image_info: Dict[str, Any]) -> str:
        """Extract table data from image using Tesseract"""
        try:
            import pytesseract
            import cv2
            
            image = cv2.imread(image_info['path'])
            if image is None:
                return ""
            
            # Get table structure using Tesseract
            table_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DATAFRAME)
            
            # Filter out empty text and organize by position
            valid_data = table_data[table_data['conf'] > 0]
            if valid_data.empty:
                return ""
            
            # Group text by lines (y-coordinate)
            lines = {}
            for _, row in valid_data.iterrows():
                y = row['top']
                text = row['text'].strip()
                if text:
                    if y not in lines:
                        lines[y] = []
                    lines[y].append(text)
            
            # Check if this looks like a table (multiple lines with similar structure)
            if len(lines) >= 2:
                # Format as table
                table_text = f"\n[IMAGE TABLE from Image {image_info['index']} on page {image_info['page']}]\n"
                table_text += "=" * 50 + "\n"
                
                for y in sorted(lines.keys()):
                    line_text = " | ".join(lines[y])
                    table_text += line_text + "\n"
                
                table_text += "=" * 50 + "\n"
                return table_text
            
            return ""
            
        except Exception as e:
            logger.warning(f"Table extraction failed: {e}")
            return ""
    
    def _format_text_results(self, text: str, image_info: Dict) -> str:
        """Format Tesseract text results"""
        return f"\n[IMAGE TEXT from Image {image_info['index']} on page {image_info['page']}]\n" + \
               "=" * 50 + "\n" + text.strip() + "\n" + "=" * 50 + "\n" 