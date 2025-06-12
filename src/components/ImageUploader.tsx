import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '~/components/ui/input'; // Assuming Input can be used directly or adapted
import { Label } from '~/components/ui/label'; // For associating with the input

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: false,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onImageUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg border-muted-foreground hover:border-primary transition-colors">
      <div {...getRootProps()} className="w-full cursor-pointer">
        <input {...getInputProps()} id="file-upload" className="sr-only" />
        {isDragActive ? (
          <p className="text-center text-primary">Drop the image here ...</p>
        ) : (
          <p className="text-center text-muted-foreground">
            Drag 'n' drop an image here, or click to select image
          </p>
        )}
      </div>
      <Label htmlFor="file-upload-fallback" className="text-sm font-medium">Or use the file input:</Label>
      {/* Using a styled input for fallback, actual file input is hidden via getRootProps */}
      <Input
        type="file"
        id="file-upload-fallback"
        accept="image/*"
        onChange={handleFileChange}
        className="max-w-xs"
      />
      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Image Preview:</p>
          <img src={preview} alt="Uploaded preview" className="max-w-xs max-h-48 rounded-md object-contain" />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
