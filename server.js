const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const OpenAI = require('openai');

const { Pinecone } = require('@pinecone-database/pinecone');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google Drive API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials if refresh token is available
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
let index;

// Recursive character text splitter
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const separators = [
    '\n\n',  // Double newline (paragraphs)
    '\n',    // Single newline
    '. ',    // Sentences
    '! ',    // Exclamations
    '? ',    // Questions
    '; ',    // Semicolons
    ', ',    // Commas
    ' ',     // Spaces
    ''       // No separator (fallback)
  ];
  
  const chunks = [];
  
  function splitText(text, separators) {
    // If text is small enough, return it as a chunk
    if (text.length <= chunkSize) {
      return [text];
    }
    
    // Try each separator
    for (const separator of separators) {
      if (separator === '') {
        // Fallback: split at character limit
        const chunk = text.slice(0, chunkSize);
        const remaining = text.slice(chunkSize);
        return [chunk, ...splitText(remaining, separators)];
      }
      
      const splits = text.split(separator);
      
      // If we have multiple splits, try to create chunks
      if (splits.length > 1) {
        const result = [];
        let currentChunk = '';
        
        for (let i = 0; i < splits.length; i++) {
          const split = splits[i];
          const separatorToAdd = i < splits.length - 1 ? separator : '';
          const potentialChunk = currentChunk + split + separatorToAdd;
          
          if (potentialChunk.length <= chunkSize) {
            currentChunk = potentialChunk;
          } else {
            // Current chunk is full, save it and start a new one
            if (currentChunk) {
              result.push(currentChunk.trim());
            }
            
            // If the split itself is too long, recursively split it
            if (split.length > chunkSize) {
              result.push(...splitText(split, separators.slice(1)));
            } else {
              currentChunk = split + separatorToAdd;
            }
          }
        }
        
        // Add the last chunk
        if (currentChunk) {
          result.push(currentChunk.trim());
        }
        
        // Apply overlap if we have multiple chunks
        if (result.length > 1) {
          const overlappedChunks = [];
          for (let i = 0; i < result.length; i++) {
            let chunk = result[i];
            
            // Add overlap from previous chunk
            if (i > 0 && overlap > 0) {
              const prevChunk = result[i - 1];
              const overlapText = prevChunk.slice(-overlap);
              chunk = overlapText + chunk;
            }
            
            // Add overlap to next chunk
            if (i < result.length - 1 && overlap > 0) {
              const nextChunk = result[i + 1];
              const overlapText = nextChunk.slice(0, overlap);
              chunk = chunk + overlapText;
            }
            
            overlappedChunks.push(chunk.trim());
          }
          return overlappedChunks;
        }
        
        return result;
      }
    }
    
    // Fallback: split at character limit
    const chunk = text.slice(0, chunkSize);
    const remaining = text.slice(chunkSize);
    return [chunk, ...splitText(remaining, separators)];
  }
  
  const initialChunks = splitText(text, separators);
  
  // Filter out empty chunks and ensure minimum size
  return initialChunks
    .filter(chunk => chunk.trim().length > 50) // Minimum chunk size
    .map(chunk => chunk.trim());
}

// Simple embedding function using OpenAI
async function getEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      embeddings.push(response.data[0].embedding);
    } catch (error) {
      console.error('Error getting embedding:', error);
      // Return a zero vector as fallback
      embeddings.push(new Array(1536).fill(0));
    }
  }
  return embeddings;
}

// Initialize Pinecone index
async function initializePinecone() {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME || 'ragbot-index';
    
    // Check if index exists, if not create it
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', indexes);
    
    // Handle different response formats
    let indexExists = false;
    if (Array.isArray(indexes)) {
      indexExists = indexes.some(idx => idx.name === indexName);
    } else if (indexes && indexes.indexes) {
      indexExists = indexes.indexes.some(idx => idx.name === indexName);
    }
    
    console.log(`Index ${indexName} exists: ${indexExists}`);
    
    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI ada-002 embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    }
    
    index = pinecone.index(indexName);
    console.log(`✅ Pinecone index ready: ${indexName}`);
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw error;
  }
}

// Process and store document with page information
async function processDocument(fileId, fileName, fileData) {
  try {
    console.log(`📄 Processing document: ${fileName} (${fileData.text.length} characters, ${fileData.totalPages} pages)`);
    
    // Process each page separately
    let allChunks = [];
    let chunkIndex = 0;
    
    for (const page of fileData.pages) {
      console.log(`📖 Processing page ${page.pageNumber}/${fileData.totalPages}`);
      
      // Split page text into chunks
      const pageChunks = splitTextIntoChunks(page.text);
      
      // Add page information to each chunk
      const chunksWithPageInfo = pageChunks.map(chunk => ({
        text: chunk,
        pageNumber: page.pageNumber,
        totalPages: fileData.totalPages,
        chunkIndex: chunkIndex++
      }));
      
      allChunks.push(...chunksWithPageInfo);
    }
    
    console.log(`✂️ Split into ${allChunks.length} chunks across ${fileData.totalPages} pages`);
    
    // Log chunk statistics
    if (allChunks.length > 0) {
      const avgChunkSize = Math.round(allChunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / allChunks.length);
      const minChunkSize = Math.min(...allChunks.map(chunk => chunk.text.length));
      const maxChunkSize = Math.max(...allChunks.map(chunk => chunk.text.length));
      console.log(`📊 Chunk stats: avg=${avgChunkSize}, min=${minChunkSize}, max=${maxChunkSize} characters`);
    }
    
    // Generate embeddings for chunks
    console.log(`🧠 Generating embeddings for ${allChunks.length} chunks...`);
    const chunkTexts = allChunks.map(chunk => chunk.text);
    const embeddingsArray = await getEmbeddings(chunkTexts);
    
    // Prepare data for Pinecone
    const vectors = allChunks.map((chunk, index) => ({
      id: `${fileId}_${chunk.chunkIndex}`,
      values: embeddingsArray[index],
      metadata: {
        fileName,
        fileId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        totalPages: chunk.totalPages,
        text: chunk.text,
        chunkSize: chunk.text.length,
        source: `${fileName} - Page ${chunk.pageNumber}`,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Add to Pinecone in batches
    const batchSize = 100;
    console.log(`💾 Storing ${vectors.length} vectors in Pinecone (batch size: ${batchSize})...`);
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`✅ Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }
    
    console.log(`✅ Successfully processed ${allChunks.length} chunks for file: ${fileName} across ${fileData.totalPages} pages`);
    return allChunks.length;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

// Extract text from different file types with page information
async function extractTextFromFile(fileId, mimeType) {
  try {
    // Use axios to get the file content directly
    const axios = require('axios');
    
    // Get the access token
    const { token } = await oauth2Client.getAccessToken();
    
    // Download the file content
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'arraybuffer'
      }
    );
    
    const buffer = Buffer.from(response.data);
    
    if (mimeType.includes('pdf')) {
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      
      // Extract page information - try multiple approaches
      const pages = [];
      
      // Method 1: Try to use pdf-parse page data if available
      if (data.pages && data.pages.length > 0) {
        data.pages.forEach((page, index) => {
          if (page.text && page.text.trim()) {
            pages.push({
              pageNumber: index + 1,
              text: page.text.trim(),
              height: page.height || 0,
              width: page.width || 0
            });
          }
        });
      }
      
      // Method 2: If no page data, try splitting by form feed characters
      if (pages.length === 0) {
        const textChunks = data.text.split(/\f+/); // Form feed character(s) for page breaks
        textChunks.forEach((chunk, index) => {
          if (chunk.trim()) {
            pages.push({
              pageNumber: index + 1,
              text: chunk.trim(),
              height: 0,
              width: 0
            });
          }
        });
      }
      
      // Method 3: If still no pages, estimate based on text length
      if (pages.length === 0) {
        const estimatedCharsPerPage = 2000; // Rough estimate
        const textLength = data.text.length;
        const estimatedPages = Math.max(1, Math.ceil(textLength / estimatedCharsPerPage));
        
        const charsPerPage = Math.ceil(textLength / estimatedPages);
        
        for (let i = 0; i < estimatedPages; i++) {
          const start = i * charsPerPage;
          const end = Math.min((i + 1) * charsPerPage, textLength);
          const pageText = data.text.substring(start, end).trim();
          
          if (pageText) {
            pages.push({
              pageNumber: i + 1,
              text: pageText,
              height: 0,
              width: 0
            });
          }
        }
      }
      
      console.log(`📄 Extracted ${pages.length} pages from PDF`);
      
      return {
        text: data.text,
        pages: pages,
        totalPages: pages.length,
        fileName: `PDF Document (${pages.length} pages)`
      };
    } else if (mimeType.includes('word') || mimeType.includes('docx')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      
      // For Word documents, we'll treat the whole document as one "page"
      return {
        text: result.value,
        pages: [{
          pageNumber: 1,
          text: result.value,
          height: 0,
          width: 0
        }],
        totalPages: 1,
        fileName: 'Word Document'
      };
    } else if (mimeType.includes('text') || mimeType.includes('plain')) {
      const text = buffer.toString('utf-8');
      return {
        text: text,
        pages: [{
          pageNumber: 1,
          text: text,
          height: 0,
          width: 0
        }],
        totalPages: 1,
        fileName: 'Text Document'
      };
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', fileId, 'MIME type:', mimeType);
    console.error('Error details:', error.message);
    
    // If it's a permission error, log it specifically
    if (error.response && error.response.status === 403) {
      console.error('Permission denied - make sure the file is accessible');
    }
    
    throw error;
  }
}

// API Routes

// Get all documents from Google Drive
app.get('/api/documents', async (req, res) => {
  try {
    // Get folder ID from environment or use 'root' for entire Drive
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
    
    console.log('📁 Documents endpoint - Folder ID:', folderId);
    
    let files = [];
    
    if (folderId !== 'root') {
      // Get all files from the specified folder and its subfolders
      console.log('📁 Getting files from specific folder and subfolders...');
      files = await getAllFilesFromFolder(folderId);
    } else {
      // Get all files from entire Drive
      console.log('📁 Getting all files from Drive...');
      const response = await drive.files.list({
        pageSize: 1000,
        fields: 'files(id, name, mimeType, modifiedTime, parents)',
        q: "mimeType contains 'pdf' or mimeType contains 'word' or mimeType contains 'text'"
      });
      files = response.data.files;
    }
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Recursive function to get all files from a folder and its subfolders
async function getAllFilesFromFolder(folderId) {
  const allFiles = [];
  
  try {
    // Get all items in the current folder
    const response = await drive.files.list({
      pageSize: 1000,
      fields: 'files(id, name, mimeType, modifiedTime, parents)',
      q: `'${folderId}' in parents`
    });
    
    const items = response.data.files;
    console.log(`📁 Found ${items.length} items in folder ${folderId}`);
    
    for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        // This is a folder, recursively get files from it
        console.log(`📂 Found subfolder: ${item.name} (ID: ${item.id})`);
        const subfolderFiles = await getAllFilesFromFolder(item.id);
        allFiles.push(...subfolderFiles);
      } else if (item.mimeType.includes('pdf') || item.mimeType.includes('word') || item.mimeType.includes('text')) {
        // This is a document file
        console.log(`📄 Found document: ${item.name} (ID: ${item.id})`);
        allFiles.push(item);
      } else {
        console.log(`⚠️ Skipping non-document: ${item.name} (Type: ${item.mimeType})`);
      }
    }
  } catch (error) {
    console.error(`❌ Error getting files from folder ${folderId}:`, error.message);
  }
  
  return allFiles;
}

// Sync documents from Google Drive
app.post('/api/sync-documents', async (req, res) => {
  try {
    // Get folder ID from environment or use 'root' for entire Drive
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
    
    console.log('🔍 Folder ID from environment:', folderId);
    console.log('🔍 Environment variable GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    
    let files = [];
    
    if (folderId !== 'root') {
      // Get all files from the specified folder and its subfolders
      console.log('🔍 Getting files from specific folder and subfolders...');
      files = await getAllFilesFromFolder(folderId);
    } else {
      // Get all files from entire Drive
      console.log('🔍 Getting all files from Drive...');
      const response = await drive.files.list({
        pageSize: 1000,
        fields: 'files(id, name, mimeType, modifiedTime, parents)',
        q: "mimeType contains 'pdf' or mimeType contains 'word' or mimeType contains 'text'"
      });
      files = response.data.files;
    }
    
    console.log(`🔍 Total files found: ${files.length}`);
    
    let processedCount = 0;
    
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (ID: ${file.id})`);
        const fileData = await extractTextFromFile(file.id, file.mimeType);
        await processDocument(file.id, file.name, fileData);
        processedCount++;
        console.log(`✅ Successfully processed: ${file.name}`);
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error.message);
      }
    }
    
    res.json({ 
      message: `Successfully processed ${processedCount} documents`,
      processedCount 
    });
  } catch (error) {
    console.error('Error syncing documents:', error);
    res.status(500).json({ error: 'Failed to sync documents' });
  }
});

// Remove specific file from Pinecone
app.delete('/api/documents/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    console.log(`🗑️ Attempting to remove file ID: ${fileId}`);
    
    // First, let's check what's in the database
    const allVectors = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector to get all documents
      topK: 10000,
      includeMetadata: true
    });
    
    console.log(`📊 Total vectors in database: ${allVectors.matches.length}`);
    
    // Find vectors for this specific file
    const fileVectors = allVectors.matches.filter(match => 
      match.metadata && match.metadata.fileId === fileId
    );
    
    console.log(`📄 Found ${fileVectors.length} vectors for file ID: ${fileId}`);
    
    if (fileVectors.length === 0) {
      console.log(`❌ File ID ${fileId} not found in database`);
      console.log('Available file IDs:', [...new Set(allVectors.matches.map(m => m.metadata?.fileId).filter(Boolean))]);
      return res.status(404).json({ 
        error: 'File not found in database',
        availableFiles: [...new Set(allVectors.matches.map(m => m.metadata?.fileId).filter(Boolean))]
      });
    }
    
    // Delete all vectors for this file
    const vectorIds = fileVectors.map(match => match.id);
    await index.deleteMany(vectorIds);
    
    console.log(`✅ Removed ${vectorIds.length} chunks for file ID: ${fileId}`);
    
    res.json({ 
      message: `Successfully removed file with ${vectorIds.length} chunks`,
      removedChunks: vectorIds.length
    });
    
  } catch (error) {
    console.error('Error removing file:', error);
    res.status(500).json({ error: 'Failed to remove file' });
  }
});

// Clear all documents from Pinecone
app.delete('/api/documents', async (req, res) => {
  try {
    console.log('🗑️ Attempting to clear all documents...');
    
    // Delete all vectors in the index
    await index.deleteAll();
    
    console.log('✅ All documents cleared from Pinecone');
    
    res.json({ 
      message: 'Successfully cleared all documents',
      cleared: true
    });
    
  } catch (error) {
    console.error('Error clearing documents:', error);
    res.status(500).json({ error: 'Failed to clear documents' });
  }
});

// Get stored documents from Pinecone
app.get('/api/stored-documents', async (req, res) => {
  try {
    console.log('📋 Getting stored documents from Pinecone...');
    
    // Get all vectors to analyze stored documents
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector
      topK: 10000,
      includeMetadata: true
    });
    
    // Group by fileId to get document summary
    const documentMap = new Map();
    
    queryResponse.matches.forEach(match => {
      const fileId = match.metadata.fileId;
      const fileName = match.metadata.fileName;
      const pageNumber = match.metadata.pageNumber;
      const totalPages = match.metadata.totalPages;
      
      if (!documentMap.has(fileId)) {
        documentMap.set(fileId, {
          fileId,
          fileName,
          chunkCount: 0,
          totalPages: totalPages,
          pages: new Set(),
          lastModified: match.metadata.timestamp
        });
      }
      
      const doc = documentMap.get(fileId);
      doc.chunkCount++;
      doc.pages.add(pageNumber);
    });
    
    // Convert Set to Array for JSON serialization
    documentMap.forEach(doc => {
      doc.pages = Array.from(doc.pages).sort((a, b) => a - b);
    });
    
    const documents = Array.from(documentMap.values());
    
    console.log(`📋 Found ${documents.length} stored documents`);
    
    res.json(documents);
    
  } catch (error) {
    console.error('Error getting stored documents:', error);
    res.status(500).json({ error: 'Failed to get stored documents' });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Search for relevant documents
    const queryEmbedding = await getEmbeddings([message]);
    const queryResponse = await index.query({
      vector: queryEmbedding[0],
      topK: 5,
      includeMetadata: true
    });
    
    // Log search results with cosine scores
    console.log('\n🔍 RECHERCHE SEMANTIQUE:');
    console.log('='.repeat(50));
    console.log(`Question: "${message}"`);
    console.log(`Documents trouvés: ${queryResponse.matches.length}`);
    console.log('');
    
    queryResponse.matches.forEach((match, index) => {
      console.log(`📄 Document ${index + 1}:`);
      console.log(`   📁 Fichier: ${match.metadata.fileName}`);
      console.log(`   📄 Page: ${match.metadata.pageNumber}/${match.metadata.totalPages}`);
      console.log(`   🎯 Score cosinus: ${match.score.toFixed(4)}`);
      console.log(`   📝 Extrait: "${match.metadata.text.substring(0, 150)}..."`);
      console.log('');
    });
    
    // Prepare context from relevant documents
    const context = queryResponse.matches
      .map(match => match.metadata.text)
      .join('\n\n');
    
    // Prepare conversation history
    const conversationHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Create system message with improved RAG Bot prompt
    const systemMessage = {
      role: 'system',
      content: `You are RAG Bot, an expert assistant powered by Retrieval-Augmented Generation. 
You are connected to a knowledge base consisting of PDF documents from the user's Google Drive. These documents include advanced material on:

- Retrieval-Augmented Generation (RAG) systems and architectures
- AI-generated content handling and trustworthiness
- Data engineering workflows automated by AI
- Enterprise knowledge systems and PDF-based RAG pipelines

Your task is to answer the user's questions using ONLY the provided context from the retrieved documents. If the answer is not clearly supported by the context, say "I couldn't find that information in the documents."

Instructions:
- Be clear, concise, and informative.
- Do not hallucinate or invent facts not in the context.
- When helpful, quote or summarize directly from the retrieved content.
- Format answers in bullet points or short paragraphs for clarity.
- You may refer to document titles or sections if they aid understanding.
- ALWAYS respond in the same language as the user's question.

Never rely on general knowledge or prior training. Only use the provided context.

Context:
${context}

User question:
${message}

Use this context and answer in the user's language.`
    };
    
    // Log the context being used
    console.log('📚 CONTEXTE UTILISÉ:');
    console.log('='.repeat(50));
    console.log(context);
    console.log('='.repeat(50));
    console.log('');
    
    // Prepare messages for OpenAI
    const messages = [systemMessage, ...conversationHistory, { role: 'user', content: message }];
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
      temperature: 0.3,
    });
    
    const response = completion.choices[0].message.content;
    
    // Log the final response
    console.log('🤖 RÉPONSE GÉNÉRÉE:');
    console.log('='.repeat(50));
    console.log(response);
    console.log('='.repeat(50));
    console.log('');
    
    // Group sources by file and page to avoid repetition
    const sourceMap = new Map();
    
    queryResponse.matches.forEach((match, index) => {
      const key = `${match.metadata.fileName}_${match.metadata.pageNumber}`;
      
      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          fileName: match.metadata.fileName,
          pageNumber: match.metadata.pageNumber || 1,
          totalPages: match.metadata.totalPages || 1,
          source: match.metadata.source,
          chunkCount: 1,
          score: match.score
        });
      } else {
        const existing = sourceMap.get(key);
        existing.chunkCount++;
        // Keep the highest score
        if (match.score > existing.score) {
          existing.score = match.score;
        }
      }
    });
    
    console.log(`📚 Sources déduplicées: ${sourceMap.size} sources uniques`);
    
    // Convert to array and sort by score
    const sources = Array.from(sourceMap.values())
      .sort((a, b) => b.score - a.score)
      .map(source => ({
        ...source,
        displayName: `${source.fileName} - Page ${source.pageNumber}/${source.totalPages}${source.chunkCount > 1 ? ` (${source.chunkCount} chunks)` : ''}`
      }));
    
    // Get top 3 source excerpts for display (complete paragraphs)
    const topSourceExcerpts = queryResponse.matches
      .slice(0, 3) // Top 3 most relevant excerpts
      .map((match, index) => ({
        fileName: match.metadata.fileName,
        fileId: match.metadata.fileId, // Include fileId for direct access
        pageNumber: match.metadata.pageNumber,
        excerpt: match.metadata.text, // Include the complete chunk text
        score: match.score,
        rank: index + 1 // Add ranking (1st, 2nd, 3rd closest)
      }));
    
    res.json({
      response,
      sources: sources,
      sourceExcerpts: topSourceExcerpts
    });
    
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Google Drive webhook for real-time updates
app.post('/api/webhook', async (req, res) => {
  try {
    const { resourceId, resourceUri } = req.body;
    
    // Verify webhook (you should implement proper verification)
    // For now, we'll process the update
    
    // Get the updated file
    const file = await drive.files.get({
      fileId: resourceId,
      fields: 'id, name, mimeType'
    });
    
    // Extract and process the updated file
    const textContent = await extractTextFromFile(file.data.id, file.data.mimeType);
    await processDocument(file.data.id, file.data.name, textContent);
    
    console.log(`Webhook: Updated file ${file.data.name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Initialize and start server
async function startServer() {
  await initializePinecone();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(console.error);
