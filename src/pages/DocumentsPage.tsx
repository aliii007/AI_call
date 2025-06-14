import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Link, 
  Search, 
  Filter,
  MoreVertical,
  Download,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Document } from '../types';

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Product Brochure 2024',
    type: 'pdf',
    uploadDate: new Date('2024-01-15'),
    processed: true,
    tags: ['product', 'marketing'],
  },
  {
    id: '2',
    name: 'Pricing Guide',
    type: 'pdf',
    uploadDate: new Date('2024-01-10'),
    processed: true,
    tags: ['pricing', 'sales'],
  },
  {
    id: '3',
    name: 'Company Website',
    type: 'url',
    url: 'https://company.com',
    uploadDate: new Date('2024-01-08'),
    processed: false,
    tags: ['website', 'reference'],
  },
  {
    id: '4',
    name: 'Competitor Analysis',
    type: 'text',
    uploadDate: new Date('2024-01-05'),
    processed: true,
    tags: ['analysis', 'competitive'],
  },
];

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'processed' | 'pending'>('all');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'processed' && doc.processed) ||
                         (selectedFilter === 'pending' && !doc.processed);
    
    return matchesSearch && matchesFilter;
  });

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'url':
        return Link;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (processed: boolean) => {
    return processed ? CheckCircle : Clock;
  };

  const getStatusColor = (processed: boolean) => {
    return processed 
      ? 'text-success-600 bg-success-100' 
      : 'text-warning-600 bg-warning-100';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage your knowledge base for AI-powered call assistance.
          </p>
        </div>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Documents</option>
              <option value="processed">Processed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredDocuments.map((document, index) => {
            const Icon = getDocumentIcon(document.type);
            const StatusIcon = getStatusIcon(document.processed);
            
            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="relative">
                  <div className="absolute top-4 right-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {document.type.toUpperCase()} • {new Date(document.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${getStatusColor(document.processed)}
                      `}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {document.processed ? 'Processed' : 'Processing'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {document.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="secondary" size="sm" className="flex-1">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredDocuments.length === 0 && (
        <Card className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Upload your first document to get started.'}
          </p>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
        size="lg"
      >
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Upload files</p>
            <p className="text-gray-600 mb-4">Drag and drop your files here, or click to browse</p>
            <Button variant="primary">Choose Files</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="pdf">PDF Document</option>
                <option value="url">Website URL</option>
                <option value="text">Text Content</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary">Upload & Process</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};