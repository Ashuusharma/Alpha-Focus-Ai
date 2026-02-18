import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedPhoto {
  id: string;
  dataUrl: string;
  capturedAt: string;
  category: string;
  tags: string[];
  notes?: string;
}

interface PhotoGalleryState {
  photos: SavedPhoto[];
  addPhoto: (photo: Omit<SavedPhoto, "id">) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<SavedPhoto>) => void;
  getPhotosByCategory: (category: string) => SavedPhoto[];
  clearAll: () => void;
}

export const usePhotoGalleryStore = create<PhotoGalleryState>()(
  persist(
    (set, get) => ({
      photos: [],
      
      addPhoto: (photo) => {
        const newPhoto: SavedPhoto = {
          ...photo,
          id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({ photos: [newPhoto, ...state.photos] }));
      },
      
      removePhoto: (id) => {
        set((state) => ({ photos: state.photos.filter((p) => p.id !== id) }));
      },
      
      updatePhoto: (id, updates) => {
        set((state) => ({
          photos: state.photos.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },
      
      getPhotosByCategory: (category) => {
        return get().photos.filter((p) => p.category === category);
      },
      
      clearAll: () => {
        set({ photos: [] });
      },
    }),
    {
      name: "oneman-photo-gallery",
    }
  )
);
