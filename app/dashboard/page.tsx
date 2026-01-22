"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { useActivityLog, getProgressData } from "@/lib/useUserData";

export default function DashboardPage() {
  const router = useRouter();
  const { activities } = useActivityLog();
  const [progressData, setProgressData] = useState({ totalAssessments: 0, totalAnsweredQuestions: 0, averageProgress: 0, assessments: [] });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const data = getProgressData();
    setProgressData(data);
  }, []);

  if (!mounted) return null;

  const stats = [
    { label: "Progress", value: `${progressData.averageProgress}%`, icon: "⚡", color: "indigo" },
    { label: "Assessments", value: progressData.totalAssessments, icon: "✓", color: "green" },
    { label: "Questions", value: progressData.totalAnsweredQuestions, icon: "🎯", color: "purple" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3 mb-2">
              <span>📊</span>
              <span>My Dashboard</span>
            </h1>
            <p className="text-gray-600">Real-time tracking of your recovery progress</p>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">{stat.label}</h3>
                <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* DETAILED STATS */}
          {progressData.assessments.length > 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <span>📈</span>
                <span>Assessment Progress</span>
              </h2>

              <div className="space-y-4">
                {progressData.assessments.map((assessment, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {new Date(assessment.completedAt).toLocaleDateString()} - Category {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-gray-600">{assessment.progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${assessment.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECENT ACTIVITY */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <span>🕐</span>
              <span>Recent Activity</span>
            </h2>

            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0">
                    <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No activity yet. Start by answering questions!</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
