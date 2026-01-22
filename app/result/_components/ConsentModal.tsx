"use client";

type Props = {
  category: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConsentModal({
  category,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-3">
          Improve your {category}?
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          We can personalize recommendations for this area as well.
          Would you like to answer a few quick questions?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border rounded-lg py-2"
          >
            Not now
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-black text-white rounded-lg py-2"
          >
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  );
}
