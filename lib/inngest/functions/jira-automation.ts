/**
 * JIRA Automation Inngest Functions
 * Background jobs triggered by JIRA webhook events
 */

import { inngest } from '../client';
import { createUntypedAdminClient } from '@/lib/db/client';
import { scoreStory } from '@/lib/ai/score-story';
import { notificationService } from '@/lib/notifications/service';
import type { NotificationCategory, NotificationPriority } from '@/lib/notifications/types';

// Score a single story (triggered by webhook)
export const scoreStoryJob = inngest.createFunction(
  {
    id: 'score-story-webhook',
    name: 'Score Story from JIRA Webhook',
    retries: 2,
    triggers: [{ event: 'forge/story.score' }],
  },
  async ({ event, step }) => {
    const { storyId, workspaceId, triggeredBy } = event.data as {
      storyId: string;
      workspaceId: string;
      triggeredBy: string;
    };

    // Get story details
    const story = await step.run('get-story', async () => {
      const supabase = createUntypedAdminClient();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) throw new Error(`Story not found: ${error.message}`);
      return data;
    });

    // Score the story
    const scoreResult = await step.run('score-story', async () => {
      return scoreStory({
        key: story.jira_key,
        title: story.title,
        description: story.description || null,
        acceptanceCriteria: story.acceptance_criteria || null,
        storyPoints: story.story_points || null,
        epicKey: story.epic_key || null,
        labels: story.labels || null,
      });
    });

    // Save the score
    await step.run('save-score', async () => {
      const supabase = createUntypedAdminClient();
      await supabase
        .from('story_scores')
        .upsert({
          story_id: storyId,
          workspace_id: workspaceId,
          total_score: scoreResult.totalScore,
          dimensions: scoreResult.dimensions,
          suggestions: scoreResult.suggestions,
          scored_by: 'gemini',
          triggered_by: triggeredBy,
          updated_at: new Date().toISOString(),
        });
    });

    // If score is low, send notification
    if (scoreResult.totalScore < 50) {
      await step.run('notify-low-score', async () => {
        await notificationService.send({
          workspaceId,
          category: 'story_quality' as NotificationCategory,
          priority: (scoreResult.totalScore < 30 ? 'high' : 'normal') as NotificationPriority,
          title: `Low Quality Score: ${story.jira_key}`,
          body: `Story "${story.title}" scored ${scoreResult.totalScore}/100. Consider reviewing before sprint planning.`,
          actionUrl: `/quality-gate/story/${storyId}`,
          actionLabel: 'Review Story',
        });
      });
    }

    return {
      storyId,
      score: scoreResult.totalScore,
      triggeredBy,
    };
  }
);

// Send notification (multi-channel)
export const sendNotificationJob = inngest.createFunction(
  {
    id: 'send-notification',
    name: 'Send Notification',
    retries: 3,
    triggers: [{ event: 'forge/notification.send' }],
  },
  async ({ event, step }) => {
    const { workspaceId, notification } = event.data as {
      workspaceId: string;
      notification: {
        category: NotificationCategory;
        priority: NotificationPriority;
        title: string;
        body: string;
        actionUrl?: string;
        actionLabel?: string;
      };
    };

    await step.run('send-notification', async () => {
      await notificationService.send({
        workspaceId,
        category: notification.category || 'system',
        priority: notification.priority || 'normal',
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
      });
    });

    return { sent: true };
  }
);

// Auto-update signal based on JIRA changes
export const autoUpdateSignalJob = inngest.createFunction(
  {
    id: 'auto-update-signal',
    name: 'Auto-update Signal from JIRA',
    retries: 2,
    triggers: [{ event: 'forge/signal.auto-update' }],
  },
  async ({ event, step }) => {
    const { workspaceId, issueKey, changes } = event.data as {
      workspaceId: string;
      issueKey: string;
      changes: Array<{ field: string; fromString: string | null; toString: string | null }>;
    };

    // Check if there's an active signal update for this sprint
    const activeUpdate = await step.run('find-active-signal', async () => {
      const supabase = createUntypedAdminClient();

      // Get the story's sprint
      const { data: story } = await supabase
        .from('stories')
        .select('sprint_id')
        .eq('workspace_id', workspaceId)
        .eq('jira_key', issueKey)
        .single();

      if (!story?.sprint_id) return null;

      // Find a draft signal update for this sprint
      const { data: signalUpdate } = await supabase
        .from('signal_updates')
        .select('id, content')
        .eq('workspace_id', workspaceId)
        .eq('sprint_id', story.sprint_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return signalUpdate;
    });

    if (!activeUpdate) {
      return { updated: false, reason: 'No active signal update found' };
    }

    // Append the change to the signal update
    await step.run('append-change', async () => {
      const supabase = createUntypedAdminClient();

      const changeDescription = changes
        .map(c => `${c.field}: ${c.fromString || 'none'} → ${c.toString || 'none'}`)
        .join('; ');

      const newContent = `${activeUpdate.content}\n\n**Auto-detected change (${issueKey}):** ${changeDescription}`;

      await supabase
        .from('signal_updates')
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeUpdate.id);
    });

    return { updated: true, signalUpdateId: activeUpdate.id };
  }
);

// Batch score sprint stories
export const batchScoreSprintJob = inngest.createFunction(
  {
    id: 'batch-score-sprint',
    name: 'Batch Score Sprint Stories',
    retries: 1,
    concurrency: {
      limit: 1,
      key: 'event.data.workspaceId',
    },
    triggers: [{ event: 'forge/sprint.score-all' }],
  },
  async ({ event, step }) => {
    const { sprintId, workspaceId, triggeredBy } = event.data as {
      sprintId: number;
      workspaceId: string;
      triggeredBy: string;
    };

    // Get all stories in the sprint
    const stories = await step.run('get-sprint-stories', async () => {
      const supabase = createUntypedAdminClient();
      const { data, error } = await supabase
        .from('stories')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('sprint_id', sprintId);

      if (error) throw new Error(`Failed to get stories: ${error.message}`);
      return data || [];
    });

    // Score each story (with rate limiting)
    let scored = 0;
    let failed = 0;

    for (const story of stories) {
      try {
        await step.run(`score-${story.id}`, async () => {
          await inngest.send({
            name: 'forge/story.score',
            data: {
              storyId: story.id,
              workspaceId,
              triggeredBy: 'batch_score',
            },
          });
        });
        scored++;

        // Rate limit: wait 1 second between API calls
        await step.sleep('rate-limit', '1s');
      } catch (error) {
        failed++;
        console.error(`Failed to score story ${story.id}:`, error);
      }
    }

    // Send completion notification
    await step.run('notify-completion', async () => {
      await notificationService.send({
        workspaceId,
        category: 'story_quality',
        priority: 'normal',
        title: 'Sprint Scoring Complete',
        body: `Scored ${scored} stories (${failed} failed) in sprint.`,
        actionUrl: `/quality-gate`,
        actionLabel: 'View Results',
      });
    });

    return { total: stories.length, scored, failed, triggeredBy };
  }
);

// Sprint started automation
export const sprintStartedJob = inngest.createFunction(
  {
    id: 'sprint-started-automation',
    name: 'Sprint Started Automation',
    retries: 2,
    triggers: [{ event: 'forge/sprint.started' }],
  },
  async ({ event, step }) => {
    const { sprintId, workspaceId, sprintName } = event.data as {
      sprintId: number;
      workspaceId: string;
      sprintName: string;
    };

    // Create a new signal update draft for the sprint
    const signalUpdate = await step.run('create-signal-update', async () => {
      const supabase = createUntypedAdminClient();

      const { data, error } = await supabase
        .from('signal_updates')
        .insert({
          workspace_id: workspaceId,
          sprint_id: sprintId,
          title: `${sprintName} Update`,
          status: 'draft',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create signal update: ${error.message}`);
      return data;
    });

    // Notify team
    await step.run('notify-sprint-start', async () => {
      await notificationService.send({
        workspaceId,
        category: 'pi_planning',
        priority: 'normal',
        title: `Sprint Started: ${sprintName}`,
        body: 'A new signal update draft has been created for this sprint.',
        actionUrl: `/signal/${signalUpdate.id}`,
        actionLabel: 'View Draft',
      });
    });

    // Auto-score all stories in the sprint
    await step.run('trigger-scoring', async () => {
      await inngest.send({
        name: 'forge/sprint.score-all',
        data: {
          sprintId,
          workspaceId,
          triggeredBy: 'sprint_start',
        },
      });
    });

    return { signalUpdateId: signalUpdate.id, sprintName };
  }
);

// Sprint closed automation
export const sprintClosedJob = inngest.createFunction(
  {
    id: 'sprint-closed-automation',
    name: 'Sprint Closed Automation',
    retries: 2,
    triggers: [{ event: 'forge/sprint.closed' }],
  },
  async ({ event, step }) => {
    const { sprintId, workspaceId, sprintName, metrics } = event.data as {
      sprintId: number;
      workspaceId: string;
      sprintName: string;
      metrics?: { completionRate: number };
    };

    // Generate sprint retrospective insights
    const insights = await step.run('generate-insights', async () => {
      const supabase = createUntypedAdminClient();

      // Get sprint metrics
      const { data: scores } = await supabase
        .from('story_scores')
        .select('total_score')
        .eq('workspace_id', workspaceId);
        // Would filter by sprint_id in real implementation

      const avgScore = scores && scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
        : 0;

      return {
        averageQualityScore: avgScore,
        totalStories: scores?.length || 0,
        completionRate: metrics?.completionRate || 0,
      };
    });

    // Update any draft signal updates to review status
    await step.run('update-signal-drafts', async () => {
      const supabase = createUntypedAdminClient();

      await supabase
        .from('signal_updates')
        .update({
          status: 'review',
          updated_at: new Date().toISOString(),
        })
        .eq('workspace_id', workspaceId)
        .eq('sprint_id', sprintId)
        .eq('status', 'draft');
    });

    // Notify team with sprint summary
    await step.run('notify-sprint-close', async () => {
      await notificationService.send({
        workspaceId,
        category: 'pi_planning',
        priority: 'normal',
        title: `Sprint Closed: ${sprintName}`,
        body: `Completion: ${insights.completionRate}% | Avg Quality: ${insights.averageQualityScore}/100 | Stories: ${insights.totalStories}`,
        actionUrl: `/analytics`,
        actionLabel: 'View Analytics',
      });
    });

    return { sprintName, insights };
  }
);

export const jiraAutomationFunctions = [
  scoreStoryJob,
  sendNotificationJob,
  autoUpdateSignalJob,
  batchScoreSprintJob,
  sprintStartedJob,
  sprintClosedJob,
];
