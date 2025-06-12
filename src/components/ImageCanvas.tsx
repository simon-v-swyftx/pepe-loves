import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Path as KonvaPath } from 'react-konva'; // Added KonvaPath
import Konva from 'konva';
import { useDropzone } from 'react-dropzone';
import { Button } from '~/components/ui/button';

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
  const [scaledHeartPath, setScaledHeartPath] = useState<string | null>(null);

  const originalHeartPathData = "M 101.00,433.00 C 104.35,427.50 100.45,428.47 100.44,423.00 100.44,418.82 103.35,416.49 100.44,407.00 97.92,398.85 91.56,392.23 90.76,389.00 90.17,387.15 90.97,381.56 90.76,379.00 91.03,376.30 91.13,371.51 90.76,369.00 88.92,360.47 80.71,349.65 74.00,344.39 68.13,339.78 63.41,340.14 60.58,336.73 58.13,333.76 56.95,323.65 51.87,319.43 46.42,314.90 41.64,319.13 38.53,314.71 38.53,314.71 31.55,298.00 31.55,298.00 31.55,298.00 21.97,274.00 21.97,274.00 21.97,274.00 8.92,239.00 8.92,239.00 6.62,230.28 6.90,221.92 7.00,213.00 7.00,213.00 8.72,198.00 8.72,198.00 9.43,192.02 8.37,189.58 9.89,183.00 11.23,177.17 12.09,176.94 13.96,171.99 19.10,158.44 18.38,159.60 25.86,147.00 27.86,143.62 29.58,140.29 32.04,137.17 32.04,137.17 38.54,129.99 38.54,129.99 44.63,122.56 44.41,118.71 53.00,112.25 61.55,105.82 83.28,97.69 94.00,96.14 94.00,96.14 107.00,96.14 107.00,96.14 111.40,96.02 126.37,97.14 130.00,98.61 137.98,101.85 146.91,111.74 151.38,119.00 156.35,127.07 162.45,145.04 171.18,148.90 177.24,151.58 181.43,144.88 189.00,142.63 195.40,140.73 222.13,140.01 230.00,140.00 244.38,139.98 275.65,142.48 288.00,149.04 307.98,159.66 318.44,173.80 329.42,193.00 329.42,193.00 343.76,220.00 343.76,220.00 347.04,229.08 348.60,241.37 349.04,251.00 349.04,251.00 350.00,265.00 350.00,265.00 349.86,276.92 346.16,291.36 340.97,302.00 340.97,302.00 330.65,326.00 330.65,326.00 329.21,329.34 327.63,334.85 324.73,336.99 314.86,344.28 309.35,330.66 303.72,325.32 300.39,322.18 294.09,318.61 290.00,316.28 282.69,312.11 266.47,301.35 260.00,299.22 253.30,297.01 248.78,296.30 243.21,301.48 238.43,305.91 237.77,311.46 236.07,313.42 234.63,315.08 232.88,315.04 230.04,317.31 230.04,317.31 219.70,326.27 219.70,326.27 218.15,328.17 216.46,333.34 215.14,336.00 215.14,336.00 210.54,346.00 210.54,346.00 208.05,353.13 203.61,378.21 203.21,386.00 202.63,397.08 209.50,407.69 207.00,418.00 207.00,418.00 218.00,425.00 218.00,425.00 218.00,425.00 218.00,427.00 218.00,427.00 218.00,427.00 208.00,433.09 208.00,433.09 208.00,433.09 187.00,440.35 187.00,440.35 177.80,443.43 178.35,444.98 168.00,445.00 168.00,445.00 139.00,445.00 139.00,445.00 139.00,445.00 121.00,445.00 121.00,445.00 118.00,445.00 113.67,445.33 111.00,443.98 107.22,442.06 103.35,436.51 101.00,433.00 Z";

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

  // Updated: More specific, only deselects if the click is on the stage background
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // If the click is on the stage itself (the background), and not on any shape.
    if (transformerRef.current && e.target === stageRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, []); // Refs are stable, so empty dependency array is fine.

  // New: Handles clicks outside the Konva stage to deselect the transformer
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      stageRef.current &&
      transformerRef.current &&
      transformerRef.current.nodes().length > 0 // Only if something is selected
    ) {
      const stageContainer = stageRef.current.container(); // DOM element of the stage
      // Check if the click target is outside the stage container
      if (stageContainer && !stageContainer.contains(event.target as Node)) {
        transformerRef.current.nodes([]); // Deselect
        const layer = transformerRef.current.getLayer();
        if (layer) {
          layer.batchDraw(); // Redraw the layer to hide transformer
        }
      }
    }
  }, []); // Refs are stable, empty dependency array.


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

  // Updated useEffect to manage transformer and both stage and document click listeners
  useEffect(() => {
    const currentTransformer = transformerRef.current;
    const currentStage = stageRef.current;
    const currentImageNode = userImageRef.current;

    // Manage Transformer nodes
    if (userImage && currentImageNode && currentTransformer) {
      // If image exists, ensure transformer is attached to it
      const transformerNodes = currentTransformer.nodes();
      if (transformerNodes.length !== 1 || transformerNodes[0] !== currentImageNode) {
        currentTransformer.nodes([currentImageNode]);
      }
      currentTransformer.getLayer()?.batchDraw();
    } else if (currentTransformer && currentTransformer.nodes().length > 0) {
      // If no image (or image node not ready), or image cleared, detach transformer
      currentTransformer.nodes([]);
      currentTransformer.getLayer()?.batchDraw();
    }

    // Event listeners for deselection
    if (currentStage) {
      currentStage.on('click tap', handleStageClick); // For clicks on stage background
      document.addEventListener('mousedown', handleClickOutside); // For clicks outside stage

      return () => {
        currentStage.off('click tap', handleStageClick);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userImage, userImageProps, handleStageClick, handleClickOutside]); // Added handleClickOutside to dependencies

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

  // Helper function to scale SVG path data
  const scaleSvgPath = (pathData: string, scaleX: number, scaleY: number): string => {
    if (!pathData) return "";

    // Regex to find SVG commands and their coordinates
    // It captures the command (M, L, C, Z, etc.) and the sequence of numbers that follows.
    const commandRegex = /([MLCVZ])([^MLCVZ]*)/gi;
    let newPathData = "";
    let match;

    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const coordsString = match[2].trim();

      newPathData += command;

      if (coordsString) {
        // Split coordinates string into individual numbers
        const coords = coordsString.split(/[ ,]+/).map(Number);
        const scaledCoords: number[] = [];

        // Scale coordinates: X by scaleX, Y by scaleY
        // This assumes alternating X, Y coordinates for commands like M, L, C.
        // For 'Z' (closePath), there are no coordinates.
        if (command.toUpperCase() !== 'Z') {
          for (let i = 0; i < coords.length; i++) {
            // Ensure the coordinate is a number before scaling
            if (!isNaN(coords[i])) {
              scaledCoords.push(i % 2 === 0 ? coords[i] * scaleX : coords[i] * scaleY);
            }
          }
          newPathData += scaledCoords.join(',');
        }
      }
      newPathData += " "; // Add space between commands for readability, though not strictly necessary for SVG
    }
    return newPathData.trim();
  };

  useEffect(() => {
    if (overlayImage && overlayImage.naturalWidth > 0 && overlayImage.naturalHeight > 0 && originalHeartPathData) {
      const imgNaturalWidth = overlayImage.naturalWidth;
      const imgNaturalHeight = overlayImage.naturalHeight;

      const currentScaleX = width / imgNaturalWidth;
      const currentScaleY = height / imgNaturalHeight;

      const newScaledPath = scaleSvgPath(originalHeartPathData, currentScaleX, currentScaleY);
      setScaledHeartPath(newScaledPath);
    } else {
      // Reset or clear path if overlay image is not ready
      setScaledHeartPath(null);
    }
  }, [width, height, overlayImage, originalHeartPathData]); // Added originalHeartPathData to dependencies


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
    <div {...getRootProps()} style={{ position: 'relative', width, height, border: isDragActive ? '2px dashed #007bff' : '' }} className="inline-block rounded-md align-middle"> {/* Added align-middle for better inline behavior if needed */}
      <input {...getInputProps()} ref={uploadInputRef} style={{ display: 'none' }} onChange={handleFileInputChange} />
      {overlayError && <p className="text-destructive text-center mb-2 p-2 bg-destructive/10 rounded-md absolute top-2 left-1/2 -translate-x-1/2 z-20">{overlayError}</p>}
      {/* Removed border from Stage, parent div handles it now */}
      <Stage width={width} height={height} ref={stageRef} className="bg-muted rounded-md">
        <Layer>
          <Group
            clipFunc={(ctx) => {
              if (scaledHeartPath) {
                ctx.beginPath(); // Essential to start a new path definition
                const commandRegex = /([MLCVZ])([^MLCVZ]*)/gi;
                let match;

                // Parse the scaledHeartPath (SVG path string) and apply to context
                // Do all this bullshit because KonvaJS doesn't support 2DPaths natively
                while ((match = commandRegex.exec(scaledHeartPath)) !== null) {
                  const command = match[1];
                  const coordsString = match[2].trim();
                  const coords = coordsString.split(/[ ,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));

                  switch (command) {
                    case 'M': // moveTo(x, y)
                      if (coords.length >= 2) {
                        ctx.moveTo(coords[0], coords[1]);
                        // Handle implicit lineto commands if M is followed by more coordinate pairs
                        for (let i = 2; i + 1 < coords.length; i += 2) {
                          ctx.lineTo(coords[i], coords[i+1]);
                        }
                      }
                      break;
                    case 'C': // bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
                      // Handles multiple bezier segments if they are under one 'C' command in SVG string
                      for (let i = 0; i + 5 < coords.length; i += 6) {
                        ctx.bezierCurveTo(coords[i], coords[i+1], coords[i+2], coords[i+3], coords[i+4], coords[i+5]);
                      }
                      break;
                    case 'Z': // closePath()
                      ctx.closePath();
                      break;
                    default:
                      // console.warn(`Unsupported SVG command '${command}' in clipFunc`);
                  }
                }
                // After defining the path on the context (ctx.moveTo, etc.),
                // Konva is expected to automatically call ctx.clip() with its default fill rule (usually nonzero).
              }
            }}
          >
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
          </Group>
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

        <Layer>
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
      </Stage>
      {showUploadButton && !userImage && (
        <Button
          onClick={() => uploadInputRef.current?.click()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '25%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10, // Ensure it's above the canvas
          }}
          variant="outline"
        >
          Upload Image
        </Button>
      )}
      {isDragActive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9, borderRadius: 'inherit' }}>
          <p style={{ color: 'white', fontSize: '1.5em', textAlign: 'center' }}>Drop the image here ...</p>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;
