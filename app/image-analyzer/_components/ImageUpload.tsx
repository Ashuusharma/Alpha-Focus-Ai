"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Upload, X, Check, Image as ImageIcon, RotateCcw, Trash2, ChevronRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyzerType, PhotoAngle, getPhotoAngles } from "@/lib/analyzeImage";

interface MultiAngleUploadProps {
  analyzerType: AnalyzerType;
  onAllCaptured: (images: string[]) => void;
  disabled?: boolean;
}

export default function MultiAngleUpload({
  analyzerType,
  onAllCaptured,
  disabled = false,
}: MultiAngleUploadProps) {
  const [angles, setAngles] = useState<PhotoAngle[]>([]);
  const [activeAngleIdx, setActiveAngleIdx] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const photoAngles = getPhotoAngles(analyzerType);
    setAngles(photoAngles);
    setActiveAngleIdx(0);
    setAllDone(false);
  }, [analyzerType]);

  const capturedCount = angles.filter((a) => a.imageData).length;
  const totalAngles = angles.length;

  // Start camera for current angle
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Camera access denied or unavailable. Please enable camera permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture photo for current angle
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.85);
      saveAnglePhoto(imageData);
      stopCamera();
    }
  };

  // Upload file for current angle
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      saveAnglePhoto(imageData);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save photo to the active angle
  const saveAnglePhoto = (imageData: string) => {
    setAngles((prev) => {
      const updated = [...prev];
      updated[activeAngleIdx] = { ...updated[activeAngleIdx], imageData };
      return updated;
    });
    // Auto-advance to next uncaptured angle
    const nextEmpty = angles.findIndex((a, i) => i > activeAngleIdx && !a.imageData);
    if (nextEmpty !== -1) {
      setActiveAngleIdx(nextEmpty);
    } else {
      // Check if all captured
      const allCaptured = angles.every((a, i) => i === activeAngleIdx ? true : !!a.imageData);
      if (allCaptured) setAllDone(true);
    }
  };

  // Remove photo from specific angle
  const removePhoto = (idx: number) => {
    setAngles((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], imageData: null };
      return updated;
    });
    setActiveAngleIdx(idx);
    setAllDone(false);
  };

  // Submit all photos
  const handleSubmitAll = () => {
    const images = angles.map((a) => a.imageData).filter(Boolean) as string[];
    if (images.length >= 1) {
      onAllCaptured(images);
    }
  };

  const currentAngle = angles[activeAngleIdx];
  const minPhotosRequired = 1;
  const canSubmit = capturedCount >= minPhotosRequired;

  return (
    <div className="space-y-6">
      {/* ANGLE PROGRESS BAR */}
      <div className="flex items-center gap-2 mb-2">
        {angles.map((angle, idx) => (
          <div key={angle.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => { setActiveAngleIdx(idx); stopCamera(); }}
              className={`flex-1 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                angle.imageData 
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  : idx === activeAngleIdx 
                    ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                    : "bg-white/10"
              }`}
            />
          </div>
        ))}
        <span className="text-xs text-white/50 ml-2 whitespace-nowrap">{capturedCount}/{totalAngles}</span>
      </div>

      {/* PINNED THUMBNAILS */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {angles.map((angle, idx) => (
          <motion.div
            key={angle.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => { setActiveAngleIdx(idx); stopCamera(); }}
            className={`relative flex-shrink-0 w-24 h-24 rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-300 ${
              idx === activeAngleIdx 
                ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/30" 
                : angle.imageData 
                  ? "border-emerald-500/50" 
                  : "border-white/10 border-dashed"
            }`}
          >
            {angle.imageData ? (
              <>
                <img src={angle.imageData} alt={angle.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-[9px] text-white font-bold truncate">{angle.label}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                <Camera className="w-5 h-5 text-white/30 mb-1" />
                <p className="text-[8px] text-white/30 text-center px-1 leading-tight">{angle.label}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ACTIVE ANGLE INSTRUCTIONS */}
      {currentAngle && !currentAngle.imageData && !cameraActive && (
        <motion.div
          key={`instruction-${activeAngleIdx}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">
                Photo {activeAngleIdx + 1}: {currentAngle.label}
              </h4>
              <p className="text-sm text-blue-200/70 leading-relaxed">
                {currentAngle.instruction}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={startCamera}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-5 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3.5 px-5 rounded-xl font-bold transition-all border border-white/10 disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </motion.div>
      )}

      {/* CAMERA VIEW */}
      {cameraActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden bg-black/50 border border-white/10 relative"
        >
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />

          {/* Face Guide Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-64 border-2 border-white/30 border-dashed rounded-[50%] flex items-center justify-center">
              <p className="text-white/40 text-xs text-center px-4">
                Align {currentAngle?.label || "face"} here
              </p>
            </div>
          </div>

          {/* Angle Label */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg">
            <p className="text-sm text-blue-300 font-bold">📸 {currentAngle?.label}</p>
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent flex gap-4 justify-center">
            <button
              onClick={capturePhoto}
              className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 bg-white/10 backdrop-blur text-white px-6 py-3 rounded-full font-semibold hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* CURRENT ANGLE PREVIEW (just captured) */}
      {currentAngle?.imageData && !cameraActive && (
        <motion.div
          key={`preview-${activeAngleIdx}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl overflow-hidden border border-emerald-500/20"
        >
          <img src={currentAngle.imageData} alt={currentAngle.label} className="w-full h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-emerald-400 font-bold bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-emerald-500/30 text-sm">
            <Check className="w-4 h-4" />
            {currentAngle.label} ✓
          </div>
          <button
            onClick={() => removePhoto(activeAngleIdx)}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white p-2 rounded-full hover:bg-red-500/80 transition flex items-center gap-1 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
        </motion.div>
      )}

      {/* SKIP / SUBMIT CONTROLS */}
      <div className="flex gap-3">
        {/* Skip this angle */}
        {!allDone && currentAngle && !currentAngle.imageData && capturedCount >= minPhotosRequired && (
          <button
            onClick={() => {
              const nextEmpty = angles.findIndex((a, i) => i > activeAngleIdx && !a.imageData);
              if (nextEmpty !== -1) setActiveAngleIdx(nextEmpty);
              else setAllDone(true);
            }}
            className="flex-1 text-white/50 hover:text-white py-3 rounded-xl border border-white/10 hover:border-white/20 transition text-sm font-medium"
          >
            Skip this angle
          </button>
        )}

        {/* Submit button */}
        {canSubmit && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSubmitAll}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12" />
            <span className="relative flex items-center gap-2">
              {capturedCount === totalAngles ? "Analyze All Photos" : `Analyze ${capturedCount} Photo${capturedCount > 1 ? 's' : ''}`}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        )}
      </div>

      {/* Minimum photos notice */}
      {capturedCount === 0 && (
        <div className="flex items-center gap-2 text-white/30 text-xs justify-center">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Capture at least {minPhotosRequired} photo to proceed. All {totalAngles} angles recommended for best results.</span>
        </div>
      )}
    </div>
  );
}
