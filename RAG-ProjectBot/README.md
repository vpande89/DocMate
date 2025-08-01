# Table Extractor from Images

A Python script that extracts tables from images (PNG, JPG, etc.) using OCR and computer vision techniques. The script uses OpenCV for image processing and table detection, Tesseract OCR for text extraction, and returns structured data as pandas DataFrames or lists.

## Features

- **Table Detection**: Automatically detects table structures using horizontal and vertical line detection
- **OCR Text Extraction**: Uses Tesseract OCR to extract text from individual cells
- **Multiple Output Formats**: Returns data as pandas DataFrame or list of lists
- **Debug Visualization**: Optional debug images showing detected table structure
- **Batch Processing**: Process multiple images at once
- **Robust Preprocessing**: Handles various image qualities and formats

## Requirements

### Python Dependencies
```bash
pip install -r requirements.txt
```

### System Dependencies

#### Tesseract OCR
You need to install Tesseract OCR on your system:

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

**CentOS/RHEL:**
```bash
sudo yum install tesseract
```

## Installation

1. Clone or download the script files
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install Tesseract OCR (see above)
4. Verify installation:
   ```bash
   python table_extractor.py
   ```

## Usage

### Basic Usage

```python
from table_extractor import TableExtractor

# Initialize extractor
extractor = TableExtractor()

# Extract table from image
table = extractor.extract_table("table_image.png", 'dataframe')
print(table)

# Save to CSV
table.to_csv("extracted_table.csv", index=False)
```

### Advanced Usage

```python
# Extract with debug visualization
table_data, debug_image = extractor.extract_table_with_visualization(
    "table_image.png", save_debug_image=True
)

# Custom Tesseract path
extractor = TableExtractor(tesseract_path="/usr/local/bin/tesseract")

# Extract as list instead of DataFrame
table_list = extractor.extract_table("table_image.png", 'list')
```

### Command Line Usage

```bash
# Basic extraction
python table_extractor.py

# Run examples
python example_usage.py
```

## How It Works

1. **Image Preprocessing**: Converts to grayscale, applies blur and thresholding
2. **Table Structure Detection**: Uses morphological operations to detect horizontal and vertical lines
3. **Cell Boundary Detection**: Finds intersections of lines to determine cell boundaries
4. **OCR Text Extraction**: Applies Tesseract OCR to each cell region
5. **Data Structuring**: Organizes extracted text into rows and columns

## Supported Image Types

- PNG
- JPG/JPEG
- BMP
- TIFF
- Other formats supported by OpenCV

## Output Formats

### DataFrame Output
```python
# Returns pandas DataFrame with headers from first row
table_df = extractor.extract_table("image.png", 'dataframe')
```

### List Output
```python
# Returns list of lists (raw data)
table_list = extractor.extract_table("image.png", 'list')
```

## Debug Features

The script includes visualization features to help debug table detection:

```python
# Save debug image showing detected lines and cells
table_data, debug_image = extractor.extract_table_with_visualization(
    "image.png", save_debug_image=True
)
```

Debug images show:
- Green lines: Detected horizontal table lines
- Blue lines: Detected vertical table lines  
- Red rectangles: Detected cell boundaries

## Troubleshooting

### Common Issues

1. **Tesseract not found**
   ```
   Error: Tesseract OCR not found
   ```
   Solution: Install Tesseract OCR or specify the correct path

2. **No table structure detected**
   ```
   Warning: No table structure detected
   ```
   Solution: Check if the image has clear table lines, try different preprocessing

3. **Poor OCR accuracy**
   - Ensure image quality is good (300+ DPI)
   - Check if text is clearly readable
   - Try different preprocessing parameters

### Performance Tips

- Use high-quality images (300+ DPI)
- Ensure good contrast between text and background
- Clear table lines improve detection accuracy
- For large images, consider resizing before processing

## Examples

See `example_usage.py` for comprehensive usage examples including:
- Basic table extraction
- Visualization and debugging
- Batch processing
- Custom Tesseract configuration

## Limitations

- Works best with clear table lines
- Requires good image quality for accurate OCR
- May struggle with complex table layouts
- Performance depends on image size and complexity

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License. 