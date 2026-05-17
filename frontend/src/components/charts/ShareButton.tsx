import React, { useState } from 'react';
import { Share2, Copy, Check, Mail } from 'lucide-react';
import { Button } from '../ui';

interface ShareButtonProps {
  url: string;
  onShare?: (platform: 'link' | 'email') => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  onShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Dashboard Chart Share');
    const body = encodeURIComponent(`Check out this chart: ${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    onShare?.('email');
  };

  return (
    <div className="relative">
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Share2 size={16} />
        Share
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3">
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleCopy();
                  onShare?.('link');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded">
                  {copied ? <Check size={16} className="text-blue-600" /> : <Copy size={16} className="text-blue-600" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Copy Link</p>
                  <p className="text-xs text-gray-500">{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                </div>
              </button>

              <button
                onClick={handleEmail}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-green-100 rounded">
                  <Mail size={16} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-gray-500">Send via email</p>
                </div>
              </button>

              <div className="pt-2 border-t border-gray-200 mt-2">
                <p className="text-xs text-gray-500 mb-1">Current URL:</p>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-600 truncate">{url}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};