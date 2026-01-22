"use client";

interface SuccessStory {
  name: string;
  condition: string;
  emoji: string;
  quote: string;
  timeframe: string;
  rating: number;
}

export default function SocialProofWidget() {
  const stories: SuccessStory[] = [
    {
      name: "Arjun K.",
      condition: "Hair Fall",
      emoji: "👨",
      quote:
        "After 6 weeks, my hair fall reduced by 70%. The routine was easy to follow and results are visible!",
      timeframe: "6 weeks",
      rating: 5,
    },
    {
      name: "Rohan S.",
      condition: "Acne-Prone Skin",
      emoji: "👨‍🦱",
      quote:
        "My skin cleared up faster than I expected. The ingredient breakdown helped me understand what I'm using.",
      timeframe: "4 weeks",
      rating: 5,
    },
    {
      name: "Vikram P.",
      condition: "Patchy Beard",
      emoji: "🧔",
      quote:
        "Full, dense beard in 3 months. The beard oil and growth routine made all the difference.",
      timeframe: "3 months",
      rating: 4,
    },
  ];

  return (
    <div className="bg-white border rounded-2xl p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        👥 Success Stories from Users Like You
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stories.map((story, idx) => (
          <div
            key={idx}
            className="border rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition"
          >
            {/* User */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{story.emoji}</span>
              <div>
                <p className="font-semibold text-slate-900">{story.name}</p>
                <p className="text-xs text-slate-500">{story.condition}</p>
              </div>
            </div>

            {/* Quote */}
            <p className="text-sm text-gray-700 italic mb-3 line-clamp-3">
              "{story.quote}"
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-lg">
                  {i < story.rating ? "⭐" : "☆"}
                </span>
              ))}
            </div>

            {/* Timeframe */}
            <p className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full inline-block">
              ✓ Results in {story.timeframe}
            </p>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
        <p className="text-sm text-green-900 mb-3">
          These results are typical when following the routine consistently.
          <br />
          <strong>You could be next!</strong>
        </p>
        <button className="text-sm font-semibold text-green-700 hover:underline">
          Read more success stories →
        </button>
      </div>
    </div>
  );
}
