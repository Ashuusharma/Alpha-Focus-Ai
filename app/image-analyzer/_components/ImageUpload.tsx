"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import NextImage from "next/image";
import { Camera, Upload, X, Check, RotateCcw, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AnalyzerType, PhotoAngle, getPhotoAngles } from "@/lib/analyzeImage";
import { compressImageToDataUrl } from "@/lib/mobileImage";

interface MultiAngleUploadProps {
  analyzerType: AnalyzerType;
  onAllCaptured: (images: string[]) => void;
  disabled?: boolean;
}

type QualityWarning = "lighting" | "blur" | "framing";

const CATEGORY_CAPTURE_TIPS: Partial<Record<AnalyzerType, string[]>> = {
  acne: ["Use plain skin with no heavy cream or makeup.", "Keep bumps and marks fully visible in even light."],
  dark_circles: ["Avoid overhead shadows.", "Keep eyes naturally open and relaxed."],
  anti_aging: ["Show forehead, eye area, and smile lines clearly.", "Do not use smoothing filters."],
  hair_loss: ["Expose hairline and crown fully.", "Use bright overhead light for scalp visibility."],
  scalp_health: ["Part the hair so scalp skin is visible.", "Avoid heavy oil right before capture."],
  beard_growth: ["Show cheeks, jawline, and neckline clearly.", "Capture patchy zones without trimming them too short first."],
  body_acne: ["Show the full affected area, not only one spot.", "Use bright light and avoid sweaty glare if possible."],
  body_odor: ["Capture clean dry skin so irritation and sweat zones are visible.", "Show the zone that smells or sweats most, not random body skin."],
  lip_care: ["Keep lips product-free if possible before capture.", "Show cracks, dryness, or pigmentation clearly."],
  skin_dullness: ["Use natural daylight for true tone.", "Avoid beauty mode and warm yellow indoor light."],
  energy_fatigue: ["Capture under-eye area clearly.", "Take the photo before caffeine or splash-water touchups if possible."],
  fitness_recovery: ["Show the exact recovery concern area.", "Keep the full region in frame so strain pattern is visible."],
};

const QUALITY_WARNING_COPY: Record<QualityWarning, string> = {
  lighting: "Use brighter, even light with less shadow and glare.",
  blur: "Hold the camera steady and wait for sharp focus before capture.",
  framing: "Keep the target area centered, close enough, and fully visible.",
};

async function analyzeImageQuality(imageData: string): Promise<QualityWarning[]> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve([]);
        return;
      }

      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

      let luminanceSum = 0;
      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        luminanceSum += red * 0.299 + green * 0.587 + blue * 0.114;
      }

      const pixelCount = width * height;
      const avgLuminance = luminanceSum / Math.max(1, pixelCount);

      let gradientSum = 0;
      let gradientSquaredSum = 0;
      let sampleCount = 0;

      for (let y = 1; y < height - 1; y += 4) {
        for (let x = 1; x < width - 1; x += 4) {
          const index = (y * width + x) * 4;
          const rightIndex = (y * width + (x + 1)) * 4;
          const downIndex = ((y + 1) * width + x) * 4;

          const lum = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
          const lumRight = data[rightIndex] * 0.299 + data[rightIndex + 1] * 0.587 + data[rightIndex + 2] * 0.114;
          const lumDown = data[downIndex] * 0.299 + data[downIndex + 1] * 0.587 + data[downIndex + 2] * 0.114;

          const gradient = Math.abs(lumRight - lum) + Math.abs(lumDown - lum);
          gradientSum += gradient;
          gradientSquaredSum += gradient * gradient;
          sampleCount += 1;
        }
      }

      const gradientMean = gradientSum / Math.max(1, sampleCount);
      const gradientVariance = gradientSquaredSum / Math.max(1, sampleCount) - gradientMean * gradientMean;

      const warnings: QualityWarning[] = [];
      if (avgLuminance < 65 || avgLuminance > 210) warnings.push("lighting");
      if (gradientVariance < 180) warnings.push("blur");

      const aspectRatio = width / Math.max(1, height);
      if (aspectRatio < 0.6 || aspectRatio > 1.8 || width < 360 || height < 360) warnings.push("framing");

      resolve(warnings);
    };

    image.onerror = () => resolve([]);
    image.src = imageData;
  });
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
  const [qualityWarnings, setQualityWarnings] = useState<Record<string, QualityWarning[]>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const photoAngles = getPhotoAngles(analyzerType);
    setAngles(photoAngles);
    setActiveAngleIdx(0);
    setAllDone(false);
    setUploadError(null);
  }, [analyzerType]);

  const capturedCount = angles.filter((a) => a.imageData).length;
  const totalAngles = angles.length;

  // Start camera for current angle
  const startCamera = async () => {
    try {
      setUploadError(null);
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
      setUploadError("Camera access is unavailable. Enable permissions or upload a photo instead.");
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
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      setProcessingImage(true);
      setUploadError(null);
      try {
        const imageData = canvas.toDataURL("image/jpeg", 0.88);
        const compressed = await compressImageToDataUrl(imageData);
        saveAnglePhoto(compressed);
        stopCamera();
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Could not process the captured photo.");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  // Upload file for current angle
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessingImage(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => resolve(String(event.target?.result || ""));
        reader.onerror = () => reject(new Error("Unable to read that file."));
        reader.readAsDataURL(file);
      });

      const compressed = await compressImageToDataUrl(imageData);
      saveAnglePhoto(compressed);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not prepare that image for analysis.");
    } finally {
      setProcessingImage(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Save photo to the active angle
  const saveAnglePhoto = (imageData: string) => {
    const activeAngle = angles[activeAngleIdx];
    const updatedAngles = [...angles];
    updatedAngles[activeAngleIdx] = { ...updatedAngles[activeAngleIdx], imageData };
    setAngles(updatedAngles);

    if (activeAngle) {
      void analyzeImageQuality(imageData).then((warnings) => {
        setQualityWarnings((prev) => ({ ...prev, [activeAngle.id]: warnings }));
      });
    }

    const nextEmpty = updatedAngles.findIndex((a, i) => i > activeAngleIdx && !a.imageData);
    if (nextEmpty !== -1) {
      setActiveAngleIdx(nextEmpty);
    } else {
      const allCaptured = updatedAngles.every((angle) => Boolean(angle.imageData));
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
    const angleId = angles[idx]?.id;
    if (angleId) {
      setQualityWarnings((prev) => {
        const next = { ...prev };
        delete next[angleId];
        return next;
      });
    }
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
  const currentWarnings = currentAngle ? qualityWarnings[currentAngle.id] || [] : [];
  const hasAnyWarnings = angles.some((angle) => (qualityWarnings[angle.id] || []).length > 0);
  const currentTips = CATEGORY_CAPTURE_TIPS[analyzerType] || [];
  const currentPhotoApproved = Boolean(currentAngle?.imageData) && currentWarnings.length === 0;

  return (
    <div className="space-y-7">
      {/* ANGLE PROGRESS BAR */}
      <div className="flex items-center gap-2 mb-2">
        {angles.map((angle, idx) => (
          <div key={angle.id} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => { setActiveAngleIdx(idx); stopCamera(); }}
              className={`flex-1 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                angle.imageData 
                    ? "bg-[#2F6F57] shadow-[0_0_8px_rgba(47,111,87,0.35)]" 
                  : idx === activeAngleIdx 
                    ? "bg-[#A9CBB7] animate-pulse shadow-[0_0_8px_rgba(169,203,183,0.6)]" 
                    : "bg-[#E2DDD4]"
              }`}
            />
          </div>
        ))}
        <span className="text-xs text-[#6E9F87] ml-2 whitespace-nowrap">{capturedCount}/{totalAngles}</span>
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
                ? "border-[#2F6F57] shadow-[0_0_15px_rgba(47,111,87,0.2)] ring-2 ring-[#A9CBB7]" 
                : angle.imageData 
                  ? "border-[#A9CBB7]" 
                  : "border-[#D9D2C7] border-dashed bg-white"
            }`}
          >
            {angle.imageData ? (
              <>
                <NextImage
                  src={angle.imageData}
                  alt={angle.label}
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover"
                />
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
                <div className="absolute top-1 left-1 w-5 h-5 bg-[#2F6F57] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {(qualityWarnings[angle.id] || []).length > 0 && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center" title="Quality check suggests retake for better results">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F7F4EE]">
                <Camera className="w-5 h-5 text-[#6E9F87] mb-1" />
                <p className="text-[8px] text-[#6E9F87] text-center px-1 leading-tight">{angle.label}</p>
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
          className="bg-[#F7F4EE] border border-[#D9D2C7] rounded-2xl p-7"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#E8EFEA] rounded-xl flex items-center justify-center flex-shrink-0 border border-[#C8DACF]">
              <Camera className="w-6 h-6 text-[#2F6F57]" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#1E4D3A] mb-1">
                Photo {activeAngleIdx + 1}: {currentAngle.label}
              </h4>
              <p className="text-sm text-[#2F6F57] leading-relaxed">
                {currentAngle.instruction}
              </p>
              {currentTips.length > 0 ? (
                <div className="mt-4 rounded-xl border border-[#C8DACF] bg-white/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6E9F87]">Quality cues</p>
                  <div className="mt-2 space-y-1 text-xs text-[#2F6F57]">
                    {currentTips.map((tip) => (
                      <p key={tip}>• {tip}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={startCamera}
              disabled={disabled || processingImage}
              className="flex-1 flex items-center justify-center gap-2 bg-medical-gradient text-white py-4 px-5 rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(47,111,87,0.2)] disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || processingImage}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#F7F4EE] text-[#2F6F57] py-4 px-5 rounded-xl font-bold transition-all border border-[#D9D2C7] disabled:opacity-50"
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
          {processingImage ? (
            <p className="mt-3 text-xs font-medium text-[#2F6F57]">Optimizing photo for faster upload on mobile...</p>
          ) : null}
          {uploadError ? (
            <p className="mt-3 rounded-xl border border-[#E4B9AA] bg-[#FFF5F1] px-3 py-2 text-xs text-[#8C4C3A]">{uploadError}</p>
          ) : null}
        </motion.div>
      )}

      {/* CAMERA VIEW */}
      {cameraActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl overflow-hidden bg-black/40 border border-[#D9D2C7] relative"
        >
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-[440px] object-cover" />

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
            <p className="text-sm text-[#E8EFEA] font-bold">📸 {currentAngle?.label}</p>
          </div>

          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 to-transparent flex gap-4 justify-center">
            <button
              onClick={capturePhoto}
              disabled={processingImage}
              className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-[#F7F4EE] transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
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
          className="relative rounded-2xl overflow-hidden border border-[#C8DACF]"
        >
          <div className="relative h-80 w-full">
            <NextImage
              src={currentAngle.imageData}
              alt={currentAngle.label}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[#E8EFEA] font-bold bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-[#A9CBB7] text-sm">
            <Check className="w-4 h-4" />
            {currentPhotoApproved ? `${currentAngle.label} ready` : `${currentAngle.label} captured`}
          </div>
          <button
            onClick={() => removePhoto(activeAngleIdx)}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white p-2 rounded-full hover:bg-red-500/80 transition flex items-center gap-1 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>

          {currentWarnings.length > 0 && (
            <div className="absolute left-4 right-4 top-4 rounded-xl border border-amber-300/50 bg-amber-100/90 px-3 py-2 text-xs text-amber-900">
              <p className="font-semibold">Quality check suggests a retake for better accuracy.</p>
              <div className="mt-1 space-y-1">
                {currentWarnings.map((warning) => (
                  <p key={warning}>• {QUALITY_WARNING_COPY[warning]}</p>
                ))}
              </div>
            </div>
          )}

          {currentPhotoApproved && (
            <div className="absolute left-4 right-4 top-4 rounded-xl border border-emerald-300/60 bg-emerald-100/90 px-3 py-2 text-xs text-emerald-900">
              <p className="font-semibold">Good to analyze.</p>
              <p className="mt-1">Lighting, focus, and framing look strong enough for this category.</p>
            </div>
          )}
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
            className="flex-1 text-[#6E9F87] hover:text-[#1E4D3A] py-3 rounded-xl border border-[#D9D2C7] hover:border-[#C8DACF] transition text-sm font-medium"
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
            disabled={processingImage}
            className="flex-1 bg-medical-gradient text-white py-3.5 rounded-xl font-bold hover:shadow-[0_0_25px_rgba(47,111,87,0.3)] transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
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
        <div className="flex items-center gap-2 text-[#6E9F87] text-xs justify-center">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Capture at least {minPhotosRequired} photo to proceed. All {totalAngles} angles recommended for best results.</span>
        </div>
      )}

      {hasAnyWarnings && capturedCount > 0 && (
        <div className="flex items-center gap-2 text-amber-700 text-xs justify-center bg-amber-100/70 rounded-xl border border-amber-300/60 px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Some photos may reduce confidence. Retake flagged angles first, then analyze the strongest set.</span>
        </div>
      )}
    </div>
  );
}
