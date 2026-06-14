import { useState, useMemo } from 'react';
import { Copy, Download, Search, Check } from 'lucide-react';

interface RawJsonPanelProps {
  jsonText: string;
  fileName?: string;
}

export function RawJsonPanel({ jsonText, fileName = 'file.json' }: RawJsonPanelProps) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-format the JSON with nice indentation
  const formattedJson = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonText;
    }
  }, [jsonText]);

  // Handle copying to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Handle downloading raw file
  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter lines containing the search query
  const lines = useMemo(() => {
    return formattedJson.split('\n');
  }, [formattedJson]);

  const matchedLinesCount = useMemo(() => {
    if (!searchQuery) return 0;
    const query = searchQuery.toLowerCase();
    return lines.filter(line => line.toLowerCase().includes(query)).length;
  }, [lines, searchQuery]);

  return (
    <div className="raw-json-view">
      <div className="raw-json-toolbar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search in JSON lines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className="search-results-badge">
              {matchedLinesCount} matches
            </span>
          )}
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className="button icon-button-text"
            onClick={handleCopy}
            title="Copy formatted JSON to clipboard"
            data-tooltip="Copy JSON"
          >
            {copied ? <Check size={16} className="color-success" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className="button icon-button-text"
            onClick={handleDownload}
            title="Download formatted JSON file"
            data-tooltip="Download JSON"
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="raw-json-container">
        <pre className="code-viewer">
          <code>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const matches = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
              
              return (
                <div
                  key={lineNumber}
                  className={`code-line ${matches ? 'highlighted-line' : ''}`}
                >
                  <span className="line-num">{lineNumber}</span>
                  <span className="line-content">{line}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
