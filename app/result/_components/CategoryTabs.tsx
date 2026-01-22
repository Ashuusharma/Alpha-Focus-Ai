"use client";

import { CategoryId, categories } from "@/lib/questions";

type Props = {
  active: CategoryId;
  completed: CategoryId[];
  onSelect: (id: CategoryId) => void;
};

export default function CategoryTabs({
  active,
  completed,
  onSelect,
}: Props) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-2">
      {categories.map((cat) => {
        const isActive = active === cat.id;
        const isCompleted = completed.includes(cat.id);

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="relative flex items-center gap-2 pb-2 whitespace-nowrap transition"
          >
            {/* LABEL */}
            <span
              className={`text-sm font-medium transition ${
                isActive
                  ? "text-black"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {cat.label}
            </span>

            {/* GREEN DOT FOR COMPLETED */}
            {isCompleted && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
            )}

            {/* ACTIVE UNDERLINE */}
            {isActive && (
              <span className="absolute left-0 -bottom-[2px] h-[2px] w-full bg-black rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
