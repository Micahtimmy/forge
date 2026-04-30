"use client";

import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  jobTitle: string;
  timezone: string;
  avatarUrl: string | null;
  role: string;
  workspaceId: string;
  workspaceName: string;
}

async function fetchUserProfile(): Promise<UserProfile | null> {
  const response = await fetch("/api/user/profile");
  if (!response.ok) {
    if (response.status === 401) return null;
    throw new Error("Failed to fetch user profile");
  }
  return response.json();
}

export function useUser() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
