import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/button';
// import { Label } from '~/components/ui/label'; // Not used yet

interface ImageCanvasProps {
  userImageDataUrl: string | null; // Prop to initialize or externally set/clear the image
  width: number;
  height: number;
  overlayImageUrl?: string;
  onStageRef?: (stage: Konva.Stage | null) => void;
  onImageUpdate?: (imageDataUrl: string | null) => void; // Callback for parent
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  userImageDataUrl,
  width,
  height,
  overlayImageUrl = '/pepe-loves-overlay.webp', // Updated default
  onStageRef,
  onImageUpdate,
}) => {
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [showUploadButton, setShowUploadButton] = useState(true); // Added state
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [overlayError, setOverlayError] = useState<string | null>(null);

  const userImageRef = useRef<Konva.Image>(null);
  const overlayImageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null); // Added ref

  const [userImageProps, setUserImageProps] = useState({
    x: 0, // Centered and sized on image load
    y: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  });

  useEffect(() => {
    if (userImageDataUrl) {
      const img = new window.Image();
      img.src = userImageDataUrl;
      img.onload = () => {
        setUserImage(img);
        setUserImageProps({
            x: (width - img.width / 4) / 2,
            y: (height - img.height / 4) / 2,
            width: img.width / 4,
            height: img.height / 4,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
        });
        setShowUploadButton(false);
        if (onImageUpdate) {
          onImageUpdate(userImageDataUrl); // Notify parent about the loaded image
        }
      };
      img.onerror = () => {
        console.error("Failed to load user image from data URL.");
        setUserImage(null); // Clear image on error
        setShowUploadButton(true);
        if (onImageUpdate) {
          onImageUpdate(null); // Notify parent about the error/clear
        }
      }
    } else {
      setUserImage(null);
      setShowUploadButton(true); // Show button if image is cleared via prop
      if (onImageUpdate) {
        onImageUpdate(null); // Notify parent about the clear
      }
    }
  }, [userImageDataUrl, width, height, onImageUpdate]);


  // This effect is primarily for when the image is cleared *not* via the userImageDataUrl prop,
  // e.g. if we added a "clear" button inside ImageCanvas itself.
  // Given current logic, it might be redundant if userImageDataUrl is the sole source of external clearing.
  // However, it also handles the initial state where both userImageDataUrl and userImage are null.
  useEffect(() => {
    if (!userImage) { // If no image is displayed (either initially or cleared)
      setShowUploadButton(true);
    }
  }, [userImage]);


  const onImageSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        setUserImage(img);
        setUserImageProps({
          x: (width - img.width / 4) / 2,
          y: (height - img.height / 4) / 2,
          width: img.width / 4,
          height: img.height / 4,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        });
        setShowUploadButton(false); // Hide button on successful load
        if (onImageUpdate) {
          onImageUpdate(dataUrl); // Notify parent about the newly uploaded image
        }
      };
      img.onerror = () => {
        console.error("Failed to load user image from data URL after upload.");
        // setUserImage(null); // Optionally clear, or leave old image
        setShowUploadButton(true); // Re-show button on error
        // Don't call onImageUpdate(null) here unless we clear the image,
        // to avoid nullifying a previously valid image in parent state.
      };
    };
    reader.onerror = () => {
      console.error("Failed to read file.");
      setShowUploadButton(true); // Re-show button on error
    }
    reader.readAsDataURL(file);
  }, [width, height, onImageUpdate]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImageSelected(event.target.files[0]);
      event.target.value = ''; // Reset file input
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles[0]) {
        onImageSelected(acceptedFiles[0]);
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: false,
  });

  useEffect(() => {
    const img = new window.Image();
    img.src = overlayImageUrl;
    img.onload = () => {
      setOverlayImage(img);
      setOverlayError(null);
    };
    img.onerror = () => {
        console.error("Failed to load overlay image from:", overlayImageUrl);
        setOverlayError(`Failed to load overlay image. Ensure "${overlayImageUrl}" is in the public folder.`);
    }
  }, [overlayImageUrl]);

  useEffect(() => {
    if (userImage && userImageRef.current && transformerRef.current) {
      transformerRef.current.nodes([userImageRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [userImage, userImageProps]); // Depend on userImageProps to re-attach if image re-renders with new props

  useEffect(() => {
    if (onStageRef) {
      onStageRef(stageRef.current);
    }
    return () => {
      if (onStageRef) {
        onStageRef(null);
      }
    };
  }, [onStageRef, stageRef]);


  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setUserImageProps(prev => ({
      ...prev,
      x: e.target.x(),
      y: e.target.y(),
    }));
  };

  const handleTransformEnd = () => {
    if (userImageRef.current) {
      const node = userImageRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1); // Reset scale before calculating width/height
      node.scaleY(1);
      setUserImageProps(prev => ({
        ...prev,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        scaleX: 1,
        scaleY: 1,
        rotation: node.rotation(),
      }));
    }
  };

  const handleImageClick = () => {
    if (userImageRef.current && transformerRef.current) {
        transformerRef.current.nodes([userImageRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
    }
  };

  return (
    <div {...getRootProps()} style={{ position: 'relative', width, height, border: isDragActive ? '2px dashed #007bff' : '1px solid #e2e8f0' }} className="inline-block rounded-md align-middle"> {/* Added align-middle for better inline behavior if needed */}
      <input {...getInputProps()} ref={uploadInputRef} style={{ display: 'none' }} onChange={handleFileInputChange} />
      {overlayError && <p className="text-destructive text-center mb-2 p-2 bg-destructive/10 rounded-md absolute top-2 left-1/2 -translate-x-1/2 z-20">{overlayError}</p>}
      {/* Removed border from Stage, parent div handles it now */}
      <Stage width={width} height={height} ref={stageRef} className="bg-muted rounded-md">
        <Layer>
          {userImage && (
            <KonvaImage
              ref={userImageRef}
              image={userImage}
              x={userImageProps.x}
              y={userImageProps.y}
              width={userImageProps.width}
              height={userImageProps.height}
              scaleX={userImageProps.scaleX}
              scaleY={userImageProps.scaleY}
              rotation={userImageProps.rotation}
              draggable
              onDragEnd={handleDragEnd}
              onTransformEnd={handleTransformEnd}
              onClick={handleImageClick}
              onTap={handleImageClick} // for touch
            />
          )}
          {userImage && <Transformer ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (newBox.width < 10 || newBox.height < 10) {
                return oldBox;
              }
              return newBox;
            }}
          />}
        </Layer>
        <Layer>
          {overlayImage && (
            <KonvaImage
              ref={overlayImageRef}
              image={overlayImage}
              x={0}
              y={0}
              width={width}
              height={height}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
      {showUploadButton && !userImage && (
        <Button
          onClick={() => uploadInputRef.current?.click()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10, // Ensure it's above the canvas
          }}
          variant="outline"
        >
          Upload Image
        </Button>
      )}
      {isDragActive && (
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9, borderRadius: 'inherit'}}>
            <p style={{color: 'white', fontSize: '1.5em', textAlign: 'center'}}>Drop the image here ...</p>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;
