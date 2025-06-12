import React, { useState } from 'react'; // इंश्योर React is imported
import { createFileRoute } from '@tanstack/react-router';
import ThemeToggle from '~/components/ThemeToggle';
import ImageUploader from '~/components/ImageUploader';
import ImageCanvas from '~/components/ImageCanvas';
import { Button } from '~/components/ui/button';
import Konva from 'konva';

export const Route = createFileRoute('/')({
  component: Home,
  loader: ({ context }) => {
    return { user: context.user };
  },
});

function Home() {
  const [userImageDataUrl, setUserImageDataUrl] = useState<string | null>(null);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const handleImageUpload = (dataUrl: string | null) => {
    setUserImageDataUrl(dataUrl);
    setDownloadMessage(null);
  };

  const handleDownload = () => {
    if (stageInstance && userImageDataUrl) {
      const dataURL = stageInstance.toDataURL({
        mimeType: 'image/png',
        quality: 0.9,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = 'superimposed-image.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadMessage('Image downloaded successfully!'); // Success message
    } else {
      console.warn('Download attempted but stage or user image is not available.');
      setDownloadMessage('Download failed: Please upload an image first.');
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-start gap-6 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold sm:text-4xl text-center">Image Superimposer</h1>

        <p className="text-muted-foreground text-center">
          Upload an image, then drag and resize it under the overlay.
        </p>

        <ImageUploader onImageUpload={handleImageUpload} />

        <div className="mt-6 w-full max-w-full overflow-x-auto">
          <div className="w-fit mx-auto shadow-lg rounded-md overflow-hidden border border-border"> {/* Added border here too */}
            <ImageCanvas
              userImageDataUrl={userImageDataUrl}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              overlayImageUrl="/overlay.png"
              onStageRef={setStageInstance}
            />
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={!userImageDataUrl || !stageInstance}
          className="mt-8"
          size="lg"
          variant="default"
        >
          Download Image
        </Button>
        {downloadMessage && (
          <p className={`mt-2 text-sm ${downloadMessage.startsWith('Download failed') ? 'text-destructive' : 'text-green-600'}`}>
            {downloadMessage}
          </p>
        )}

      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
