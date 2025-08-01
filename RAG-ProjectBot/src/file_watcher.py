#!/usr/bin/env python3

import sys
import os
import time
import threading
import json
import pickle
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Setup paths
script_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(script_dir))
venv_path = script_dir / "venv" / "lib" / "python3.9" / "site-packages"
if venv_path.exists():
    sys.path.insert(0, str(venv_path))
os.chdir(script_dir)

from create_database import split_text, save_to_chroma
from enhanced_document_loader import EnhancedDocumentLoader
from query_data import CHROMA_PATH

# Global model initialization
model_path = os.path.expanduser("~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
from langchain_huggingface import HuggingFaceEmbeddings
embedding_function = HuggingFaceEmbeddings(model_name=model_path)

class FileHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing_files = set()
        self.processed_files = self._load_processed_files()
        print(f"📋 Already processed files: {list(self.processed_files)}")
    
    def _load_processed_files(self):
        """Load list of already processed files"""
        processed_file = Path("processed_files.pkl")
        if processed_file.exists():
            try:
                with open(processed_file, 'rb') as f:
                    return set(pickle.load(f))
            except:
                return set()
        return set()
    
    def _save_processed_files(self):
        """Save list of processed files"""
        processed_file = Path("processed_files.pkl")
        with open(processed_file, 'wb') as f:
            pickle.dump(list(self.processed_files), f)
    
    def on_created(self, event):
        if not event.is_directory and Path(event.src_path).suffix.lower() in ['.docx', '.pdf']:
            file_path = Path(event.src_path)
            if file_path.name not in self.processing_files and file_path.name not in self.processed_files:
                print(f"🔄 New file detected: {file_path.name}")
                self._process_files_background(str(file_path))
    
    def on_moved(self, event):
        # Handle file moves (like when files are moved to the directory)
        if not event.is_directory and Path(event.dest_path).suffix.lower() in ['.docx', '.pdf']:
            file_path = Path(event.dest_path)
            if file_path.name not in self.processing_files and file_path.name not in self.processed_files:
                print(f"🔄 File moved to directory: {file_path.name}")
                self._process_files_background(str(file_path))
    
    def _process_files_background(self, file_path):
        """Process a new file"""
        file_name = Path(file_path).name
        if file_name in self.processing_files:
            print(f"⏳ Already processing {file_name}, skipping...")
            return
        
        if file_name in self.processed_files:
            print(f"✅ {file_name} already processed, skipping...")
            return
        
        self.processing_files.add(file_name)
        
        try:
            print(f"⏳ Processing started for {file_name}...")
            time.sleep(3)  # Wait for file to be fully written
            
            # Check if file still exists
            if not Path(file_path).exists():
                print(f"❌ File {file_name} no longer exists, skipping...")
                return
            
            print(f"📄 Loading file: {file_name}")
            loader = EnhancedDocumentLoader()
            new_documents = loader.load_document_with_tables(str(file_path))
            
            print(f"📄 Loaded {len(new_documents)} documents from {file_name}")
            
            if not new_documents:
                print(f"⚠️ No documents loaded from {file_name}")
                return
            
            # Split the new documents
            new_chunks = split_text(new_documents)
            print(f"📄 Split into {len(new_chunks)} chunks")
            
            # Add to existing database
            print("💾 Adding to existing database...")
            try:
                save_to_chroma(new_chunks)
                print(f"✅ Successfully added {len(new_chunks)} chunks to database")
                
                # Mark as processed
                self.processed_files.add(file_name)
                self._save_processed_files()
                print(f"✅ {file_name} marked as processed")
                
            except Exception as db_error:
                print(f"❌ Error adding to database: {db_error}")
                import traceback
                traceback.print_exc()
                return
            
            print(f"✅ Processing completed for {file_name}!")
            
        except Exception as e:
            print(f"❌ Processing error for {file_name}: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.processing_files.discard(file_name)

def main():
    print("👀 Standalone File Watcher Started!")
    print(f"📁 Watching data/books for new .docx and .pdf files...")
    print(f"🗄️ Database path: {CHROMA_PATH}")
    print("⏹️  Press Ctrl+C to stop")
    print("📋 Only new files will be processed (already processed files will be skipped)")
    print()
    
    # Create event handler
    event_handler = FileHandler()
    
    # Start watching for new files
    observer = Observer()
    watch_path = Path("data/books")
    
    if not watch_path.exists():
        print(f"❌ Watch directory {watch_path} does not exist!")
        return
    
    observer.schedule(event_handler, str(watch_path), recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping file watcher...")
        observer.stop()
    observer.join()
    print("✅ File watcher stopped")

if __name__ == "__main__":
    main() 