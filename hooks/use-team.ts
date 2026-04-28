/**
 * Team Management Hooks
 * TanStack Query hooks for team member operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TeamMember {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface TeamMembersResponse {
  members: TeamMember[];
}

/**
 * Fetch team members for the current workspace
 */
export function useTeamMembers() {
  return useQuery<TeamMember[], Error>({
    queryKey: ["team", "members"],
    queryFn: async () => {
      const res = await fetch("/api/team/members");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch team members");
      }
      const data: TeamMembersResponse = await res.json();
      return data.members;
    },
    staleTime: 60_000, // 1 minute
  });
}

/**
 * Update a member's role
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { memberId: string; role: "admin" | "member" | "viewer" }
  >({
    mutationFn: async ({ memberId, role }) => {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    },
  });
}

/**
 * Remove a member from the workspace
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { memberId: string }>({
    mutationFn: async ({ memberId }) => {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "members"] });
    },
  });
}
