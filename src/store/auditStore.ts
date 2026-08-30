"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditFormData, AuditResult, ToolInput } from "@/lib/audit-engine";

export type Step = "form" | "processing" | "results";
export type CurrencyCode = "INR" | "USD";

interface AuditStore {
  step: Step;
  setStep: (step: Step) => void;

  // Currency
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;

  // Form data
  tools: ToolInput[];
  setTools: (tools: ToolInput[]) => void;
  teamSize: number;
  useCase: "coding" | "writing" | "research" | "mixed";
  email: string;
  company: string;

  addTool: (tool: ToolInput) => void;
  updateTool: (index: number, tool: Partial<ToolInput>) => void;
  removeTool: (index: number) => void;
  setTeamSize: (size: number) => void;
  setUseCase: (useCase: "coding" | "writing" | "research" | "mixed") => void;
  setEmail: (email: string) => void;
  setCompany: (company: string) => void;

  // Results
  result: AuditResult | null;
  setResult: (result: AuditResult) => void;
  aiSummary: string;
  setAiSummary: (summary: string) => void;

  // UI state & Idempotency
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  activeFilter: "all" | "high" | "medium" | "optimal";
  setActiveFilter: (filter: "all" | "high" | "medium" | "optimal") => void;

  // AI model selection
  selectedAI: string;
  setSelectedAI: (model: string) => void;

  // Reset
  reset: () => void;

  // Get form data for submission
  getFormData: () => AuditFormData;
}

const DEFAULT_TOOLS: ToolInput[] = [
  { toolId: "cursor", planId: "pro", seats: 3 },
  { toolId: "claude", planId: "pro", seats: 3 },
  { toolId: "github-copilot", planId: "individual", seats: 2 },
];

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      step: "form",
      setStep: (step) => set({ step }),

      currency: "INR",
      setCurrency: (currency) => set({ currency }),

      tools: DEFAULT_TOOLS,
      setTools: (tools) => set({ tools }),
      teamSize: 5,
      useCase: "coding",
      email: "",
      company: "",

      addTool: (tool) => set((s) => ({ tools: [...s.tools, tool] })),
      updateTool: (index, updates) =>
        set((s) => ({
          tools: s.tools.map((t, i) => (i === index ? { ...t, ...updates } : t)),
        })),
      removeTool: (index) =>
        set((s) => ({ tools: s.tools.filter((_, i) => i !== index) })),
      setTeamSize: (teamSize) => set({ teamSize }),
      setUseCase: (useCase) => set({ useCase }),
      setEmail: (email) => set({ email }),
      setCompany: (company) => set({ company }),

      result: null,
      setResult: (result) => set({ result }),
      aiSummary: "",
      setAiSummary: (aiSummary) => set({ aiSummary }),

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      isSubmitting: false,
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

      activeFilter: "all",
      setActiveFilter: (activeFilter) => set({ activeFilter }),

      // AI model selection
      selectedAI: "claude-sonnet-4-20250514",
      setSelectedAI: (selectedAI) => set({ selectedAI }),

      reset: () =>
        set({
          step: "form",
          tools: DEFAULT_TOOLS,
          teamSize: 5,
          useCase: "coding",
          email: "",
          company: "",
          result: null,
          aiSummary: "",
          isLoading: false,
          isSubmitting: false,
          activeFilter: "all",
        }),

      getFormData: () => {
        const s = get();
        return {
          tools: s.tools,
          teamSize: s.teamSize,
          useCase: s.useCase,
          email: s.email || undefined,
          company: s.company || undefined,
        };
      },
    }),
    {
      name: "credex-audit-store-v2",
      partialize: (state) => ({
        tools: state.tools,
        teamSize: state.teamSize,
        useCase: state.useCase,
        email: state.email,
        company: state.company,
        currency: state.currency,
        result: state.result,
        step: state.step,
      }),
    }
  )
);
