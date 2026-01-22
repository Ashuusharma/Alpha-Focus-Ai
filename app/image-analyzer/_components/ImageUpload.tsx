"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  onImageCapture: (imageData: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageCapture,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setPreview(imageData);
      setCameraActive(false);
      onImageCapture(imageData);
    };
    reader.readAsDataURL(file);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert(
        "Camera access denied. Please enable camera permissions or upload a photo instead."
      );
    }
  };

  // Capture from camera
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg");
      setPreview(imageData);
      stopCamera();
      onImageCapture(imageData);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <div className="bg-white border-2 border-dashed border-blue-300 rounded-2xl p-8">
      {!preview && !cameraActive && (
        <div className="text-center">
          <div className="text-5xl mb-4">📸</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Capture or Upload Your Photo
          </h3>
          <p className="text-slate-600 mb-6">
            For best results, use good lighting and take a clear photo of the
            area you want analyzed.
          </p>

          <div className="space-y-3">
            <button
              onClick={startCamera}
              disabled={disabled}
              className="w-full bg-gradient-to-r from-blue-700 to-slate-800 text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              📷 Use Camera
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-full bg-slate-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-slate-800 transition disabled:opacity-50"
            >
              🗂️ Upload Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <p className="text-xs text-slate-500 mt-6">
            💡 Tip: Use natural lighting, face the camera directly, and make
            sure the area is visible.
          </p>
        </div>
      )}

      {cameraActive && (
        <div className="text-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-96 rounded-lg object-cover mb-4"
          />

          <div className="flex gap-3 justify-center">
            <button
              onClick={capturePhoto}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              📸 Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="text-center">
          <img
            src={preview}
            alt="Captured"
            className="w-full h-96 object-cover rounded-lg mb-4"
          />
          <p className="text-green-600 font-semibold mb-4">
            ✓ Photo captured successfully
          </p>
        </div>
      )}
    </div>
  );
}
