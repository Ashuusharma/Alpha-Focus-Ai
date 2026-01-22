"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";

export default function LearningCenterPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: "ingredients",
      title: "Key Ingredients",
      icon: "🧪",
      description: "Learn about the ingredients in your routine",
      items: [
        { name: "Retinol", benefit: "Reduces fine lines and improves skin texture", icon: "✨" },
        { name: "Hyaluronic Acid", benefit: "Deep hydration and moisture retention", icon: "💧" },
        { name: "Niacinamide", benefit: "Strengthens skin barrier and reduces pores", icon: "🛡️" },
        { name: "Vitamin C", benefit: "Brightens and protects from free radicals", icon: "☀️" },
      ],
    },
    {
      id: "techniques",
      title: "Best Practices",
      icon: "🎯",
      description: "Grooming techniques and tips",
      items: [
        { name: "Proper Application", benefit: "Apply products in correct order for maximum efficacy", icon: "📋" },
        { name: "Consistency", benefit: "Stick to your routine for best results", icon: "⏰" },
        { name: "Sun Protection", benefit: "Always use SPF to protect your skin", icon: "🧴" },
        { name: "Hydration", benefit: "Drink water and use hydrating products", icon: "💦" },
      ],
    },
    {
      id: "timeline",
      title: "Results Timeline",
      icon: "📅",
      description: "When to expect visible improvements",
      items: [
        { name: "Week 1-2", benefit: "Skin feels smoother and more hydrated", icon: "✅" },
        { name: "Week 3-4", benefit: "Noticeable improvement in texture and tone", icon: "✨" },
        { name: "Month 2-3", benefit: "Significant reduction in problem areas", icon: "🎉" },
        { name: "Month 3+", benefit: "Sustained improvement and maintained health", icon: "🏆" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 font-medium mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center space-x-3 mb-2">
              <span>📚</span>
              <span>Learning Center</span>
            </h1>
            <p className="text-slate-600">Master the knowledge behind your grooming routine</p>
          </div>

          {/* CATEGORIES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`text-left rounded-2xl p-6 border-2 transition transform hover:shadow-lg ${
                  selectedCategory === cat.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.title}</h3>
                <p className="text-sm text-gray-600">{cat.description}</p>
              </button>
            ))}
          </div>

          {/* SELECTED CATEGORY CONTENT */}
          {selectedCategory && (
            <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-sm">
              {categories.map(
                (cat) =>
                  cat.id === selectedCategory && (
                    <div key={cat.id}>
                      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                        <span>{cat.icon}</span>
                        <span>{cat.title}</span>
                      </h2>

                      <div className="space-y-4">
                        {cat.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition"
                          >
                            <div className="text-3xl flex-shrink-0">{item.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.benefit}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="w-full mt-8 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
                      >
                        Close
                      </button>
                    </div>
                  )
              )}
            </div>
          )}

          {/* FAQ SECTION */}
          <div className="mt-8 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <span>❓</span>
              <span>Frequently Asked Questions</span>
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: "How long does it take to see results?",
                  a: "Most people see visible improvements within 2-4 weeks of consistent use. Significant results typically appear within 2-3 months.",
                },
                {
                  q: "Can I use multiple products together?",
                  a: "Yes, but follow the recommended order: cleanser, toner, treatment, moisturizer, and SPF. Avoid mixing active ingredients unless advised.",
                },
                {
                  q: "What if my skin reacts badly?",
                  a: "Stop using the product immediately and consult with a dermatologist. Start with patch testing new products.",
                },
                {
                  q: "Do I need different routines for seasons?",
                  a: "Yes, adjust your routine based on humidity and temperature. Use heavier moisturizers in winter and lighter ones in summer.",
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer group"
                >
                  <summary className="font-semibold text-slate-900 flex items-center space-x-2 group-open:text-blue-700">
                    <span>+</span>
                    <span>{faq.q}</span>
                  </summary>
                  <p className="text-slate-600 mt-3 ml-6">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
