import * as fs from "fs";
import * as path from "path";

/**
 * Checks if the given Firestore error is a RESOURCE_EXHAUSTED error (quota limits hit).
 * This includes checking numeric code 8, string representation, or string keywords.
 */
export function isResourceExhausted(error: any): boolean {
  if (!error) return false;
  const code = error.code;
  const msg = error.message ? error.message.toString() : "";
  return (
    code === 8 ||
    code === "RESOURCE_EXHAUSTED" ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("resource exhausted")
  );
}

/**
 * Returns seeded demo data from db_mock.json as a fallback array.
 * Converts document maps into array responses to preserve API response shapes.
 */
export function getFallbackData(collectionName: string): any[] {
  try {
    const filePath = path.resolve(__dirname, "../db_mock.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const fullData = JSON.parse(fileContent);
      const collectionData = fullData[collectionName] || {};
      // Convert mapping object values to a list preserving API response structure
      return Object.values(collectionData);
    } else {
      console.warn(`db_mock.json file not found at expected path: ${filePath}`);
    }
  } catch (err) {
    console.error(`Failed to read fallback data for collection '${collectionName}':`, err);
  }
  return [];
}
