import { invokeLLM } from "./_core/llm";
import { Product } from "../drizzle/schema";

export interface SemanticSearchResult {
  product: Product;
  relevanceScore: number;
  reasoning: string;
}

/**
 * Performs AI-powered semantic search on products
 * Uses Claude to understand natural language queries and rank results
 */
export async function semanticSearch(
  query: string,
  products: Product[],
  limit: number = 10
): Promise<SemanticSearchResult[]> {
  if (!query.trim() || products.length === 0) {
    return [];
  }

  // Prepare product data for AI analysis
  const productSummaries = products.slice(0, 100).map((p, idx) => ({
    index: idx,
    sku: p.sku,
    name: p.name,
    application: p.application || "",
    years: p.years || "",
    precision_number: p.precision_number || "",
    quality_number: p.quality_number || "",
    driver_bellow: p.driver_bellow || "",
    passenger_bellow: p.passenger_bellow || "",
    tie_rod_driver: p.tie_rod_driver || "",
    tie_rod_passenger: p.tie_rod_passenger || "",
    category: p.category || "",
    oe_number: p.oe_number || "",
  }));

  const prompt = `You are an expert automotive parts specialist helping to find steering rack components.

User Query: "${query}"

Available Products (showing up to 100):
${JSON.stringify(productSummaries, null, 2)}

Analyze the user's query and return the most relevant products. Consider:
- Vehicle make, model, and year ranges
- Component types (bellows, tie rods, bushings, etc.)
- Part numbers (SKU, Precision #, Quality #, OE #)
- Applications and compatibility
- Natural language understanding (e.g., "2005 Mazda" should match years containing "00-05" or "90-91")

Return ONLY a JSON array of results, ordered by relevance (most relevant first). Include up to ${limit} results.
Each result must have:
- index: the product index from the input array
- relevanceScore: 0-100 (100 = perfect match)
- reasoning: brief explanation of why this product matches (1-2 sentences)

Example format:
[
  {
    "index": 0,
    "relevanceScore": 95,
    "reasoning": "Exact match for Mazda 929 DOHC from years 90-91, which includes the requested 2005 model year."
  }
]`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a precise automotive parts search assistant. Always return valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "search_results",
          strict: true,
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer" },
                    relevanceScore: { type: "integer" },
                    reasoning: { type: "string" },
                  },
                  required: ["index", "relevanceScore", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["results"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      console.error("[AI Search] No content in response");
      return [];
    }

    const parsed = JSON.parse(content);
    const aiResults = parsed.results || [];

    // Map AI results back to products
    const results: SemanticSearchResult[] = aiResults
      .filter((r: any) => r.index >= 0 && r.index < products.length)
      .map((r: any) => ({
        product: products[r.index],
        relevanceScore: r.relevanceScore,
        reasoning: r.reasoning,
      }))
      .sort((a: SemanticSearchResult, b: SemanticSearchResult) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error("[AI Search] Error:", error);
    return [];
  }
}

