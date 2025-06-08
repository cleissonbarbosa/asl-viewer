import { parseDefinitionString } from "../loader";

describe("YAML Parser - Choice workflow", () => {
  it("should parse choice workflow YAML correctly", () => {
    const yamlString = `# AWS Step Functions State Machine Definition in YAML
Comment: "A workflow example with choice logic in YAML format"
StartAt: "CheckInput"
States:
  CheckInput:
    Type: "Choice"
    Choices:
      - Variable: "$.inputType"
        StringEquals: "process"
        Next: "ProcessData"
      - Variable: "$.inputType"
        StringEquals: "validate"
        Next: "ValidateData"
    Default: "DefaultAction"
  
  ProcessData:
    Type: "Task"
    Resource: "arn:aws:lambda:us-east-1:123456789012:function:ProcessData"
    Next: "Success"
  
  ValidateData:
    Type: "Task"
    Resource: "arn:aws:lambda:us-east-1:123456789012:function:ValidateData"
    Next: "Success"
  
  DefaultAction:
    Type: "Pass"
    Result: "No action taken"
    Next: "Success"
  
  Success:
    Type: "Succeed"`;

    const result = parseDefinitionString(yamlString);

    expect(result.Comment).toBe(
      "A workflow example with choice logic in YAML format",
    );
    expect(result.StartAt).toBe("CheckInput");
    expect(result.States.CheckInput.Type).toBe("Choice");
    expect(result.States.CheckInput.Choices).toBeDefined();
    expect(Array.isArray(result.States.CheckInput.Choices)).toBe(true);
    expect(result.States.CheckInput.Choices).toHaveLength(2);
    expect(result.States.CheckInput.Choices![0].Variable).toBe("$.inputType");
    expect(result.States.CheckInput.Choices![0].StringEquals).toBe("process");
    expect(result.States.CheckInput.Choices![0].Next).toBe("ProcessData");
    expect(result.States.CheckInput.Default).toBe("DefaultAction");
  });
});
