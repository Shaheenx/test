import { create } from 'zustand';
import { Station } from '../types/station.types';
import { TrainClass } from '../types/database.types';

interface SearchStore {
  fromStation: Station | null;
  toStation: Station | null;
  date: string; // ISO date string YYYY-MM-DD
  // Optional class filter applied to search/results — null means "All Classes".
  // NOTE: there is no equivalent "quota" concept anywhere in the schema
  // (no quota table/column on fares or community_reports), so it is not
  // represented here. See Search_Trains screen notes.
  selectedClass: TrainClass | null;
  setFromStation: (station: Station | null) => void;
  setToStation: (station: Station | null) => void;
  setDate: (date: string) => void;
  setSelectedClass: (cls: TrainClass | null) => void;
  swapStations: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  fromStation: null,
  toStation: null,
  date: new Date().toISOString().split('T')[0],
  selectedClass: null,
  setFromStation: (station) => set({ fromStation: station }),
  setToStation: (station) => set({ toStation: station }),
  setDate: (date) => set({ date }),
  setSelectedClass: (selectedClass) => set({ selectedClass }),
  swapStations: () =>
    set((state) => ({
      fromStation: state.toStation,
      toStation: state.fromStation,
    })),
}));
