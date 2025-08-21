# RAG Bot - Proof of Concept

A Retrieval-Augmented Generation (RAG) chatbot that demonstrates how to build an intelligent document assistant using modern AI technologies. This project showcases the integration of Google Drive API, OpenAI embeddings, Pinecone vector database, and React frontend.

## 🎯 Project Overview

This is a **proof of concept** demonstrating a complete RAG system implementation. The bot can:
- Process PDF documents from Google Drive
- Convert text into semantic embeddings
- Perform vector similarity search
- Generate contextual responses using GPT-3.5-turbo
- Provide source citations with expandable excerpts
- Support multi-language queries

## 🏗️ Architecture

### Frontend (React)
- **React 18** with functional components and hooks
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **localStorage** for message persistence
- **Rate limiting** (120 requests/day) to prevent abuse

### Backend (Node.js)
- **Express.js** REST API server
- **Google Drive API v3** for document access
- **OpenAI API** (GPT-3.5-turbo + text-embedding-ada-002)
- **Pinecone** vector database (1536 dimensions)
- **pdf-parse** for PDF text extraction

## 🔄 RAG Process Flow

1. **Document Ingestion**: PDFs from Google Drive are processed using pdf-parse library
2. **Chunking & Embedding**: Text is split into 1000-character chunks, converted to 1536-dimensional vectors
3. **Vector Search**: User queries are embedded and compared using cosine similarity in Pinecone
4. **Context Generation**: Top 3 most relevant chunks are sent to GPT-3.5-turbo with the user's question

## 🚀 Features

### Core Functionality
- ✅ **Semantic Search**: Find relevant document sections using AI embeddings
- ✅ **Source Citations**: Display source documents with page numbers and relevance scores
- ✅ **Expandable Context**: Click to view complete paragraphs from source documents
- ✅ **Multi-language Support**: Responds in the same language as the user's question
- ✅ **Persistent Chat**: Messages saved locally for future reference

### User Interface
- ✅ **Modern Dark Theme**: Clean, professional interface
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Real-time Rate Limiting**: Visual indicators for API usage
- ✅ **Document Access**: Direct links to Google Drive files
- ✅ **Technical Documentation**: "How It Works" page explaining the architecture

### Technical Features
- ✅ **Rate Limiting**: 120 requests per day per user
- ✅ **Error Handling**: Graceful error messages and fallbacks
- ✅ **Loading States**: Visual feedback during API calls
- ✅ **Auto-scroll**: Chat automatically scrolls to latest messages

## 📁 Project Structure

```
ragBOT-service/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── App.js         # Main application
│   │   │   ├── ChatInterface.js # Chat UI
│   │   │   ├── Message.js     # Individual messages
│   │   │   ├── Sidebar.js     # Navigation sidebar
│   │   │   ├── HowItWorks.js  # Technical documentation
│   │   │   └── RateLimitIndicator.js # Usage tracking
│   │   ├── utils/
│   │   │   └── rateLimiter.js # Rate limiting logic
│   │   ├── index.css          # Global styles
│   │   └── index.js           # App entry point
│   ├── package.json           # Frontend dependencies
│   └── tailwind.config.js     # Tailwind configuration
├── server.js                  # Express backend
├── package.json               # Backend dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Google Cloud Platform account
- OpenAI API key
- Pinecone account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ragBOT-service
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Google Drive API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=your_folder_id

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=ragbot-index

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Google Drive API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Download credentials and update `.env`

### 5. OpenAI API Setup
1. Sign up at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add to `.env` file

### 6. Pinecone Setup
1. Sign up at [Pinecone](https://www.pinecone.io/)
2. Create an index with 1536 dimensions
3. Get API key and environment
4. Add to `.env` file

### 7. Run the Application
```bash
# Start backend server
npm start

# In another terminal, start frontend
cd client
npm start
```

The application will be available at `http://localhost:3000`

## 🔧 Technical Implementation Details

### Document Processing
- **Chunking Strategy**: 1000-character chunks with overlap
- **Embedding Model**: OpenAI text-embedding-ada-002 (1536 dimensions)
- **Metadata Storage**: File ID, page number, chunk text, timestamps

### Vector Search
- **Similarity Metric**: Cosine similarity
- **Top-K Retrieval**: Returns top 3 most relevant chunks
- **Score Thresholding**: Configurable relevance thresholds

### Response Generation
- **Model**: GPT-3.5-turbo (500 token limit)
- **Temperature**: 0.3 for consistent responses
- **System Prompt**: Detailed RAG instructions with context

### Rate Limiting
- **Limit**: 120 requests per 24 hours per user
- **Storage**: localStorage for persistence
- **UI Indicators**: Visual progress bars and warnings

## 🎨 UI/UX Design

### Design Philosophy
- **Minimalist**: Clean, distraction-free interface
- **Dark Theme**: Easy on the eyes for extended use
- **Responsive**: Works seamlessly across devices
- **Accessible**: Clear visual hierarchy and feedback

### Key Components
- **Chat Interface**: Real-time message display with source citations
- **Sidebar**: Navigation, document access, and usage tracking
- **Rate Limit Indicator**: Floating alerts for usage warnings
- **How It Works**: Technical documentation page

## 🔒 Security & Limitations

### Security Features
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes user inputs
- **Error Handling**: Graceful failure modes
- **Environment Variables**: Secure credential management

### Current Limitations (Proof of Concept)
- **Single User**: No multi-tenancy
- **PDF Only**: Limited to PDF documents
- **Local Storage**: No database persistence
- **Basic Auth**: No user authentication system
- **Fixed Chunk Size**: 1000-character chunks only

## 🚀 Production Considerations

To move this from proof of concept to production:

### Backend Improvements
- [ ] User authentication and authorization
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Redis for caching and session management
- [ ] Proper logging and monitoring
- [ ] API rate limiting middleware
- [ ] Input validation and sanitization
- [ ] Error tracking (Sentry)
- [ ] Health checks and metrics

### Frontend Improvements
- [ ] User authentication UI
- [ ] Advanced document management
- [ ] Export functionality
- [ ] Offline support
- [ ] Progressive Web App features
- [ ] Accessibility improvements
- [ ] Internationalization

### Infrastructure
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Cloud deployment (AWS/GCP/Azure)
- [ ] Load balancing
- [ ] CDN for static assets
- [ ] Database backups
- [ ] Monitoring and alerting

## 📊 Performance Metrics

### Current Performance
- **Response Time**: ~2-4 seconds per query
- **Embedding Generation**: ~1-2 seconds per document
- **Vector Search**: ~100-200ms per query
- **Memory Usage**: ~50-100MB for typical usage

### Optimization Opportunities
- **Caching**: Cache embeddings and search results
- **Batch Processing**: Process documents in batches
- **CDN**: Serve static assets from CDN
- **Database Indexing**: Optimize vector search performance

## 🤝 Contributing

This is a proof of concept project. For production use, consider:

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement improvements**
4. **Add tests**
5. **Submit a pull request**

## 📄 License

This project is for educational and demonstration purposes. Please ensure compliance with:
- OpenAI API terms of service
- Google Drive API terms of service
- Pinecone terms of service

## 🙏 Acknowledgments

- **OpenAI** for GPT-3.5-turbo and embedding models
- **Pinecone** for vector database infrastructure
- **Google** for Drive API and authentication
- **React** and **Tailwind CSS** for frontend framework

## 📞 Support

For questions about this proof of concept:
- Check the "How It Works" page in the application
- Review the code comments for implementation details
- Consider this as a starting point for your own RAG implementation

---

**Note**: This is a demonstration project showcasing RAG implementation. For production use, implement proper security, authentication, and infrastructure considerations.
