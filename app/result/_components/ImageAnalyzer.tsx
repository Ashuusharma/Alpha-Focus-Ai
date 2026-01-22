"use client";

import { useState } from "react";

type Props = {
  onAnalyzed: () => void;
  disabled?: boolean;
};

export default function ImageAnalyzer({ onAnalyzed, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);

    // 🔮 MOCK ANALYSIS (replace later with AI)
    await new Promise((res) => setTimeout(res, 1500));

    setAnalyzing(false);
    setDone(true);
    onAnalyzed();
  };

  return (
    <div className="border rounded-2xl p-5 space-y-4 bg-gray-50">
      <h3 className="font-semibold text-lg">Analyze with Image</h3>

      {!preview && (
        <input
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
      )}

      {preview && (
        <div className="space-y-3">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-64 object-contain rounded-xl border"
          />

          {!done && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-black text-white py-3 rounded-xl font-medium"
            >
              {analyzing ? "Analyzing..." : "Analyze Image"}
            </button>
          )}

          {done && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm">
              ✔ Image analyzed successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
}
