import { FileJson, UploadCloud } from 'lucide-react';
import { PLAN_ACCEPT } from '../lib/acceptedFiles';

interface FileUploadProps {
  title?: string;
  hint?: string;
  sampleLabel?: string;
  accept?: string;
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  fileName?: string;
  fileSize?: number;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  title = 'Upload Terraform plan JSON',
  hint = 'Drag and drop a .json file, or choose one from disk.',
  sampleLabel = 'Load sample',
  accept = PLAN_ACCEPT,
  onFileSelect,
  onLoadSample,
  fileName,
  fileSize,
  disabled,
}: FileUploadProps) {
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const file = event.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = '';
  };

  return (
    <div className="upload-section">
      <div
        className={`upload-dropzone${disabled ? ' disabled' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="upload-icon" aria-hidden="true">
          <UploadCloud size={40} strokeWidth={1.5} />
        </div>
        <p className="upload-title">{title}</p>
        <p className="upload-hint">{hint}</p>
        <div className="upload-actions">
          <label className="button primary">
            <UploadCloud size={16} aria-hidden="true" />
            Choose file
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={disabled}
              hidden
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={onLoadSample}
            disabled={disabled}
          >
            <FileJson size={16} aria-hidden="true" />
            {sampleLabel}
          </button>
        </div>
        {fileName && (
          <p className="upload-meta">
            Loaded: <strong>{fileName}</strong>
            {fileSize !== undefined && ` (${formatBytes(fileSize)})`}
          </p>
        )}
      </div>
    </div>
  );
}
