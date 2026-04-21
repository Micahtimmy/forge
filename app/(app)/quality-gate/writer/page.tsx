"use client";

import { PageHeader } from "@/components/layout/page-header";
import { StoryWriter } from "@/components/quality-gate/story-writer";
import { InfoPanel } from "@/components/ui/info-tip";

export default function StoryWriterPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Story Writer"
        description="Transform brief ideas into well-structured, ready-to-refine user stories"
      />

      <div className="space-y-6">
        <InfoPanel termKey="acceptanceCriteria" />
        <StoryWriter />
      </div>
    </div>
  );
}
