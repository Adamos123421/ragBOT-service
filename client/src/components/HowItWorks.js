import React from 'react';
import { Bot, FileText, Search, MessageSquare, ArrowLeft, Sparkles, Database, Globe } from 'lucide-react';

const HowItWorks = ({ onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="w-12 h-12 text-chatgpt-green mr-3" />
            <h1 className="text-4xl font-bold text-white">RAG System Architecture</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            A technical deep-dive into Retrieval-Augmented Generation implementation
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-chatgpt-green hover:text-chatgpt-green/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Chat</span>
          </button>
        </div>

                 {/* RAG Process Flow */}
         <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border mb-8">
           <h3 className="text-lg font-semibold text-chatgpt-text mb-4 flex items-center">
             <Search className="w-5 h-5 text-chatgpt-green mr-2" />
             RAG Process Flow
           </h3>
           <div className="grid md:grid-cols-4 gap-6 text-sm text-gray-300">
             <div className="text-center">
               <div className="bg-chatgpt-green/20 p-3 rounded-lg mb-3">
                 <FileText className="w-8 h-8 text-chatgpt-green mx-auto" />
               </div>
               <h4 className="font-semibold text-chatgpt-text mb-2">1. Document Ingestion</h4>
               <p>PDFs from Google Drive are processed using pdf-parse library, extracting text content and metadata</p>
             </div>
             <div className="text-center">
               <div className="bg-chatgpt-green/20 p-3 rounded-lg mb-3">
                 <Database className="w-8 h-8 text-chatgpt-green mx-auto" />
               </div>
               <h4 className="font-semibold text-chatgpt-text mb-2">2. Chunking & Embedding</h4>
               <p>Text is split into 1000-character chunks, then converted to 1536-dimensional vectors using OpenAI's text-embedding-ada-002</p>
             </div>
             <div className="text-center">
               <div className="bg-chatgpt-green/20 p-3 rounded-lg mb-3">
                 <Search className="w-8 h-8 text-chatgpt-green mx-auto" />
               </div>
               <h4 className="font-semibold text-chatgpt-text mb-2">3. Vector Search</h4>
               <p>User queries are embedded and compared against stored vectors using cosine similarity in Pinecone</p>
             </div>
             <div className="text-center">
               <div className="bg-chatgpt-green/20 p-3 rounded-lg mb-3">
                 <MessageSquare className="w-8 h-8 text-chatgpt-green mx-auto" />
               </div>
               <h4 className="font-semibold text-chatgpt-text mb-2">4. Context Generation</h4>
               <p>Top 3 most relevant chunks are retrieved and sent to GPT-3.5-turbo with the user's question</p>
             </div>
           </div>
         </div>

                 {/* Technical Architecture */}
         <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border mb-8">
           <h3 className="text-lg font-semibold text-chatgpt-text mb-4 flex items-center">
             <Sparkles className="w-5 h-5 text-chatgpt-green mr-2" />
             Technical Architecture
           </h3>
           <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
             <div>
               <strong className="text-chatgpt-text">Backend Services:</strong>
               <ul className="mt-2 space-y-1">
                 <li>• <code className="bg-gray-800 px-1 rounded">Express.js</code> REST API server</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">Google Drive API v3</code> for document access</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">OpenAI API</code> (GPT-3.5-turbo + text-embedding-ada-002)</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">Pinecone</code> vector database (1536 dimensions)</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">pdf-parse</code> for PDF text extraction</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">axios</code> for HTTP requests</li>
               </ul>
             </div>
             <div>
               <strong className="text-chatgpt-text">Frontend Implementation:</strong>
               <ul className="mt-2 space-y-1">
                 <li>• <code className="bg-gray-800 px-1 rounded">React 18</code> with functional components</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">Tailwind CSS</code> for styling</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">Lucide React</code> for icons</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">localStorage</code> for message persistence</li>
                 <li>• <code className="bg-gray-800 px-1 rounded">useState/useEffect</code> for state management</li>
               </ul>
             </div>
           </div>
         </div>

                 {/* Embedding & Vector Search */}
         <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border mb-8">
           <h3 className="text-lg font-semibold text-chatgpt-text mb-4 flex items-center">
             <Database className="w-5 h-5 text-chatgpt-green mr-2" />
             Embedding & Vector Search
           </h3>
           <div className="space-y-4 text-sm text-gray-300">
             <div>
               <strong className="text-chatgpt-text">Text Embedding Process:</strong>
               <ul className="mt-2 space-y-1 ml-4">
                 <li>• Text chunks are converted to 1536-dimensional vectors using OpenAI's text-embedding-ada-002</li>
                 <li>• Each vector represents semantic meaning, not just word frequency</li>
                 <li>• Similar concepts have similar vector representations</li>
                 <li>• Vectors are stored in Pinecone with metadata (filename, page number, chunk text)</li>
               </ul>
             </div>
             <div>
               <strong className="text-chatgpt-text">Similarity Search:</strong>
               <ul className="mt-2 space-y-1 ml-4">
                 <li>• User queries are embedded using the same model</li>
                 <li>• Cosine similarity calculates vector similarity (0-1 scale)</li>
                 <li>• Top 3 most similar chunks are retrieved</li>
                 <li>• Higher similarity scores indicate more relevant content</li>
               </ul>
             </div>
           </div>
         </div>

         {/* API Integration Details */}
         <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border mb-8">
           <h3 className="text-lg font-semibold text-chatgpt-text mb-4 flex items-center">
             <Globe className="w-5 h-5 text-chatgpt-green mr-2" />
             API Integration Details
           </h3>
           <div className="space-y-4 text-sm text-gray-300">
             <div>
               <strong className="text-chatgpt-text">Google Drive API:</strong>
               <ul className="mt-2 space-y-1 ml-4">
                 <li>• OAuth 2.0 authentication for secure access</li>
                 <li>• List files from specific folder ID</li>
                 <li>• Download PDF files for processing</li>
                 <li>• Real-time file metadata updates</li>
               </ul>
             </div>
             <div>
               <strong className="text-chatgpt-text">OpenAI API:</strong>
               <ul className="mt-2 space-y-1 ml-4">
                 <li>• GPT-3.5-turbo for response generation (500 token limit)</li>
                 <li>• text-embedding-ada-002 for vector creation</li>
                 <li>• System prompts control AI behavior and response format</li>
                 <li>• Temperature 0.3 for consistent, focused responses</li>
               </ul>
             </div>
             <div>
               <strong className="text-chatgpt-text">Pinecone Vector DB:</strong>
               <ul className="mt-2 space-y-1 ml-4">
                 <li>• 1536-dimensional vector storage</li>
                 <li>• Cosine similarity for nearest neighbor search</li>
                 <li>• Metadata filtering by document source</li>
                 <li>• Real-time vector updates and queries</li>
               </ul>
             </div>
           </div>
         </div>

                 {/* Proof of Concept Notes */}
         <div className="bg-chatgpt-light p-6 rounded-lg border border-chatgpt-border">
           <h3 className="text-lg font-semibold text-chatgpt-text mb-4">Proof of Concept Notes</h3>
           <div className="space-y-3 text-sm text-gray-300">
             <div className="bg-yellow-900/20 p-3 rounded border border-yellow-600/30">
               <strong className="text-yellow-400">⚠️ This is a demonstration project, not a production system.</strong>
               <p className="mt-1">Built to showcase RAG implementation with real APIs and vector search capabilities.</p>
             </div>
             <div className="space-y-2">
               <strong className="text-chatgpt-text">Technical Limitations:</strong>
               <ul className="ml-4 space-y-1">
                 <li>• Limited to PDF documents from Google Drive</li>
                 <li>• 1000-character chunk size for processing</li>
                 <li>• Top 3 results returned per query</li>
                 <li>• Local storage only (no database persistence)</li>
                 <li>• Single-user demonstration</li>
               </ul>
             </div>
             <div className="space-y-2">
               <strong className="text-chatgpt-text">Production Considerations:</strong>
               <ul className="ml-4 space-y-1">
                 <li>• Add user authentication and multi-tenancy</li>
                 <li>• Implement proper error handling and retry logic</li>
                 <li>• Add rate limiting and API quota management</li>
                 <li>• Use production-grade vector database</li>
                 <li>• Implement proper logging and monitoring</li>
                 <li>• Add document preprocessing and validation</li>
               </ul>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export default HowItWorks;
