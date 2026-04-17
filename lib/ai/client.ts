import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Default model for all FORGE AI operations
export const DEFAULT_MODEL = "gemini-2.0-flash";

// Get the generative model instance
export function getModel(modelName: string = DEFAULT_MODEL): GenerativeModel {
  return genAI.getGenerativeModel({ model: modelName });
}

// Pre-configured model instance for general use
export const model = getModel();

// Export the client for advanced use cases
export { genAI };

// Generation config presets
export const GENERATION_CONFIGS = {
  // For scoring - more deterministic
  scoring: {
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
  // For drafting/creative - more varied
  drafting: {
    temperature: 0.7,
    topP: 0.9,
    topK: 50,
    maxOutputTokens: 4096,
  },
  // For analysis - balanced
  analysis: {
    temperature: 0.5,
    topP: 0.85,
    topK: 45,
    maxOutputTokens: 3072,
  },
} as const;

// Safety settings for enterprise use
export const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
];
