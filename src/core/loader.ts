import * as yaml from "js-yaml";
import { ASLDefinition } from "../types";

/**
 * Custom YAML schema that handles CloudFormation intrinsic functions
 */
const CloudFormationSchema = yaml.DEFAULT_SCHEMA.extend([
  // Handle !Ref
  new yaml.Type("!Ref", {
    kind: "scalar",
    construct: function (data) {
      return { Ref: data };
    },
  }),

  // Handle !GetAtt - both formats
  new yaml.Type("!GetAtt", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::GetAtt": data };
    },
  }),
  new yaml.Type("!GetAtt", {
    kind: "scalar",
    construct: function (data) {
      return { "Fn::GetAtt": data.split(".") };
    },
  }),

  // Handle !Join
  new yaml.Type("!Join", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Join": data };
    },
  }),

  // Handle !Sub
  new yaml.Type("!Sub", {
    kind: "scalar",
    construct: function (data) {
      return { "Fn::Sub": data };
    },
  }),
  new yaml.Type("!Sub", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Sub": data };
    },
  }),

  // Handle other CloudFormation functions
  new yaml.Type("!Base64", {
    kind: "scalar",
    construct: function (data) {
      return { "Fn::Base64": data };
    },
  }),
  new yaml.Type("!If", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::If": data };
    },
  }),
  new yaml.Type("!Not", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Not": data };
    },
  }),
  new yaml.Type("!Equals", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Equals": data };
    },
  }),
  new yaml.Type("!And", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::And": data };
    },
  }),
  new yaml.Type("!Or", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Or": data };
    },
  }),
  new yaml.Type("!FindInMap", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::FindInMap": data };
    },
  }),
  new yaml.Type("!Select", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Select": data };
    },
  }),
  new yaml.Type("!Split", {
    kind: "sequence",
    construct: function (data) {
      return { "Fn::Split": data };
    },
  }),
  new yaml.Type("!ImportValue", {
    kind: "scalar",
    construct: function (data) {
      return { "Fn::ImportValue": data };
    },
  }),
  new yaml.Type("!Condition", {
    kind: "scalar",
    construct: function (data) {
      return { Condition: data };
    },
  }),
]);

/**
 * Parse YAML content to JSON using js-yaml library
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYAML(yamlContent: string): any {
  try {
    // First try with CloudFormation schema to handle intrinsic functions
    return yaml.load(yamlContent, {
      schema: CloudFormationSchema,
    });
  } catch (error) {
    // If CloudFormation schema fails, try with a more permissive approach
    try {
      // Create a custom schema that ignores unknown tags
      const PermissiveSchema = yaml.DEFAULT_SCHEMA.extend([
        new yaml.Type("tag:yaml.org,2002:js/undefined", {
          kind: "scalar",
          resolve: () => true,
          construct: () => undefined,
        }),
      ]);

      return yaml.load(yamlContent, {
        schema: PermissiveSchema,
        onWarning: (warning) => {
          console.warn("YAML parsing warning:", warning);
        },
      });
    } catch {
      // Last resort: try to handle unknown tags by replacing them
      try {
        // Replace CloudFormation intrinsic functions with placeholders
        const sanitizedYaml = yamlContent
          .replace(/!\w+/g, "CF_FUNCTION")
          .replace(/!<[^>]+>/g, "CF_FUNCTION");

        return yaml.load(sanitizedYaml, {
          schema: yaml.DEFAULT_SCHEMA,
        });
      } catch {
        throw new Error(
          `Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }
}

/**
 * Check if the content appears to be a CloudFormation template
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCloudFormationTemplate(content: any): boolean {
  return (
    typeof content === "object" &&
    content !== null &&
    (content.AWSTemplateFormatVersion ||
      content.Transform === "AWS::Serverless-2016-10-31" ||
      (content.Resources && typeof content.Resources === "object"))
  );
}

/**
 * Resolves a CloudFormation `DefinitionString`: a plain JSON string,
 * `!Sub` / `Fn::Sub` (string or [string, variables]) or `Fn::Join`.
 * Unresolvable references are kept as `${...}` placeholders.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDefinitionStringProperty(value: any): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placeholder = (ref: any): string => {
    const getAtt = ref?.["Fn::GetAtt"];
    const name =
      typeof ref?.Ref === "string"
        ? ref.Ref
        : Array.isArray(getAtt)
          ? getAtt.join(".")
          : typeof getAtt === "string"
            ? getAtt
            : "Reference";
    return `\${${name}}`;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toText = (part: any): string | null => {
    if (typeof part === "string") return part;
    if (!part || typeof part !== "object") return null;
    if ("Fn::Sub" in part) {
      const sub = part["Fn::Sub"];
      return typeof sub === "string"
        ? sub
        : Array.isArray(sub) && typeof sub[0] === "string"
          ? sub[0]
          : null;
    }
    if ("Fn::Join" in part && Array.isArray(part["Fn::Join"])) {
      const [separator, parts] = part["Fn::Join"];
      if (!Array.isArray(parts)) return null;
      return parts
        .map((p: unknown) => (typeof p === "string" ? p : placeholder(p)))
        .join(typeof separator === "string" ? separator : "");
    }
    return null;
  };

  const text = toText(value);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extract ASL definition from CloudFormation template
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractASLFromCloudFormation(template: any): ASLDefinition {
  if (!isCloudFormationTemplate(template)) {
    throw new Error("Not a CloudFormation template");
  }

  const resources = template.Resources;
  if (!resources) {
    throw new Error("No Resources section found in CloudFormation template");
  }

  // Look for AWS::StepFunctions::StateMachine or AWS::Serverless::StateMachine
  for (const resource of Object.values(resources)) {
    const res = resource as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (
      res?.Type === "AWS::StepFunctions::StateMachine" ||
      res?.Type === "AWS::Serverless::StateMachine"
    ) {
      const properties = res.Properties ?? {};
      const definition =
        properties.Definition ??
        parseDefinitionStringProperty(properties.DefinitionString);

      // Check if it's a valid ASL definition
      if (
        definition &&
        typeof definition === "object" &&
        definition.StartAt &&
        definition.States
      ) {
        return definition as ASLDefinition;
      }
    }
  }

  throw new Error(
    "No Step Functions state machine definition found in CloudFormation template. " +
      "Please provide a direct ASL definition or a CloudFormation template with a State Machine resource.",
  );
}

/**
 * Load ASL definition from a URL. `init` is forwarded to `fetch`, e.g. to
 * pass headers or an `AbortSignal`.
 */
export async function loadFromURL(
  url: string,
  init?: Parameters<typeof fetch>[1],
): Promise<ASLDefinition> {
  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    let parsed: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (contentType.includes("application/json") || url.endsWith(".json")) {
      parsed = JSON.parse(text);
    } else if (
      contentType.includes("application/yaml") ||
      contentType.includes("text/yaml") ||
      url.endsWith(".yaml") ||
      url.endsWith(".yml")
    ) {
      parsed = parseYAML(text);
    } else {
      // Try to parse as JSON first, then YAML
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = parseYAML(text);
      }
    }

    // Check if it's a CloudFormation template and extract ASL definition
    if (isCloudFormationTemplate(parsed)) {
      return extractASLFromCloudFormation(parsed);
    }

    // Check if it's already an ASL definition
    if (typeof parsed === "object" && parsed.StartAt && parsed.States) {
      return parsed as ASLDefinition;
    }

    throw new Error(
      'Invalid format: Expected an ASL definition with "StartAt" and "States" properties, ' +
        "or a CloudFormation template containing a Step Functions state machine.",
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
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
        let parsed: any; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (file.type === "application/json" || file.name.endsWith(".json")) {
          parsed = JSON.parse(text);
        } else if (
          file.type === "application/yaml" ||
          file.type === "text/yaml" ||
          file.name.endsWith(".yaml") ||
          file.name.endsWith(".yml")
        ) {
          parsed = parseYAML(text);
        } else {
          // Try to parse as JSON first, then YAML
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = parseYAML(text);
          }
        }

        // Check if it's a CloudFormation template and extract ASL definition
        if (isCloudFormationTemplate(parsed)) {
          resolve(extractASLFromCloudFormation(parsed));
          return;
        }

        // Check if it's already an ASL definition
        if (typeof parsed === "object" && parsed.StartAt && parsed.States) {
          resolve(parsed as ASLDefinition);
          return;
        }

        reject(
          new Error(
            'Invalid format: Expected an ASL definition with "StartAt" and "States" properties, ' +
              "or a CloudFormation template containing a Step Functions state machine.",
          ),
        );
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
    let parsed = JSON.parse(definition);

    // Check if it's a CloudFormation template and extract ASL definition
    if (isCloudFormationTemplate(parsed)) {
      return extractASLFromCloudFormation(parsed);
    }

    // Check if it's already an ASL definition
    if (typeof parsed === "object" && parsed.StartAt && parsed.States) {
      return parsed as ASLDefinition;
    }

    throw new Error(
      'Invalid JSON format: Expected an ASL definition with "StartAt" and "States" properties, ' +
        "or a CloudFormation template containing a Step Functions state machine.",
    );
  } catch (jsonError) {
    // Try YAML
    try {
      let parsed = parseYAML(definition);

      // Check if it's a CloudFormation template and extract ASL definition
      if (isCloudFormationTemplate(parsed)) {
        return extractASLFromCloudFormation(parsed);
      }

      // Check if it's already an ASL definition
      if (typeof parsed === "object" && parsed.StartAt && parsed.States) {
        return parsed as ASLDefinition;
      }

      throw new Error(
        'Invalid YAML format: Expected an ASL definition with "StartAt" and "States" properties, ' +
          "or a CloudFormation template containing a Step Functions state machine.",
      );
    } catch (yamlError) {
      throw new Error(
        `Failed to parse as JSON or YAML. JSON error: ${jsonError instanceof Error ? jsonError.message : "Unknown"}. ` +
          `YAML error: ${yamlError instanceof Error ? yamlError.message : "Unknown"}.`,
      );
    }
  }
}
