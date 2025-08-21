import React, { useState } from 'react';
import { User, Bot, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const Message = ({ message }) => {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderSources = (sources, sourceExcerpts) => {
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-3 p-3 bg-chatgpt-light rounded-lg border border-chatgpt-border">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="w-4 h-4 text-chatgpt-green" />
          <span className="text-sm font-medium text-chatgpt-text">Sources:</span>
        </div>
        
        {/* Top 3 closest documents */}
        {sourceExcerpts && sourceExcerpts.length > 0 ? (
          <div className="mb-3 space-y-2">
            <div className="text-xs text-gray-400 mb-2">
              📚 Top {sourceExcerpts.length} closest documents:
            </div>
            {sourceExcerpts.map((excerpt, index) => (
              <ExpandableSource key={`excerpt-${index}`} excerpt={excerpt} />
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 mb-2">
            No source documents found
          </div>
        )}
        
        {/* Source list */}
        <div className="space-y-1">
          {sources.map((source, index) => (
            <div key={`${source.fileName}-${source.pageNumber}-${index}`} className="text-xs text-gray-400 flex items-center space-x-2">
              <span>•</span>
              <span className="flex-1">
                {source.displayName || `${source.fileName} - Page ${source.pageNumber}/${source.totalPages || '?'}`}
              </span>
              {source.score && (
                <span className="text-xs bg-chatgpt-green/20 text-chatgpt-green px-2 py-1 rounded">
                  {Math.round(source.score * 100)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

    // Expandable source component
  const ExpandableSource = ({ excerpt }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const shortExcerpt = excerpt.excerpt.length > 200
      ? excerpt.excerpt.substring(0, 200) + '...'
      : excerpt.excerpt;

    const openGoogleDriveFile = (fileId) => {
      const url = `https://drive.google.com/file/d/${fileId}/view`;
      window.open(url, '_blank');
    };

    return (
      <div className="p-2 bg-gray-800 rounded border-l-2 border-chatgpt-green">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">
              📄 {excerpt.fileName} - Page {excerpt.pageNumber}
            </div>
            {excerpt.fileId && (
              <button
                onClick={() => openGoogleDriveFile(excerpt.fileId)}
                className="text-xs text-chatgpt-green hover:text-chatgpt-green/80 flex items-center space-x-1"
                title="Open document in Google Drive"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {excerpt.rank && (
              <span className="text-xs bg-chatgpt-green/20 text-chatgpt-green px-2 py-1 rounded">
                #{excerpt.rank} closest
              </span>
            )}
            {excerpt.score && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                {Math.round(excerpt.score * 100)}% match
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-300">
          {isExpanded ? (
            <div>
              <div className="mb-2 italic">"{excerpt.excerpt}"</div>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center space-x-1 text-xs text-chatgpt-green hover:text-chatgpt-green/80"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Show less</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-2 italic">"{shortExcerpt}"</div>
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center space-x-1 text-xs text-chatgpt-green hover:text-chatgpt-green/80"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Click to see complete paragraph</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`message ${message.role}`}>
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <User className="w-8 h-8 text-blue-500" />
        ) : (
          <Bot className="w-8 h-8 text-chatgpt-green" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-chatgpt-text">
            {message.role === 'user' ? 'You' : 'RAG Bot'}
          </span>
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <div className="text-chatgpt-text whitespace-pre-wrap">
          {message.content}
        </div>
        {message.role === 'assistant' && renderSources(message.sources, message.sourceExcerpts)}
      </div>
    </div>
  );
};

export default Message;
