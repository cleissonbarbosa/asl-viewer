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
    } catch (fallbackError) {
      // Last resort: try to handle unknown tags by replacing them
      try {
        // Replace CloudFormation intrinsic functions with placeholders
        const sanitizedYaml = yamlContent
          .replace(/!\w+/g, "CF_FUNCTION")
          .replace(/!<[^>]+>/g, "CF_FUNCTION");

        return yaml.load(sanitizedYaml, {
          schema: yaml.DEFAULT_SCHEMA,
        });
      } catch (lastError) {
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
 * Extract ASL definition from CloudFormation template
 */
function extractASLFromCloudFormation(template: any): ASLDefinition {
  if (!isCloudFormationTemplate(template)) {
    throw new Error("Not a CloudFormation template");
  }

  const resources = template.Resources;
  if (!resources) {
    throw new Error("No Resources section found in CloudFormation template");
  }

  // Look for AWS::StepFunctions::StateMachine or AWS::Serverless::StateMachine
  for (const [resourceName, resource] of Object.entries(resources)) {
    const res = resource as any;
    if (
      res.Type === "AWS::StepFunctions::StateMachine" ||
      res.Type === "AWS::Serverless::StateMachine"
    ) {
      if (res.Properties && res.Properties.Definition) {
        const definition = res.Properties.Definition;

        // Check if it's a valid ASL definition
        if (
          typeof definition === "object" &&
          definition.StartAt &&
          definition.States
        ) {
          return definition as ASLDefinition;
        }
      }
    }
  }

  throw new Error(
    "No Step Functions state machine definition found in CloudFormation template. " +
      "Please provide a direct ASL definition or a CloudFormation template with a State Machine resource.",
  );
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

    let parsed: any;

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
        let parsed: any;

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
