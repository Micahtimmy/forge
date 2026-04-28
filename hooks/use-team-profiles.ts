"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TeamMemberProfile,
  TeamAnalytics,
  Skill,
} from "@/lib/db/queries/team-profiles";

interface ProfilesResponse {
  profiles: TeamMemberProfile[];
  analytics?: TeamAnalytics;
}

interface ProfileResponse {
  profile: TeamMemberProfile;
  metricsHistory?: Array<{
    id: string;
    period_start: string;
    period_end: string;
    stories_completed: number;
    points_completed: number;
    avg_cycle_time_days: number | null;
    quality_score: number | null;
  }>;
}

interface CapacityResponse {
  totalCapacity: number;
  availableCapacity: number;
  byMember: Array<{
    userId: string;
    name: string;
    capacity: number;
    availability: string;
  }>;
}

// ============================================
// TEAM PROFILES
// ============================================

export function useTeamProfiles(options: { includeAnalytics?: boolean } = {}) {
  const params = new URLSearchParams();
  if (options.includeAnalytics) params.set("analytics", "true");

  return useQuery<ProfilesResponse>({
    queryKey: ["team-profiles", options],
    queryFn: async () => {
      const res = await fetch(`/api/team/profiles?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch team profiles");
      }
      return res.json();
    },
  });
}

export function useTeamProfile(
  userId: string | undefined,
  options: { includeHistory?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (options.includeHistory) params.set("history", "true");

  return useQuery<ProfileResponse>({
    queryKey: ["team-profile", userId, options],
    queryFn: async () => {
      const res = await fetch(
        `/api/team/profiles/${userId}?${params.toString()}`
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUpsertTeamProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      user_id: string;
      specializations?: string[];
      skills?: Skill[];
      preferred_work_types?: string[];
      capacity_percentage?: number;
      timezone?: string | null;
      availability_status?: "available" | "limited" | "unavailable";
      notes?: string | null;
    }) => {
      const res = await fetch("/api/team/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (_, { user_id }) => {
      queryClient.invalidateQueries({ queryKey: ["team-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["team-profile", user_id] });
    },
  });
}

// ============================================
// TEAM CAPACITY
// ============================================

export function useTeamCapacity() {
  return useQuery<CapacityResponse>({
    queryKey: ["team-capacity"],
    queryFn: async () => {
      const res = await fetch("/api/team/capacity");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch capacity");
      }
      return res.json();
    },
  });
}

// ============================================
// TEAM SKILLS
// ============================================

export function useTeamMembersBySkill(
  skill: string | undefined,
  minLevel?: "beginner" | "intermediate" | "advanced" | "expert"
) {
  const params = new URLSearchParams();
  if (skill) params.set("skill", skill);
  if (minLevel) params.set("minLevel", minLevel);

  return useQuery<{ profiles: TeamMemberProfile[] }>({
    queryKey: ["team-skills", skill, minLevel],
    queryFn: async () => {
      const res = await fetch(`/api/team/skills?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to search by skill");
      }
      return res.json();
    },
    enabled: !!skill,
  });
}

// ============================================
// DERIVED HOOKS
// ============================================

export function useTeamAnalytics() {
  const { data } = useTeamProfiles({ includeAnalytics: true });
  return data?.analytics || null;
}

export function useAvailableTeamMembers() {
  const { data } = useTeamProfiles();
  return (
    data?.profiles?.filter((p) => p.visibility !== "self_only") || []
  );
}
