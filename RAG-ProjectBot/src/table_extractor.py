#!/usr/bin/env python3
"""
Table Extractor from Images using OCR and Computer Vision
Requirements: pip install opencv-python pytesseract pandas numpy
Install Tesseract OCR: https://github.com/tesseract-ocr/tesseract
"""

import cv2
import numpy as np
import pandas as pd
import pytesseract
from typing import List, Tuple, Optional, Union
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TableExtractor:
    def __init__(self, tesseract_path: Optional[str] = None):
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        try:
            pytesseract.get_tesseract_version()
            logger.info("Tesseract OCR initialized successfully")
        except Exception as e:
            logger.error(f"Tesseract OCR not found: {e}")
            raise
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        # Convert to grayscale and apply preprocessing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image.copy()
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        return cv2.bitwise_not(thresh)
    
    def detect_table_structure(self, image: np.ndarray) -> Tuple[np.ndarray, List, List]:
        # Detect horizontal and vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        
        horizontal_lines = cv2.dilate(cv2.morphologyEx(image, cv2.MORPH_OPEN, horizontal_kernel, iterations=2), horizontal_kernel, iterations=3)
        vertical_lines = cv2.dilate(cv2.morphologyEx(image, cv2.MORPH_OPEN, vertical_kernel, iterations=2), vertical_kernel, iterations=3)
        
        table_structure = cv2.addWeighted(horizontal_lines, 0.5, vertical_lines, 0.5, 0.0)
        
        horizontal_contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        vertical_contours, _ = cv2.findContours(vertical_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        return table_structure, horizontal_contours, vertical_contours
    
    def find_cell_boundaries(self, horizontal_contours: List, vertical_contours: List, image_shape: Tuple[int, int]) -> List[List[Tuple[int, int, int, int]]]:
        height, width = image_shape
        
        # Extract line positions
        horizontal_positions = sorted(list(set([y + h // 2 for contour in horizontal_contours for x, y, w, h in [cv2.boundingRect(contour)] if w > width * 0.5])))
        vertical_positions = sorted(list(set([x + w // 2 for contour in vertical_contours for x, y, w, h in [cv2.boundingRect(contour)] if h > height * 0.5])))
        
        # Add boundaries if missing
        if not horizontal_positions or horizontal_positions[0] > 10: horizontal_positions.insert(0, 0)
        if not horizontal_positions or horizontal_positions[-1] < height - 10: horizontal_positions.append(height)
        if not vertical_positions or vertical_positions[0] > 10: vertical_positions.insert(0, 0)
        if not vertical_positions or vertical_positions[-1] < width - 10: vertical_positions.append(width)
        
        # Create cell boundaries
        return [[(vertical_positions[j], horizontal_positions[i], vertical_positions[j + 1] - vertical_positions[j], horizontal_positions[i + 1] - horizontal_positions[i]) 
                for j in range(len(vertical_positions) - 1)] for i in range(len(horizontal_positions) - 1)]
    
    def extract_cell_text(self, image: np.ndarray, cell_coords: Tuple[int, int, int, int]) -> str:
        x, y, w, h = cell_coords
        if w < 10 or h < 10: return ""
        
        cell_region = image[y:y+h, x:x+w]
        cell_gray = cv2.cvtColor(cell_region, cv2.COLOR_BGR2GRAY) if len(cell_region.shape) == 3 else cell_region.copy()
        cell_gray = cv2.resize(cell_gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        cell_gray = cv2.GaussianBlur(cell_gray, (1, 1), 0)
        
        try:
            # Use simpler configuration without restrictive whitelist
            text = pytesseract.image_to_string(cell_gray, config='--psm 6 --oem 3')
            return text.strip().replace('\n', ' ').replace('\r', ' ')
        except Exception as e:
            logger.warning(f"OCR failed for cell {cell_coords}: {e}")
            return ""
    
    def extract_table(self, image_path: str, output_format: str = 'dataframe') -> Union[pd.DataFrame, List[List[str]]]:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        logger.info(f"Processing image: {image_path}")
        
        processed_image = self.preprocess_image(image)
        table_structure, horizontal_contours, vertical_contours = self.detect_table_structure(processed_image)
        cells = self.find_cell_boundaries(horizontal_contours, vertical_contours, image.shape[:2])
        
        if not cells:
            logger.warning("No table structure detected")
            return pd.DataFrame() if output_format == 'dataframe' else []
        
        # Extract text from cells
        table_data = [[self.extract_cell_text(image, cell_coords) for cell_coords in row] for row in cells]
        
        # Convert to desired format
        if output_format == 'dataframe':
            return pd.DataFrame(table_data[1:], columns=table_data[0]) if table_data and len(table_data) > 1 else pd.DataFrame(table_data)
        else:
            return table_data
    
    def extract_table_with_visualization(self, image_path: str, save_debug_image: bool = False) -> Tuple[Union[pd.DataFrame, List[List[str]]], np.ndarray]:
        image = cv2.imread(image_path)
        processed_image = self.preprocess_image(image)
        table_structure, horizontal_contours, vertical_contours = self.detect_table_structure(processed_image)
        
        # Create debug visualization
        debug_image = image.copy()
        cv2.drawContours(debug_image, horizontal_contours, -1, (0, 255, 0), 2)
        cv2.drawContours(debug_image, vertical_contours, -1, (255, 0, 0), 2)
        
        cells = self.find_cell_boundaries(horizontal_contours, vertical_contours, image.shape[:2])
        for row in cells:
            for x, y, w, h in row:
                cv2.rectangle(debug_image, (x, y), (x + w, y + h), (0, 0, 255), 1)
        
        table_data = self.extract_table(image_path, 'list')
        
        if save_debug_image:
            debug_path = image_path.replace('.', '_debug.')
            cv2.imwrite(debug_path, debug_image)
            logger.info(f"Debug image saved: {debug_path}")
        
        return table_data, debug_image


def main():
    extractor = TableExtractor()
    image_path = "table_image.png"
    
    try:
        table = extractor.extract_table(image_path, 'dataframe')
        print("Extracted Table:")
        print(table)
        
        if not table.empty:
            output_path = image_path.replace('.png', '_extracted.csv').replace('.jpg', '_extracted.csv')
            table.to_csv(output_path, index=False)
            print(f"\nTable saved to: {output_path}")
        
        table_data, debug_image = extractor.extract_table_with_visualization(image_path, save_debug_image=True)
        
    except Exception as e:
        logger.error(f"Error extracting table: {e}")


if __name__ == "__main__":
    main() 