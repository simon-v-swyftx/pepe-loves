import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import Konva from 'konva';

interface ImageCanvasProps {
  userImageDataUrl: string | null;
  width: number;
  height: number;
  overlayImageUrl?: string;
  onStageRef?: (stage: Konva.Stage | null) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  userImageDataUrl,
  width,
  height,
  overlayImageUrl = '/overlay.png',
  onStageRef,
}) => {
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [overlayError, setOverlayError] = useState<string | null>(null);

  const userImageRef = useRef<Konva.Image>(null);
  const overlayImageRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [userImageProps, setUserImageProps] = useState({
    x: 50,
    y: 50,
    width: 100,
    height: 100,
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
      };
      img.onerror = () => { // Should not happen with data URLs, but good practice
        console.error("Failed to load user image from data URL.");
      }
    } else {
      setUserImage(null);
    }
  }, [userImageDataUrl, width, height]);

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
    <div className="inline-block"> {/* Helps with sizing and centering if canvas is display:block by default */}
      {overlayError && <p className="text-destructive text-center mb-2 p-2 bg-destructive/10 rounded-md">{overlayError}</p>}
      <Stage width={width} height={height} ref={stageRef} className="bg-muted rounded-md border">
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
    </div>
  );
};

export default ImageCanvas;
