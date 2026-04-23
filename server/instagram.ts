import { exec } from "child_process";
import { promisify } from "util";
import { getPostById, getPostMedia, getAccountById, updatePost } from "./db";

const execAsync = promisify(exec);

/**
 * Publish a post to Instagram via MCP tool.
 * This calls the manus-mcp-cli to create an Instagram post.
 * Note: The MCP tool requires UI confirmation before publishing.
 */
export async function publishToInstagram(postId: number): Promise<{
  success: boolean;
  error?: string;
  instagramPostId?: string;
}> {
  try {
    const post = await getPostById(postId);
    if (!post) return { success: false, error: "Post not found" };

    const account = await getAccountById(post.accountId);
    if (!account) return { success: false, error: "Account not found" };

    const media = await getPostMedia(postId);
    if (!media || media.length === 0) {
      return { success: false, error: "Post has no media attached" };
    }

    // Build the media array for the MCP tool
    const mediaItems = media.map((m: any) => ({
      type: m.mediaType || "image",
      media_url: m.mediaUrl,
    }));

    // Build the MCP command input
    const mcpInput = JSON.stringify({
      type: "post",
      caption: post.caption || "",
      media: mediaItems,
    });

    // Execute the MCP command
    const { stdout, stderr } = await execAsync(
      `manus-mcp-cli tool call create_instagram --server instagram --input '${mcpInput.replace(/'/g, "'\\''")}'`,
      { timeout: 60000 }
    );

    // Parse result
    let result: any = {};
    try {
      // The MCP tool saves results to a file, check stdout for the path
      const fileMatch = stdout.match(/saved to: (.+\.json)/);
      if (fileMatch) {
        const { readFileSync } = await import("fs");
        const fileContent = readFileSync(fileMatch[1], "utf-8");
        result = JSON.parse(fileContent);
      }
    } catch (e) {
      // If we can't parse, that's okay - the MCP might show a UI card
    }

    // The MCP tool shows a UI confirmation card before publishing.
    // If the MCP returned an ID (post was confirmed and published), mark as published.
    // Otherwise, mark mcpPending=1 so the UI shows "Aguardando confirmação MCP".
    const instagramId = result?.id || result?.permalink || null;
    if (instagramId) {
      await updatePost(postId, {
        status: "published",
        publishedAt: new Date(),
        instagramPostId: instagramId,
        mcpPending: 0,
      });
      return { success: true, instagramPostId: instagramId };
    } else {
      // MCP command sent successfully - awaiting user confirmation in Manus UI card
      await updatePost(postId, { status: "approved", mcpPending: 1 });
      return { success: true, instagramPostId: undefined };
    }
  } catch (error: any) {
    console.error(`[Instagram] Failed to publish post ${postId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch insights for a published post from Instagram.
 */
export async function fetchPostInsights(instagramPostId: string): Promise<{
  likes?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
}> {
  try {
    const mcpInput = JSON.stringify({ post_id: instagramPostId });
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call get_post_insights --server instagram --input '${mcpInput.replace(/'/g, "'\\''")}'`,
      { timeout: 30000 }
    );

    const fileMatch = stdout.match(/saved to: (.+\.json)/);
    if (fileMatch) {
      const { readFileSync } = await import("fs");
      const fileContent = readFileSync(fileMatch[1], "utf-8");
      const data = JSON.parse(fileContent);
      return {
        likes: data?.likes ?? data?.like_count ?? 0,
        comments: data?.comments ?? data?.comment_count ?? 0,
        reach: data?.reach ?? 0,
        impressions: data?.impressions ?? 0,
      };
    }
    return {};
  } catch (error: any) {
    console.error(`[Instagram] Failed to fetch insights:`, error.message);
    return {};
  }
}

/**
 * Check for scheduled posts that are due and publish them.
 * This should be called periodically (e.g., every 5 minutes).
 */
export async function processScheduledPosts(): Promise<{
  processed: number;
  published: number;
  errors: string[];
}> {
  const { getPostsByStatus } = await import("./db");
  const scheduledPosts = await getPostsByStatus("scheduled");
  const now = new Date();
  let processed = 0;
  let published = 0;
  const errors: string[] = [];

  for (const post of scheduledPosts) {
    const p = post as any;
    if (p.scheduledAt && new Date(p.scheduledAt) <= now) {
      processed++;
      const result = await publishToInstagram(p.id);
      if (result.success) {
        published++;
      } else {
        errors.push(`Post ${p.id}: ${result.error}`);
      }
    }
  }

  return { processed, published, errors };
}
