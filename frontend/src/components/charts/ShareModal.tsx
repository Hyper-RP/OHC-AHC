import React, { useState } from 'react';
import { X, Copy, Check, Mail, Share2 } from 'lucide-react';
import { Button } from '../ui';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  url,
  title = 'Dashboard Chart',
  description,
}) => {
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
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(description
      ? `${description}\n\n${url}`
      : `Check out this chart: ${url}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Share Chart</h3>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Share2 size={20} />
              <span className="font-medium">Share</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
              {copied ? <Check size={20} className="text-blue-600" /> : <Copy size={20} className="text-blue-600" />}
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Copy Link</p>
              <p className="text-sm text-gray-500">{copied ? 'Copied to clipboard!' : 'Share via link'}</p>
            </div>
          </button>

          <button
            onClick={handleEmail}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full">
              <Mail size={20} className="text-green-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-500">Send via email</p>
            </div>
          </button>

          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border rounded text-sm text-gray-600"
              />
              <Button variant="outline-secondary" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};