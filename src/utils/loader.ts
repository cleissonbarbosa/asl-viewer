import * as yaml from "js-yaml";
import { ASLDefinition } from "../types";

/**
 * Parse YAML content to JSON using js-yaml library
 */
function parseYAML(yamlContent: string): any {
  try {
    return yaml.load(yamlContent, {
      // Use safe loading to prevent code execution
      schema: yaml.DEFAULT_SCHEMA,
    });
  } catch (error) {
    throw new Error(
      `Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Load ASL definition from a URL
 */
export async function loadFromURL(url: string): Promise<ASLDefinition> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (contentType.includes("application/json") || url.endsWith(".json")) {
      return JSON.parse(text);
    } else if (
      contentType.includes("application/yaml") ||
      contentType.includes("text/yaml") ||
      url.endsWith(".yaml") ||
      url.endsWith(".yml")
    ) {
      return parseYAML(text);
    } else {
      // Try to parse as JSON first, then YAML
      try {
        return JSON.parse(text);
      } catch {
        return parseYAML(text);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to load from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Load ASL definition from a File object
 */
export async function loadFromFile(file: File): Promise<ASLDefinition> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.type === "application/json" || file.name.endsWith(".json")) {
          resolve(JSON.parse(text));
        } else if (
          file.type === "application/yaml" ||
          file.type === "text/yaml" ||
          file.name.endsWith(".yaml") ||
          file.name.endsWith(".yml")
        ) {
          resolve(parseYAML(text));
        } else {
          // Try to parse as JSON first, then YAML
          try {
            resolve(JSON.parse(text));
          } catch {
            resolve(parseYAML(text));
          }
        }
      } catch (error) {
        reject(
          new Error(
            `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse ASL definition from string
 */
export function parseDefinitionString(definition: string): ASLDefinition {
  try {
    // Try JSON first
    return JSON.parse(definition);
  } catch {
    // Try YAML
    return parseYAML(definition);
  }
}
