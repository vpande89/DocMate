#!/usr/bin/env python3

import os
import sys
import time
import threading
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

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
from create_database import split_text, save_to_chroma
from enhanced_document_loader import EnhancedDocumentLoader

class FileHandler(FileSystemEventHandler):
    def __init__(self):
        self.loader = EnhancedDocumentLoader()
    
    def on_created(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in ['.docx', '.pdf']:
            print(f"\n🔄 New file detected: {Path(event.src_path).name}")
            self.ingest_files()
    
    def on_modified(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in ['.docx', '.pdf']:
            print(f"\n🔄 File modified: {Path(event.src_path).name}")
            self.ingest_files()
    
    def ingest_files(self):
        try:
            time.sleep(1)  # Wait for file to be fully written
            
            # Use enhanced document loader
            documents = []
            for file_path in Path("data/books").glob("*.pdf"):
                try:
                    docs = self.loader.load_document_with_tables(str(file_path))
                    documents.extend(docs)
                    print(f"✅ Loaded {len(docs)} documents from {file_path.name}")
                except Exception as e:
                    print(f"❌ Error loading {file_path.name}: {e}")
            
            for file_path in Path("data/books").glob("*.docx"):
                try:
                    docs = self.loader.load_document_with_tables(str(file_path))
                    documents.extend(docs)
                    print(f"✅ Loaded {len(docs)} documents from {file_path.name}")
                except Exception as e:
                    print(f"❌ Error loading {file_path.name}: {e}")
            
            if documents:
                chunks = split_text(documents)
                save_to_chroma(chunks)
                print("✅ Database updated with new content")
            else:
                print("⚠️ No documents found to process")
                
        except Exception as e:
            print(f"❌ Error updating database: {e}")

def start_file_watcher():
    """Start file watcher in background"""
    event_handler = FileHandler()
    observer = Observer()
    observer.schedule(event_handler, "data/books", recursive=False)
    observer.start()
    return observer

def main():
    # Setup
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2"))
    model = ChatOllama(model="llama3.2:3b")
    
    # Start file watcher in background
    print("🔄 Starting file watcher...")
    observer = start_file_watcher()
    
    print("🤖 RAG Chatbot with OCR Table Analysis - Ask questions!")
    print("📁 File watcher is active - new files will be automatically ingested")
    print("📊 Enhanced table extraction with OCR and Tesseract")
    print("Type 'quit' to exit\n")
    
    while True:
        question = input("❓ Question: ").strip()
        
        if question.lower() in ['quit', 'exit', 'q']:
            print("👋 Goodbye!")
            observer.stop()
            observer.join()
            break
            
        if not question:
            continue
            
        # Search and answer
        results = db.similarity_search_with_relevance_scores(question, k=5)
        if not results:
            print("❌ No relevant information found.\n")
            continue
            
        context = "\n\n".join([doc.page_content for doc, _ in results])
        prompt = PROMPT_TEMPLATE.format(context=context, question=question)
        
        try:
            response = model.predict(prompt)
            print(f"🤖 {response}\n")
        except Exception as e:
            print(f"❌ Error: {e}\n")

if __name__ == "__main__":
    main() 