"use client";

export default function ExpertConsultationCTA() {
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl p-8 overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full opacity-20 -mr-20 -mt-20" />

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0">
            AI
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Talk to a Grooming Expert</h3>
            <p className="text-indigo-100 text-sm mb-4">
              Get personalized advice from certified grooming specialists who can
              adjust your routine based on your results and help you achieve
              optimal outcomes.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition">
                Book Call (Free 15 min)
              </button>
              <button className="border border-white text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/10 transition">
                Chat Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

