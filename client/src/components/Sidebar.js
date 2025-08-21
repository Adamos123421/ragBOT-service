import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Trash2, 
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Zap
} from 'lucide-react';
import rateLimiter from '../utils/rateLimiter';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  documents, 
  onClearChat,
  onShowHowItWorks,
  onBackToChat,
  currentView
}) => {
  const [rateLimitStatus, setRateLimitStatus] = useState(rateLimiter.getStatus());

  useEffect(() => {
    // Update rate limit status every minute
    const interval = setInterval(() => {
      setRateLimitStatus(rateLimiter.getStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);
  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('docx')) {
      return '📝';
    } else if (mimeType.includes('text')) {
      return '📄';
    }
    return '📄';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const openGoogleDriveFile = (fileId) => {
    const url = `https://drive.google.com/file/d/${fileId}/view`;
    window.open(url, '_blank');
  };

  const openGoogleDrive = () => {
    window.open('https://drive.google.com/drive/folders/1ChJ2uStE4dax1Yk9XpKb2SysScZ6-249', '_blank');
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-chatgpt-dark border-r border-chatgpt-border transition-transform duration-300 z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: '256px' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-chatgpt-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-chatgpt-text">RAG Bot</h2>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-chatgpt-light transition-colors"
              >
                <X className="w-5 h-5 text-chatgpt-text" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Actions */}
            <div className="space-y-3 mb-6">
              {currentView !== 'chat' && (
                <button
                  onClick={onBackToChat}
                  className="sidebar-button flex items-center justify-center space-x-2 text-chatgpt-green hover:text-chatgpt-green/80"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Back to Chat</span>
                </button>
              )}
              
              <button
                onClick={onShowHowItWorks}
                className="sidebar-button flex items-center justify-center space-x-2 text-blue-400 hover:text-blue-300"
              >
                <HelpCircle className="w-4 h-4" />
                <span>How It Works</span>
              </button>
              
              {currentView === 'chat' && (
                <button
                  onClick={onClearChat}
                  className="sidebar-button flex items-center justify-center space-x-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat</span>
                </button>
              )}
            </div>

            {/* Google Drive Documents */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-chatgpt-text flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Google Drive Files ({documents.length})</span>
                </h3>
                <button
                  onClick={openGoogleDrive}
                  className="text-xs text-chatgpt-green hover:text-chatgpt-green/80 flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Drive</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No documents found in Google Drive.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => openGoogleDriveFile(doc.id)}
                      className="w-full p-3 bg-chatgpt-light rounded-lg border border-chatgpt-border hover:border-chatgpt-green hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(doc.mimeType)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-chatgpt-text truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(doc.modifiedTime)}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-chatgpt-green flex-shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>


          </div>

                     {/* Footer */}
           <div className="p-4 border-t border-chatgpt-border">
             <div className="space-y-3">
               {/* Rate Limit Status */}
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center space-x-2 text-gray-400">
                   <Zap className="w-3 h-3" />
                   <span>API Usage</span>
                 </div>
                 <div className="text-right">
                   <div className="text-chatgpt-text font-medium">
                     {rateLimitStatus.remaining} / 120
                   </div>
                   <div className="text-gray-500 text-xs">
                     remaining
                   </div>
                 </div>
               </div>
               
               {/* Progress Bar */}
               <div className="w-full bg-gray-700 rounded-full h-1">
                 <div 
                   className={`h-1 rounded-full transition-all duration-300 ${
                     rateLimitStatus.remaining < 24 ? 'bg-red-400' : 
                     rateLimitStatus.remaining < 60 ? 'bg-yellow-400' : 'bg-chatgpt-green'
                   }`}
                   style={{ width: `${((120 - rateLimitStatus.remaining) / 120) * 100}%` }}
                 ></div>
               </div>
               
               {/* Connection Status */}
               <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                 <Settings className="w-3 h-3" />
                 <span>Connected to Google Drive</span>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-4 z-40 p-2 bg-chatgpt-dark border border-chatgpt-border rounded-lg hover:bg-chatgpt-light transition-all duration-200 ${
          isOpen ? 'left-4' : 'left-4'
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-chatgpt-text" />
        ) : (
          <ChevronRight className="w-5 h-5 text-chatgpt-text" />
        )}
      </button>
    </>
  );
};

export default Sidebar;
