#!/usr/bin/env python3

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Add current directory to path
script_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(script_dir))

# Add venv to path
venv_path = script_dir / "venv" / "lib" / "python3.9" / "site-packages"
if venv_path.exists():
    sys.path.insert(0, str(venv_path))

# Change to script directory
os.chdir(script_dir)

from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
from query_data import PROMPT_TEMPLATE, CHROMA_PATH

# Initialize FastAPI app
app = FastAPI(title="RAG Chatbot API", description="API for querying documents using RAG")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend (Vite default port)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File upload settings
UPLOAD_DIR = Path("data/books")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize RAG components
db = None
model = ChatOllama(model="llama3.2:3b")

# Table extraction is handled by EnhancedDocumentLoader
print("✅ Table extraction using Tesseract + Tabula/Camelot")

def initialize_db():
    global db
    try:
        if os.path.exists(CHROMA_PATH):
            # Use local model path to avoid network requests
            model_path = os.path.expanduser("~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
            embedding_function = HuggingFaceEmbeddings(model_name=model_path)
            db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
            print("✅ ChromaDB initialized successfully")
        else:
            print("⚠️ ChromaDB database not found")
            db = None
    except Exception as e:
        print(f"❌ ChromaDB initialization failed: {e}")
        db = None

# Initialize database
initialize_db()

# Request model
class QueryRequest(BaseModel):
    question: str

# Response model
class QueryResponse(BaseModel):
    response: str

# File response model
class FileResponse(BaseModel):
    filename: str
    size: int
    uploaded_at: float

def get_rag_response(question: str) -> str:
    """Get RAG response for a given question"""
    try:
        if db is None:
            return "Database is not available. Please try again later."
        
        # Search the database with proper error handling
        try:
            results = db.similarity_search_with_relevance_scores(question, k=5)
        except Exception as search_error:
            print(f"Search error: {search_error}")
            return f"Error searching database: {str(search_error)}"
        
        if not results:
            return "I'm sorry, I don't have relevant information to answer that question."
        
        # Prepare context
        try:
            context = "\n\n".join([doc.page_content for doc, _ in results])
            prompt = PROMPT_TEMPLATE.format(context=context, question=question)
            
            response = model.predict(prompt)
            return response
        
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"
            
    except Exception as e:
        print(f"Error in get_rag_response: {e}")
        return f"Error processing question: {str(e)}"

@app.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    """Query endpoint for RAG chatbot"""
    try:
        # Reinitialize database if needed
        if db is None:
            initialize_db()
            # If still None, try to recreate database from existing files
            if db is None:
                try:
                    from create_database import load_documents, split_text, save_to_chroma
                    print("🔄 Recreating database from existing files...")
                    documents = load_documents()
                    chunks = split_text(documents)
                    save_to_chroma(chunks)
                    initialize_db()  # Try to initialize again
                except Exception as e:
                    return QueryResponse(response=f"Database unavailable: {str(e)}")
        
        response = get_rag_response(request.question)
        return QueryResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the data/books directory"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.docx', '.pdf')):
            raise HTTPException(status_code=400, detail="Only .docx and .pdf files are allowed")
        
        # Create safe filename
        safe_filename = file.filename.replace(" ", "_")
        file_path = UPLOAD_DIR / safe_filename
        
        # Check if file already exists
        if file_path.exists():
            raise HTTPException(status_code=409, detail="File already exists")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "message": "File uploaded successfully",
            "filename": safe_filename,
            "size": len(content)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/process-document")
async def process_document_with_tables(file: UploadFile = File(...)):
    """Upload and process a document with table extraction from images"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.docx', '.pdf')):
            raise HTTPException(status_code=400, detail="Only .docx and .pdf files are allowed")
        
        # Create safe filename
        safe_filename = file.filename.replace(" ", "_")
        file_path = UPLOAD_DIR / safe_filename
        
        # Check if file already exists
        if file_path.exists():
            raise HTTPException(status_code=409, detail="File already exists")
        
        # Save the file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Process the document with table extraction
        try:
            from enhanced_document_loader import EnhancedDocumentLoader
            # Initialize document loader
            loader = EnhancedDocumentLoader()
            documents = loader.load_document_with_tables(str(file_path))
            
            # Split documents into chunks
            chunks = split_text(documents)
            
            # Save to database
            save_to_chroma(chunks)
            
            # Count different types of content
            text_count = sum(1 for doc in documents if doc.metadata.get('content_type') == 'text')
            native_table_count = sum(1 for doc in documents if doc.metadata.get('content_type') == 'native_table')
            image_text_count = sum(1 for doc in documents if doc.metadata.get('content_type') == 'image_text')
            image_table_count = sum(1 for doc in documents if doc.metadata.get('content_type') == 'image_table')
            
            # Get usage statistics
            usage_stats = loader.get_usage_stats()
            
            return {
                "message": "Document processed successfully with enhanced extraction",
                "filename": safe_filename,
                "size": len(content),
                "total_documents": len(documents),
                "text_extractions": text_count,
                "native_tables": native_table_count,
                "image_text_extractions": image_text_count,
                "image_table_extractions": image_table_count,
                "chunks_added": len(chunks),
                "ocr_enabled": True,
                "usage_stats": usage_stats
            }
            
        except Exception as e:
            # If table extraction fails, still save the file
            return {
                "message": "File uploaded but table extraction failed",
                "filename": safe_filename,
                "size": len(content),
                "error": str(e)
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/files", response_model=List[FileResponse])
async def list_files():
    """List all uploaded files"""
    try:
        files = []
        for file_path in UPLOAD_DIR.glob("*.*"):
            if file_path.suffix.lower() in ['.docx', '.pdf']:
                stat = file_path.stat()
                files.append(FileResponse(
                    filename=file_path.name,
                    size=stat.st_size,
                    uploaded_at=file_path.stat().st_mtime
                ))
        
        # Sort by upload time (newest first)
        files.sort(key=lambda x: x.uploaded_at, reverse=True)
        return files
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "RAG Chatbot API is running"}

@app.get("/usage-stats")
async def get_usage_stats():
    """Get usage statistics for API calls"""
    try:
        return {
            "success": True,
            "ocr_enabled": True,
            "api_status": "running"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 