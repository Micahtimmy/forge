/**
 * Demo Store - Role switching and demo state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/lib/onboarding/roles';

interface DemoState {
  selectedRole: UserRole;
  setRole: (role: UserRole) => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      selectedRole: 'scrum_master',
      setRole: (role) => set({ selectedRole: role }),
    }),
    {
      name: 'forge-demo-store',
    }
  )
);
