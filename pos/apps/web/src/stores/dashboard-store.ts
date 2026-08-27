import { create } from "zustand";
import type {
  DashboardData,
  DashboardDateFilter,
} from "@retailflow/shared-types";

interface DashboardState {
  data: DashboardData | null;
  dateFilter: DashboardDateFilter;
  loading: boolean;
  error: string | null;

  setData: (data: DashboardData) => void;
  setDateFilter: (filter: DashboardDateFilter) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultDateFilter: DashboardDateFilter = { type: "today" };

export const useDashboardStore = create<DashboardState>()((set) => ({
  data: null,
  dateFilter: defaultDateFilter,
  loading: false,
  error: null,

  setData: (data) => set({ data, loading: false, error: null }),
  setDateFilter: (dateFilter) => set({ dateFilter }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set({ data: null, dateFilter: defaultDateFilter, loading: false, error: null }),
}));
