import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileJson } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  data: any;
}

export function UploadForm() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addUploadedData, setHealthSpaces } = useDashboardStore();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const uploadedFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          data,
        };
        setUploadedFiles((prev) => [...prev, uploadedFile]);
        addUploadedData(data);

        // If the data has a specific structure for health spaces, process it
        if (data.features && Array.isArray(data.features)) {
          const newSpaces = data.features.map((feature: any, index: number) => ({
            id: `uploaded-${Date.now()}-${index}`,
            districtId: feature.properties.districtId || 'unknown',
            name: feature.properties.name || 'Unnamed Location',
            type: feature.properties.type || 'health_center',
            coordinates: feature.geometry.coordinates.reverse() as [number, number],
            youthParticipants: feature.properties.youthParticipants || 0,
            totalParticipants: feature.properties.totalParticipants || 0,
            year: feature.properties.year || 2024,
            description: feature.properties.description,
          }));
          setHealthSpaces(newSpaces);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please ensure it is valid GeoJSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type === 'application/json' || file.name.endsWith('.geojson')) {
        processFile(file);
      } else {
        alert('Please upload JSON or GeoJSON files only.');
      }
    });
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type === 'application/json' || file.name.endsWith('.geojson')) {
        processFile(file);
      } else {
        alert('Please upload JSON or GeoJSON files only.');
      }
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="upload-section">
      <h3>Upload Geospatial Data</h3>
      <div
        className={`upload-area ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={48} className="upload-icon" />
        <p className="upload-text">
          Drag & drop your GeoJSON files here, or click to browse
        </p>
        <p className="upload-hint">Supports vector data (GeoJSON, JSON)</p>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          accept=".json,.geojson"
          multiple
          onChange={handleFileInput}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: '#a0a0a0' }}>
            Uploaded Files
          </h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="uploaded-file-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileJson size={20} />
                <div>
                  <div className="uploaded-file-name">{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button className="remove-file-btn" onClick={() => removeFile(file.id)}>
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

