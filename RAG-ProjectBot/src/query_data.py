import argparse
import os
# from dataclasses import dataclass
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain.prompts import ChatPromptTemplate

CHROMA_PATH = "chroma"

PROMPT_TEMPLATE = """


###ROLE: 
You are an AI assistant specialized in understanding the Project documents and analyzing business requirements documents, technical specifications, and user access management systems. You provide clear, accurate, and actionable insights based on the provided context.

###TASK:
Analyze the given context and answer the user's question comprehensively. Extract relevant information, provide structured responses, and ensure all information is directly supported by the provided context.
Provide answers based on the user's question by understanding their point of view.

###OUTPUT: 
Provide structured responses with bullet points or numbered lists for better readability.

###GUARDRAILS: 
1. Only use information from the provided context. Do not make assumptions or add external knowledge.
2. Give the complete answer to the question. Do not leave out any information.
3. If the question is not related to the context, say "I'm sorry, I don't have information on that topic."
4. If the question is not clear, ask for more information.
5. Expect the user to be new to the project and provide the complete answer to the question.

Context:
{context}

---

Answer the question based on the above context: {question}
"""

def filter_low_quality_content(results, min_relevance=0.1, min_length=20):
    """Filter out low-quality table/image extractions and low-relevance results"""
    filtered_results = []
    
    for doc, score in results:
        # Skip low relevance scores
        if score < min_relevance:
            continue
            
        # Skip very short content (likely incomplete extractions)
        if len(doc.page_content.strip()) < min_length:
            continue
            
        # Skip table/image extractions with low-quality content
        content = doc.page_content.lower()
        if any(indicator in content for indicator in [
            '[table from image',
            '[image',
            '==================================================',
            '---        ea      laud',  # Example of garbled OCR
            '~ > -',  # Example of garbled OCR
        ]):
            continue
            
        # Skip content that's mostly special characters or formatting
        meaningful_chars = sum(1 for c in doc.page_content if c.isalnum() or c.isspace())
        if meaningful_chars / len(doc.page_content) < 0.3:
            continue
            
        filtered_results.append((doc, score))
    
    return filtered_results

def main():
    # Create CLI.
    parser = argparse.ArgumentParser()
    parser.add_argument("query_text", type=str, help="The query text.")
    args = parser.parse_args()
    query_text = args.query_text

    # Prepare the DB.
    # Use local model path to avoid network requests
    model_path = os.path.expanduser("~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
    embedding_function = HuggingFaceEmbeddings(model_name=model_path)
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    # Search the DB with more results to filter from
    raw_results = db.similarity_search_with_relevance_scores(query_text, k=15)
    print(f"Found {len(raw_results)} raw results")
    
    # Filter out low-quality content
    results = filter_low_quality_content(raw_results, min_relevance=0.1, min_length=20)
    print(f"After filtering: {len(results)} quality results")
    
    for i, (doc, score) in enumerate(results[:5]):  # Show top 5 filtered results
        print(f"Result {i+1}: Score {score:.3f}")
        print(f"Content preview: {doc.page_content[:100]}...")
    
    if len(results) == 0:
        print(f"Unable to find matching results after filtering.")
        return
    
    # Use higher threshold for filtered results
    if results[0][1] < 0.2:
        print(f"Best match has low relevance score: {results[0][1]:.3f}")
        print("Proceeding anyway...")

    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results[:5]])  # Use top 5 filtered results
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    print(prompt)

    model = ChatOllama(model="llama3.2:3b")
    response_text = model.predict(prompt)

    sources = [doc.metadata.get("source", None) for doc, _score in results[:5]]
    formatted_response = f"Response: {response_text}\nSources: {sources}"
    print(formatted_response)


if __name__ == "__main__":
    main()
