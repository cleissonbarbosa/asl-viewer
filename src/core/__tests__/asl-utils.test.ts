import {
  describeResource,
  formatChoiceCondition,
  getStateSubtitle,
  getNodeKind,
  orderStatesByFlow,
} from "../asl-utils";
import { StateNode } from "../../types";

describe("describeResource", () => {
  it.each([
    [
      "arn:aws:states:::lambda:invoke",
      { serviceKey: "lambda", service: "Lambda", action: "Invoke" },
    ],
    [
      "arn:aws:states:::dynamodb:putItem",
      { serviceKey: "dynamodb", service: "DynamoDB", action: "PutItem" },
    ],
    [
      "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
      {
        serviceKey: "sqs",
        service: "SQS",
        action: "SendMessage",
        pattern: "Wait for callback",
      },
    ],
    [
      "arn:aws:states:::states:startExecution.sync:2",
      {
        serviceKey: "states",
        service: "Step Functions",
        action: "StartExecution",
        pattern: "Run a job",
      },
    ],
    [
      "arn:aws:states:::aws-sdk:s3:getObject",
      { serviceKey: "s3", service: "S3", action: "GetObject", sdk: true },
    ],
    [
      "arn:aws:lambda:us-east-1:123456789012:function:ProcessOrder",
      { serviceKey: "lambda", service: "Lambda", action: "ProcessOrder" },
    ],
    [
      "arn:aws:states:us-east-1:123456789012:activity:Approve",
      { serviceKey: "activity", service: "Activity", action: "Approve" },
    ],
  ])("describes %s", (resource, expected) => {
    expect(describeResource(resource)).toMatchObject(expected);
  });

  it("handles template placeholders and non-string values", () => {
    expect(describeResource("${ProcessFunctionArn}")).toMatchObject({
      service: "Lambda",
      action: "ProcessFunctionArn",
    });
    expect(describeResource({ "Fn::GetAtt": ["Fn", "Arn"] })).toBeNull();
    expect(describeResource(undefined)).toBeNull();
  });
});

describe("formatChoiceCondition", () => {
  it("formats every comparison operator", () => {
    expect(
      formatChoiceCondition({ Variable: "$.n", NumericLessThanEquals: 5 }),
    ).toBe("$.n <= 5");
    expect(
      formatChoiceCondition({
        Variable: "$.n",
        NumericGreaterThanEqualsPath: "$.min",
      }),
    ).toBe("$.n >= $.min");
    expect(
      formatChoiceCondition({
        Variable: "$.at",
        TimestampLessThan: "2024-01-01T00:00:00Z",
      }),
    ).toBe('$.at < "2024-01-01T00:00:00Z"');
    expect(
      formatChoiceCondition({ Variable: "$.name", StringMatches: "log-*" }),
    ).toBe('$.name matches "log-*"');
  });

  it("formats type tests and their negations", () => {
    expect(formatChoiceCondition({ Variable: "$.id", IsPresent: true })).toBe(
      "$.id is present",
    );
    expect(formatChoiceCondition({ Variable: "$.id", IsNull: false })).toBe(
      "!($.id is null)",
    );
  });

  it("formats boolean combinations", () => {
    expect(
      formatChoiceCondition({
        And: [
          { Variable: "$.a", NumericGreaterThan: 1 },
          {
            Or: [
              { Variable: "$.b", BooleanEquals: true },
              { Not: { Variable: "$.c", StringEquals: "x" } },
            ],
          },
        ],
      }),
    ).toBe('$.a > 1 && ($.b == true || !($.c == "x"))');
  });

  it("unwraps JSONata conditions", () => {
    expect(
      formatChoiceCondition({ Condition: "{% $states.input.total > 100 %}" }),
    ).toBe("$states.input.total > 100");
  });
});

describe("getStateSubtitle", () => {
  it("summarises states by type", () => {
    expect(
      getStateSubtitle({
        Type: "Task",
        Resource: "arn:aws:states:::sns:publish",
      }),
    ).toBe("SNS · Publish");
    expect(getStateSubtitle({ Type: "Wait", Seconds: 300 })).toBe("Wait 5m");
    expect(
      getStateSubtitle({
        Type: "Choice",
        Choices: [{ Variable: "$.a", IsPresent: true, Next: "B" }],
      }),
    ).toBe("Choice · 1 rule");
    expect(
      getStateSubtitle({
        Type: "Map",
        ItemProcessor: {
          ProcessorConfig: { Mode: "DISTRIBUTED" },
          StartAt: "A",
          States: {},
        },
      }),
    ).toBe("Distributed map");
    expect(getStateSubtitle({ Type: "Fail", Error: "Oops" })).toBe(
      "Fail · Oops",
    );
  });
});

describe("getNodeKind", () => {
  it("detects nested executions", () => {
    const node = {
      type: "Task",
      definition: {
        Type: "Task",
        Resource: "arn:aws:states:::states:startExecution.sync:2",
      },
    } as Pick<StateNode, "type" | "definition">;
    expect(getNodeKind(node)).toBe("stepFunction");
  });

  it("falls back to pass for unknown types", () => {
    const node = {
      type: "Unknown",
      definition: { Type: "Unknown" },
    } as unknown as Pick<StateNode, "type" | "definition">;
    expect(getNodeKind(node)).toBe("pass");
  });
});

describe("orderStatesByFlow", () => {
  it("orders reachable states first, then the rest", () => {
    expect(
      orderStatesByFlow({
        StartAt: "A",
        States: {
          Orphan: { Type: "Pass", End: true },
          C: { Type: "Succeed" },
          B: { Type: "Pass", Next: "C" },
          A: { Type: "Pass", Next: "B" },
        },
      }),
    ).toEqual(["A", "B", "C", "Orphan"]);
  });
});
