/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Current Implementation (SQLite Dev Mode):
 * - Uses keyword-based search against OrientationContent
 * - Returns relevant content as context for the AI assistant
 *
 * Production Implementation Notes (PostgreSQL + pgvector):
 * - Replace keyword search with vector similarity search
 * - Add embedding generation using OpenAI text-embedding-3-small
 * - Store embeddings in a pgvector column on OrientationContent
 * - Use cosine similarity for document retrieval
 * - Consider adding a separate DocumentChunk table for larger documents
 *
 * Migration path:
 * 1. Add `embedding Float[]` column to OrientationContent (or new table)
 * 2. Generate embeddings for all existing content on migration
 * 3. Replace searchDocuments() with vector similarity query
 * 4. Add embedding generation to content creation/update flow
 */

import { db } from "@/server/db";

interface RetrievedDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  relevanceScore: number;
}

/**
 * Search for relevant documents based on a query.
 * In dev mode (SQLite), uses simple keyword matching.
 * In production, would use pgvector similarity search.
 */
export async function searchDocuments(query: string, limit: number = 3): Promise<RetrievedDocument[]> {
  // Extract keywords from query (simple tokenization)
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word));

  if (keywords.length === 0) {
    return [];
  }

  // Search orientation content using keyword matching
  // In production, replace with: SELECT * FROM orientation_content ORDER BY embedding <=> query_embedding LIMIT $limit
  const allContent = await db.orientationContent.findMany({
    where: { isPublished: true },
  });

  // Score each document based on keyword matches
  const scored = allContent.map((doc) => {
    const docText = `${doc.title} ${doc.content}`.toLowerCase();
    let score = 0;

    for (const keyword of keywords) {
      if (docText.includes(keyword)) {
        // Title matches are worth more
        if (doc.title.toLowerCase().includes(keyword)) {
          score += 3;
        }
        // Count occurrences in content
        const matches = docText.split(keyword).length - 1;
        score += Math.min(matches, 5); // Cap at 5 per keyword
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      relevanceScore: score,
    };
  });

  // Return top results with non-zero scores
  return scored
    .filter((doc) => doc.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Build an augmented prompt with retrieved context.
 * Formats retrieved documents into a context string for the LLM.
 */
export function buildAugmentedContext(documents: RetrievedDocument[]): string | undefined {
  if (documents.length === 0) {
    return undefined;
  }

  const contextParts = documents.map((doc, index) => {
    // Truncate content to avoid exceeding token limits
    const truncatedContent = doc.content.length > 500
      ? doc.content.slice(0, 500) + "..."
      : doc.content;

    return `[Document ${index + 1}] (Category: ${formatCategory(doc.category)})
Title: ${doc.title}
Content: ${truncatedContent}`;
  });

  return contextParts.join("\n\n");
}

/**
 * Full RAG pipeline: search documents and build context
 */
export async function getRAGContext(query: string): Promise<string | undefined> {
  const documents = await searchDocuments(query);
  return buildAugmentedContext(documents);
}

// Helper: format category for display
function formatCategory(category: string): string {
  const map: Record<string, string> = {
    ACADEMIC: "Academic",
    CULTURAL: "Cultural",
    SAFETY_EMERGENCY: "Safety & Emergency",
    STUDENT_LIFE: "Student Life",
    ABOUT_UB_ISSO: "About UB/ISSO",
  };
  return map[category] || category;
}

// Common English stop words to filter from search queries
const STOP_WORDS = new Set([
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "but",
  "in", "with", "to", "for", "of", "not", "no", "can", "will", "do",
  "does", "did", "has", "have", "had", "was", "were", "be", "been",
  "are", "am", "it", "its", "this", "that", "these", "those", "my",
  "your", "his", "her", "our", "their", "what", "how", "when", "where",
  "who", "why", "i", "me", "we", "you", "he", "she", "they", "them",
]);
