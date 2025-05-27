import { ASLDefinition } from "../../types";

// Simple Hello World workflow
export const helloWorldDefinition: ASLDefinition = {
  Comment: "A Hello World example",
  StartAt: "HelloWorld",
  States: {
    HelloWorld: {
      Type: "Pass",
      Result: "Hello World!",
      End: true,
    },
  },
};

// More complex workflow with choices and parallel execution
export const complexWorkflowDefinition: ASLDefinition = {
  Comment: "Complex workflow demonstrating various state types",
  StartAt: "ValidateInput",
  States: {
    ValidateInput: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ValidateInput",
      Next: "CheckValidation",
    },
    CheckValidation: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.isValid",
          BooleanEquals: true,
          Next: "ProcessInParallel",
        },
        {
          Variable: "$.isValid",
          BooleanEquals: false,
          Next: "HandleError",
        },
      ],
      Default: "HandleError",
    },
    ProcessInParallel: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "ProcessDataA",
          States: {
            ProcessDataA: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ProcessDataA",
              End: true,
            },
          },
        },
        {
          StartAt: "ProcessDataB",
          States: {
            ProcessDataB: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ProcessDataB",
              End: true,
            },
          },
        },
      ],
      Next: "WaitForProcessing",
    },
    WaitForProcessing: {
      Type: "Wait",
      Seconds: 5,
      Next: "FinalizeProcessing",
    },
    FinalizeProcessing: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:FinalizeProcessing",
      Next: "Success",
    },
    HandleError: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:HandleError",
      Next: "Failure",
    },
    Success: {
      Type: "Succeed",
    },
    Failure: {
      Type: "Fail",
      Cause: "Validation failed or processing error",
    },
  },
};

// Workflow with errors for testing error display
export const invalidWorkflowDefinition: ASLDefinition = {
  Comment: "Invalid workflow for testing error handling",
  StartAt: "NonExistentState",
  States: {
    TaskWithoutResource: {
      Type: "Task",
      Next: "AnotherNonExistentState",
    },
    ChoiceWithoutChoices: {
      Type: "Choice",
      End: true,
    },
  },
};

// E-commerce order processing workflow
export const ecommerceWorkflowDefinition: ASLDefinition = {
  Comment: "E-commerce order processing workflow",
  StartAt: "ReceiveOrder",
  States: {
    ReceiveOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ReceiveOrder",
      Next: "ValidateOrder",
    },
    ValidateOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ValidateOrder",
      Retry: [
        {
          ErrorEquals: ["States.TaskFailed"],
          IntervalSeconds: 2,
          MaxAttempts: 3,
          BackoffRate: 2.0,
        },
      ],
      Catch: [
        {
          ErrorEquals: ["States.ALL"],
          Next: "OrderValidationFailed",
        },
      ],
      Next: "CheckInventory",
    },
    CheckInventory: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "CheckProductInventory",
          States: {
            CheckProductInventory: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:CheckInventory",
              End: true,
            },
          },
        },
        {
          StartAt: "ReserveInventory",
          States: {
            ReserveInventory: {
              Type: "Task",
              Resource:
                "arn:aws:lambda:us-east-1:123456789012:function:ReserveInventory",
              End: true,
            },
          },
        },
      ],
      Next: "ProcessPayment",
    },
    ProcessPayment: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:ProcessPayment",
      Next: "PaymentResult",
    },
    PaymentResult: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.paymentStatus",
          StringEquals: "SUCCESS",
          Next: "FulfillOrder",
        },
        {
          Variable: "$.paymentStatus",
          StringEquals: "FAILED",
          Next: "PaymentFailed",
        },
      ],
      Default: "PaymentFailed",
    },
    FulfillOrder: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:FulfillOrder",
      Next: "SendConfirmation",
    },
    SendConfirmation: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:SendConfirmation",
      Next: "OrderCompleted",
    },
    OrderCompleted: {
      Type: "Succeed",
    },
    PaymentFailed: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:HandlePaymentFailure",
      Next: "OrderFailed",
    },
    OrderValidationFailed: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:HandleValidationFailure",
      Next: "OrderFailed",
    },
    OrderFailed: {
      Type: "Fail",
      Cause: "Order processing failed",
    },
  },
};

// Data processing pipeline
export const dataProcessingWorkflowDefinition: ASLDefinition = {
  Comment: "Data processing pipeline with Map state",
  StartAt: "PrepareData",
  States: {
    PrepareData: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:PrepareData",
      Next: "ProcessBatches",
    },
    ProcessBatches: {
      Type: "Map",
      ItemsPath: "$.batches",
      MaxConcurrency: 5,
      Iterator: {
        StartAt: "ProcessBatch",
        States: {
          ProcessBatch: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ProcessBatch",
            Next: "ValidateBatch",
          },
          ValidateBatch: {
            Type: "Task",
            Resource:
              "arn:aws:lambda:us-east-1:123456789012:function:ValidateBatch",
            Next: "BatchProcessed",
          },
          BatchProcessed: {
            Type: "Succeed",
          },
        },
      },
      Next: "AggregateResults",
    },
    AggregateResults: {
      Type: "Task",
      Resource:
        "arn:aws:lambda:us-east-1:123456789012:function:AggregateResults",
      Next: "GenerateReport",
    },
    GenerateReport: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:GenerateReport",
      Next: "WaitForReview",
    },
    WaitForReview: {
      Type: "Wait",
      Seconds: 300,
      Next: "SendReport",
    },
    SendReport: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123456789012:function:SendReport",
      Next: "ProcessingComplete",
    },
    ProcessingComplete: {
      Type: "Succeed",
    },
  },
};

// Simple workflow for minimal examples
export const simpleWorkflow: ASLDefinition = {
  Comment: "A simple minimal example",
  StartAt: "Hello",
  States: {
    Hello: {
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      Parameters: {
        FunctionName: "HelloWorld",
      },
      End: true,
    },
  },
};

// Custom theme example workflow
export const customThemeWorkflow: ASLDefinition = {
  Comment: "Custom theme example",
  StartAt: "ProcessData",
  States: {
    ProcessData: {
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      Next: "IsComplete",
    },
    IsComplete: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.status",
          StringEquals: "complete",
          Next: "Success",
        },
      ],
      Default: "ProcessData",
    },
    Success: {
      Type: "Succeed",
    },
  },
};

// YAML definition as string
export const yamlDefinition = `# YAML ASL Definition
Comment: "A Hello World example in YAML"
StartAt: "HelloWorld"
States:
  HelloWorld:
    Type: "Pass"
    Result: "Hello World from YAML!"
    End: true`;
