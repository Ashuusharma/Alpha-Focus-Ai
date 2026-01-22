"use client";

interface ResultHeaderProps {
  progress: number;
  categoriesAnalyzed: number;
  totalCategories: number;
}

export default function ResultHeader({
  progress,
  categoriesAnalyzed,
  totalCategories,
}: ResultHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-800 text-white rounded-3xl p-8 shadow-2xl">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2">
          Your AI Analysis Complete ✨
        </h1>
        <p className="text-blue-200 text-lg">
          Personalized recommendations based on your answers
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <p className="text-blue-200 text-sm mb-1">Categories Analyzed</p>
          <p className="text-3xl font-bold">
            {categoriesAnalyzed}/{totalCategories}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <p className="text-blue-200 text-sm mb-1">Recovery Score</p>
          <p className="text-3xl font-bold">{progress}%</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <p className="text-blue-200 text-sm mb-1">Issues Found</p>
          <p className="text-3xl font-bold">{categoriesAnalyzed}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-semibold">Healing Progress</span>
          <span className="text-sm text-blue-300">{progress}%</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-700 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
