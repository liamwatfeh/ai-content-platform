// Output Parsers for LangGraph Agents
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import {
  MarketingBriefSchema,
  ThemesOutputSchema,
  ResearchDossierSchema,
  ArticleOutputSchema,
  LinkedInOutputSchema,
  SocialOutputSchema,
} from "../schemas/types";

// Marketing Brief Parser (Agent 1)
export const marketingBriefParser =
  StructuredOutputParser.fromZodSchema(MarketingBriefSchema);

// Themes Output Parser (Agent 2)
export const themesParser =
  StructuredOutputParser.fromZodSchema(ThemesOutputSchema);

// Research Dossier Parser (Agent 3)
export const researchDossierParser =
  StructuredOutputParser.fromZodSchema(ResearchDossierSchema);

// Article Output Parser (Agent 4a)
export const articleParser =
  StructuredOutputParser.fromZodSchema(ArticleOutputSchema);

// LinkedIn Output Parser (Agent 4b)
export const linkedInParser =
  StructuredOutputParser.fromZodSchema(LinkedInOutputSchema);

// Social Media Output Parser (Agent 4c)
export const socialParser =
  StructuredOutputParser.fromZodSchema(SocialOutputSchema);

// Generic parser utility
export function createParser<T>(schema: any) {
  return StructuredOutputParser.fromZodSchema(schema);
}

// Parser mapping for easy access
export const PARSERS = {
  "marketing-brief": marketingBriefParser,
  themes: themesParser,
  "research-dossier": researchDossierParser,
  article: articleParser,
  linkedin: linkedInParser,
  social: socialParser,
} as const;

// Helper function to get format instructions
export function getFormatInstructions(
  parserType: keyof typeof PARSERS
): string {
  return PARSERS[parserType].getFormatInstructions();
}

// Helper function to parse response
export async function parseResponse(
  parserType: keyof typeof PARSERS,
  response: string
): Promise<any> {
  const parser = PARSERS[parserType];
  return await parser.parse(response);
}
