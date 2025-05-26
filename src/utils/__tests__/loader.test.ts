import { parseDefinitionString, loadFromFile } from "../loader";
import { ASLDefinition } from "../../types";

// Mock FileReader for Node.js test environment
class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsText(file: File) {
    setTimeout(() => {
      if (file.name.includes("invalid")) {
        this.onerror?.();
        return;
      }

      // Create mock content based on file
      let content: string;
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        content = JSON.stringify({
          Comment: "Test workflow",
          StartAt: "Hello",
          States: {
            Hello: {
              Type: "Pass",
              Result: "Hello World!",
              End: true,
            },
          },
        });
      } else {
        content = `
Comment: "Test workflow"
StartAt: "Hello"
States:
  Hello:
    Type: "Pass"
    Result: "Hello World!"
    End: true
        `;
      }

      this.result = content;
      this.onload?.({ target: { result: content } });
    }, 10);
  }
}

(global as any).FileReader = MockFileReader;

describe("Loader utilities", () => {
  describe("parseDefinitionString", () => {
    it("should parse JSON string correctly", () => {
      const jsonString = `{
        "Comment": "Test workflow",
        "StartAt": "Hello",
        "States": {
          "Hello": {
            "Type": "Pass",
            "Result": "Hello World!",
            "End": true
          }
        }
      }`;

      const result = parseDefinitionString(jsonString);
      expect(result.Comment).toBe("Test workflow");
      expect(result.StartAt).toBe("Hello");
      expect(result.States.Hello.Type).toBe("Pass");
    });

    it("should parse YAML string correctly", () => {
      const yamlString = `
Comment: "Test workflow"
StartAt: "Hello"
States:
  Hello:
    Type: "Pass"
    Result: "Hello World!"
    End: true
      `;

      const result = parseDefinitionString(yamlString);
      expect(result.Comment).toBe("Test workflow");
      expect(result.StartAt).toBe("Hello");
      expect(result.States.Hello.Type).toBe("Pass");
    });

    it("should handle YAML with numbers and booleans", () => {
      const yamlString = `
Comment: "Test workflow"
StartAt: "Wait"
States:
  Wait:
    Type: "Wait"
    Seconds: 5
    Next: "Success"
  Success:
    Type: "Succeed"
      `;

      const result = parseDefinitionString(yamlString);
      expect(result.States.Wait.Seconds).toBe(5);
      expect(typeof result.States.Wait.Seconds).toBe("number");
    });
  });

  describe("loadFromFile", () => {
    it("should load JSON file correctly", async () => {
      const jsonContent = JSON.stringify({
        Comment: "Test workflow",
        StartAt: "Hello",
        States: {
          Hello: {
            Type: "Pass",
            Result: "Hello World!",
            End: true,
          },
        },
      });

      const file = new File([jsonContent], "test.json", {
        type: "application/json",
      });
      const result = await loadFromFile(file);

      expect(result.Comment).toBe("Test workflow");
      expect(result.StartAt).toBe("Hello");
    });

    it("should load YAML file correctly", async () => {
      const yamlContent = `
Comment: "Test workflow"
StartAt: "Hello"
States:
  Hello:
    Type: "Pass"
    Result: "Hello World!"
    End: true
      `;

      const file = new File([yamlContent], "test.yaml", {
        type: "application/yaml",
      });
      const result = await loadFromFile(file);

      expect(result.Comment).toBe("Test workflow");
      expect(result.StartAt).toBe("Hello");
    });

    it("should handle file read errors", async () => {
      const invalidContent = "{invalid json}";
      const file = new File([invalidContent], "invalid.json", {
        type: "application/json",
      });

      await expect(loadFromFile(file)).rejects.toThrow();
    });
  });
});
