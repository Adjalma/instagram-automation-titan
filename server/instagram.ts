import { exec } from "child_process";
import { promisify } from "util";
import { getPostById, getPostMedia, getAccountById, updatePost } from "./db";
import { storageGetSignedUrl } from "./storage";

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
    // Convert relative /manus-storage/ URLs to public absolute URLs for Instagram
    const mediaItems = await Promise.all(
      media.map(async (m: any) => {
        let mediaUrl: string = m.mediaUrl;
        if (mediaUrl.startsWith("/manus-storage/")) {
          const key = mediaUrl.replace("/manus-storage/", "");
          mediaUrl = await storageGetSignedUrl(key);
        }
        return { type: m.mediaType || "image", media_url: mediaUrl };
      })
    );

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

    // Parse result — MCP saves JSON to a temp file, path is in stdout
    let result: any = {};
    try {
      const fileMatch = stdout.match(/saved to: (.+\.json)/);
      if (fileMatch) {
        const { readFileSync } = await import("fs");
        const fileContent = readFileSync(fileMatch[1].trim(), "utf-8");
        result = JSON.parse(fileContent);
      }
    } catch (e) {
      console.warn(`[Instagram] Could not parse MCP result file:`, e);
    }

    // MCP result structure: { success: true, result: { media: { id, permalink, status } } }
    const mcpMedia = (result as any)?.result?.media as any;
    const instagramId: string | null = mcpMedia?.id || mcpMedia?.permalink || null;
    const isPublished: boolean = mcpMedia?.status === "published" || !!instagramId;

    if (isPublished && instagramId) {
      await updatePost(postId, {
        status: "published",
        publishedAt: new Date(),
        instagramPostId: instagramId,
        instagramPermalink: mcpMedia?.permalink || null,
        mcpPending: 0,
      });
      return { success: true, instagramPostId: instagramId };
    } else if ((result as any)?.success) {
      // MCP accepted the command but awaiting UI card confirmation
      await updatePost(postId, { status: "approved", mcpPending: 1 });
      return { success: true, instagramPostId: undefined };
    } else {
      const errMsg = (result as any)?.error || stderr || "MCP returned no result";
      return { success: false, error: errMsg };
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
