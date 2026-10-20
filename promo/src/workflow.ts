import type { ASLDefinition } from "asl-viewer";

/**
 * Showcase state machine: one of each kind of state, several AWS services,
 * Retry / Catch, a review loop and both kinds of groups.
 */
export const orderWorkflow: ASLDefinition = {
  Comment: "Order fulfillment with AI fraud screening",
  StartAt: "ValidateOrder",
  States: {
    ValidateOrder: {
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      Parameters: { FunctionName: "validate-order", "Payload.$": "$" },
      Retry: [
        {
          ErrorEquals: ["Lambda.TooManyRequestsException"],
          IntervalSeconds: 1,
          MaxAttempts: 3,
          BackoffRate: 2,
          JitterStrategy: "FULL",
        },
      ],
      Catch: [{ ErrorEquals: ["States.ALL"], Next: "NotifyFailure" }],
      Next: "ScreenForFraud",
    },
    ScreenForFraud: {
      Type: "Task",
      Comment: "Scores the order with a foundation model",
      Resource: "arn:aws:states:::bedrock:invokeModel",
      Parameters: {
        ModelId: "anthropic.claude-opus",
        "Body.$": "$.order",
      },
      ResultSelector: { "score.$": "$.Body.risk_score" },
      ResultPath: "$.risk",
      Next: "IsSuspicious",
    },
    IsSuspicious: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.risk.score",
          NumericGreaterThan: 0.8,
          Next: "ManualReview",
        },
        {
          And: [
            { Variable: "$.order.total", NumericGreaterThan: 5000 },
            { Variable: "$.customer.verified", BooleanEquals: false },
          ],
          Next: "ManualReview",
        },
      ],
      Default: "FulfillOrder",
    },
    ManualReview: {
      Type: "Task",
      Comment: "An analyst approves the order from the review queue",
      Resource: "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
      Parameters: {
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/reviews",
        MessageBody: { "TaskToken.$": "$$.Task.Token", "Order.$": "$.order" },
      },
      TimeoutSeconds: 86400,
      Catch: [{ ErrorEquals: ["States.Timeout"], Next: "NotifyFailure" }],
      Next: "ScreenForFraud",
    },
    FulfillOrder: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "ChargePayment",
          States: {
            ChargePayment: {
              Type: "Task",
              Resource: "arn:aws:states:::lambda:invoke",
              Parameters: { FunctionName: "charge-payment" },
              End: true,
            },
          },
        },
        {
          StartAt: "ReserveStock",
          States: {
            ReserveStock: {
              Type: "Task",
              Resource: "arn:aws:states:::dynamodb:updateItem",
              End: true,
            },
          },
        },
      ],
      Catch: [{ ErrorEquals: ["States.ALL"], Next: "NotifyFailure" }],
      Next: "ShipItems",
    },
    ShipItems: {
      Type: "Map",
      ItemsPath: "$.order.items",
      MaxConcurrency: 10,
      ItemProcessor: {
        ProcessorConfig: { Mode: "INLINE" },
        StartAt: "CreateShipment",
        States: {
          CreateShipment: {
            Type: "Task",
            Resource: "arn:aws:states:::lambda:invoke",
            Parameters: { FunctionName: "create-shipment" },
            Next: "SaveTracking",
          },
          SaveTracking: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:putItem",
            End: true,
          },
        },
      },
      Next: "PublishEvent",
    },
    PublishEvent: {
      Type: "Task",
      Resource: "arn:aws:states:::events:putEvents",
      Next: "OrderComplete",
    },
    OrderComplete: { Type: "Succeed" },
    NotifyFailure: {
      Type: "Task",
      Resource: "arn:aws:states:::sns:publish",
      Next: "OrderFailed",
    },
    OrderFailed: {
      Type: "Fail",
      Error: "OrderFailed",
      Cause: "The order could not be fulfilled",
    },
  },
};
