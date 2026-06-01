import { create } from "zustand";

type UiState = {
  selectedUserIds: string[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSelectedUserIds: (ids: string[]) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedUserIds: [],
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
