# from langchain.document_loaders import DirectoryLoader
from langchain_community.document_loaders import Docx2txtLoader, PyMuPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
# from langchain.embeddings import OpenAIEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
# import openai 
# from dotenv import load_dotenv
import os
import shutil
import glob
from enhanced_document_loader import EnhancedDocumentLoader


CHROMA_PATH = "chroma"
DATA_PATH = "data/books"


def main():
    generate_data_store()


def generate_data_store():
    documents = load_documents()
    chunks = split_text(documents)
    save_to_chroma(chunks)


def load_documents():
    print("Loading documents with enhanced table extraction...")
    documents = []
    
    # Initialize enhanced document loader
    loader = EnhancedDocumentLoader()
    
    # Load all documents from the data directory
    for file_path in glob.glob(os.path.join(DATA_PATH, "*.*")):
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext in ['.pdf', '.docx']:
            try:
                docs = loader.load_document_with_tables(file_path)
                documents.extend(docs)
                print(f"Loaded {len(docs)} documents from {os.path.basename(file_path)}")
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
    
    print(f"Total documents loaded: {len(documents)}")
    return documents

def load_documents_basic():
    """Original document loading without table extraction"""
    documents = []
    # Load all docx and pdf files from the data directory
    for file_path in glob.glob(os.path.join(DATA_PATH, "*.*")):
        file_ext = os.path.splitext(file_path)[1].lower()
        try:
            if file_ext == '.docx':
                loader = Docx2txtLoader(file_path)
                documents.extend(loader.load())
                print(f"Loaded Word document: {os.path.basename(file_path)}")
            elif file_ext == '.pdf':
                loader = PyMuPDFLoader(file_path)
                documents.extend(loader.load())
                print(f"Loaded PDF document: {os.path.basename(file_path)}")
            else:
                print(f"Skipping unsupported file type: {os.path.basename(file_path)}")
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
    
    print(f"Total documents loaded: {len(documents)}")
    return documents


def split_text(documents: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")

    if len(chunks) > 10:
        document = chunks[10]
        print(document.page_content)
        print(document.metadata)

    return chunks


def save_to_chroma(chunks: list[Document]):
    # Use all chunks now since sentence-transformers is much faster
    print(f"Creating embeddings for {len(chunks)} chunks using sentence-transformers...")

    # Create embeddings
    # Use local model path to avoid network requests
    model_path = os.path.expanduser("~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
    embedding_function = HuggingFaceEmbeddings(model_name=model_path)
    
    try:
        # Check if database exists and is accessible
        if os.path.exists(CHROMA_PATH):
            try:
                # Test if existing database is accessible
                test_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
                test_db._collection.count()  # Test connection
                print(f"Existing database is accessible, clearing it...")
                shutil.rmtree(CHROMA_PATH)
            except Exception as e:
                print(f"Existing database is corrupted ({e}), removing it...")
                shutil.rmtree(CHROMA_PATH)
        
                # Create new database
        db = Chroma.from_documents(
            chunks, embedding_function, persist_directory=CHROMA_PATH
        )
        print(f"Created new database with {len(chunks)} chunks at {CHROMA_PATH}.")
        
        # Verify database was created successfully
        db._collection.count()
        print("✅ Database verification successful")
        
    except Exception as e:
        print(f"ChromaDB error: {e}")
        # Fallback: try creating without persist_directory
        try:
            print("Attempting fallback to in-memory database...")
            db = Chroma.from_documents(chunks, embedding_function)
            print(f"Created in-memory database with {len(chunks)} chunks.")
        except Exception as e2:
            print(f"Fallback also failed: {e2}")
            raise


if __name__ == "__main__":
    main()
