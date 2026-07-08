import { useState, useRef, useEffect } from "react";
import { Camera, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Unable to access camera. Please check permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.95);
        setCapturedImage(imageData);
      }
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, "image/jpeg");
      stopCamera();
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <h2 className="text-white font-semibold">Capture Chart</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera/Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-blue-500/30"></div>
              <div className="absolute top-1/3 left-0 right-0 border-t border-blue-500/30"></div>
              <div className="absolute top-2/3 left-0 right-0 border-t border-blue-500/30"></div>
              <div className="absolute top-0 left-1/3 bottom-0 border-l border-blue-500/30"></div>
              <div className="absolute top-0 left-2/3 bottom-0 border-l border-blue-500/30"></div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border-t border-slate-700 p-4 space-y-3">
        {capturedImage ? (
          <div className="flex gap-2">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Retake
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Photo
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={toggleCamera}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {facingMode === "user" ? "📱 Front" : "📷 Back"}
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isCameraActive}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
        )}
        <p className="text-xs text-slate-500 text-center">
          {capturedImage
            ? "Review your chart photo"
            : "Position your chart in the frame and tap Capture"}
        </p>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
