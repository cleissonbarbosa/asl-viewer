import { lightTheme, darkTheme, getTheme } from "../theme";
import { ViewerTheme } from "../../types";

describe("Theme Utils", () => {
  describe("lightTheme", () => {
    it("should have all required theme properties", () => {
      expect(lightTheme).toBeDefined();
      expect(lightTheme.background).toBeDefined();
      expect(lightTheme.nodeColors).toBeDefined();
      expect(lightTheme.textColor).toBeDefined();
      expect(lightTheme.borderColor).toBeDefined();
      expect(lightTheme.connectionColor).toBeDefined();
      expect(lightTheme.errorColor).toBeDefined();
      expect(lightTheme.successColor).toBeDefined();
    });

    it("should have all node color types defined", () => {
      const nodeColors = lightTheme.nodeColors;
      expect(nodeColors.pass).toBeDefined();
      expect(nodeColors.task).toBeDefined();
      expect(nodeColors.choice).toBeDefined();
      expect(nodeColors.wait).toBeDefined();
      expect(nodeColors.succeed).toBeDefined();
      expect(nodeColors.fail).toBeDefined();
      expect(nodeColors.parallel).toBeDefined();
      expect(nodeColors.map).toBeDefined();
    });

    it("should have valid CSS color values", () => {
      // Check that background is a valid hex color
      expect(lightTheme.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.connectionColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.errorColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.successColor).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Check node colors
      Object.values(lightTheme.nodeColors).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should have light color scheme characteristics", () => {
      // Light theme should have light background
      expect(lightTheme.background).toBe("#ffffff");

      // Text should be dark for readability on light background
      expect(lightTheme.textColor).toBe("#232f3e");

      // Node colors should be light/pastel
      expect(lightTheme.nodeColors.pass).toBe("#e8f4fd");
      expect(lightTheme.nodeColors.task).toBe("#e8f5e8");
      expect(lightTheme.nodeColors.choice).toBe("#fff8e1");
      expect(lightTheme.nodeColors.wait).toBe("#f3e5f5");
      expect(lightTheme.nodeColors.succeed).toBe("#e8f5e8");
      expect(lightTheme.nodeColors.fail).toBe("#ffebee");
      expect(lightTheme.nodeColors.parallel).toBe("#e0f2f1");
      expect(lightTheme.nodeColors.map).toBe("#f1f8e9");
    });

    it("should be a valid ViewerTheme object", () => {
      const theme: ViewerTheme = lightTheme;
      expect(theme).toBeDefined();
    });
  });

  describe("darkTheme", () => {
    it("should have all required theme properties", () => {
      expect(darkTheme).toBeDefined();
      expect(darkTheme.background).toBeDefined();
      expect(darkTheme.nodeColors).toBeDefined();
      expect(darkTheme.textColor).toBeDefined();
      expect(darkTheme.borderColor).toBeDefined();
      expect(darkTheme.connectionColor).toBeDefined();
      expect(darkTheme.errorColor).toBeDefined();
      expect(darkTheme.successColor).toBeDefined();
    });

    it("should have all node color types defined", () => {
      const nodeColors = darkTheme.nodeColors;
      expect(nodeColors.pass).toBeDefined();
      expect(nodeColors.task).toBeDefined();
      expect(nodeColors.choice).toBeDefined();
      expect(nodeColors.wait).toBeDefined();
      expect(nodeColors.succeed).toBeDefined();
      expect(nodeColors.fail).toBeDefined();
      expect(nodeColors.parallel).toBeDefined();
      expect(nodeColors.map).toBeDefined();
    });

    it("should have valid CSS color values", () => {
      // Check that all colors are valid hex colors
      expect(darkTheme.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkTheme.textColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkTheme.borderColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkTheme.connectionColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkTheme.errorColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(darkTheme.successColor).toMatch(/^#[0-9a-fA-F]{6}$/);

      // Check node colors
      Object.values(darkTheme.nodeColors).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it("should have dark color scheme characteristics", () => {
      // Dark theme should have dark background
      expect(darkTheme.background).toBe("#232f3e");

      // Text should be light for readability on dark background
      expect(darkTheme.textColor).toBe("#ffffff");

      // Node colors should be darker variants
      expect(darkTheme.nodeColors.pass).toBe("#1e3a5f");
      expect(darkTheme.nodeColors.task).toBe("#1e4d26");
      expect(darkTheme.nodeColors.choice).toBe("#5d4e37");
      expect(darkTheme.nodeColors.wait).toBe("#4a2c54");
      expect(darkTheme.nodeColors.succeed).toBe("#1e4d26");
      expect(darkTheme.nodeColors.fail).toBe("#5c1e1e");
      expect(darkTheme.nodeColors.parallel).toBe("#1e4a47");
      expect(darkTheme.nodeColors.map).toBe("#3e4d1e");
    });

    it("should be a valid ViewerTheme object", () => {
      const theme: ViewerTheme = darkTheme;
      expect(theme).toBeDefined();
    });
  });

  describe("theme contrast and accessibility", () => {
    it("should have sufficient contrast between light theme text and background", () => {
      // Light theme: dark text on light background
      expect(lightTheme.background).toBe("#ffffff"); // White background
      expect(lightTheme.textColor).toBe("#232f3e"); // Dark text
    });

    it("should have sufficient contrast between dark theme text and background", () => {
      // Dark theme: light text on dark background
      expect(darkTheme.background).toBe("#232f3e"); // Dark background
      expect(darkTheme.textColor).toBe("#ffffff"); // White text
    });

    it("should have appropriate error colors for both themes", () => {
      // Error colors should be clearly visible and indicate error state
      expect(lightTheme.errorColor).toBe("#d13212"); // Red for light theme
      expect(darkTheme.errorColor).toBe("#ff6b6b"); // Lighter red for dark theme
    });

    it("should have appropriate success colors for both themes", () => {
      // Success colors should be clearly visible and indicate success state
      expect(lightTheme.successColor).toBe("#1d8102"); // Green for light theme
      expect(darkTheme.successColor).toBe("#51cf66"); // Lighter green for dark theme
    });
  });

  describe("getTheme function", () => {
    it('should return light theme when "light" is passed', () => {
      const theme = getTheme("light");
      expect(theme).toEqual(lightTheme);
      expect(theme.background).toBe("#ffffff");
      expect(theme.textColor).toBe("#232f3e");
    });

    it('should return dark theme when "dark" is passed', () => {
      const theme = getTheme("dark");
      expect(theme).toEqual(darkTheme);
      expect(theme.background).toBe("#232f3e");
      expect(theme.textColor).toBe("#ffffff");
    });

    it("should return light theme as default for any other value", () => {
      // TypeScript ensures only "light" or "dark" can be passed,
      // but let's test the logic with type assertion
      const theme = getTheme("invalid" as any);
      expect(theme).toEqual(lightTheme);
    });

    it("should return a valid ViewerTheme object", () => {
      const lightResult = getTheme("light");
      const darkResult = getTheme("dark");

      // Both should be valid ViewerTheme objects
      expect(lightResult).toMatchObject({
        background: expect.any(String),
        nodeColors: expect.any(Object),
        textColor: expect.any(String),
        borderColor: expect.any(String),
        connectionColor: expect.any(String),
        errorColor: expect.any(String),
        successColor: expect.any(String),
      });

      expect(darkResult).toMatchObject({
        background: expect.any(String),
        nodeColors: expect.any(Object),
        textColor: expect.any(String),
        borderColor: expect.any(String),
        connectionColor: expect.any(String),
        errorColor: expect.any(String),
        successColor: expect.any(String),
      });
    });
  });

  describe("theme consistency", () => {
    it("should have the same structure for both themes", () => {
      const lightKeys = Object.keys(lightTheme).sort();
      const darkKeys = Object.keys(darkTheme).sort();
      expect(lightKeys).toEqual(darkKeys);

      const lightNodeColorKeys = Object.keys(lightTheme.nodeColors).sort();
      const darkNodeColorKeys = Object.keys(darkTheme.nodeColors).sort();
      expect(lightNodeColorKeys).toEqual(darkNodeColorKeys);
    });

    it("should have different color values between themes", () => {
      // Themes should be visually different
      expect(lightTheme.background).not.toBe(darkTheme.background);
      expect(lightTheme.textColor).not.toBe(darkTheme.textColor);

      // Most node colors should be different (except where logically same)
      expect(lightTheme.nodeColors.pass).not.toBe(darkTheme.nodeColors.pass);
      expect(lightTheme.nodeColors.task).not.toBe(darkTheme.nodeColors.task);
      expect(lightTheme.nodeColors.choice).not.toBe(
        darkTheme.nodeColors.choice,
      );
    });

    it("should have all required node types covered", () => {
      const requiredNodeTypes = [
        "pass",
        "task",
        "choice",
        "wait",
        "succeed",
        "fail",
        "parallel",
        "map",
      ];

      requiredNodeTypes.forEach((nodeType) => {
        expect(lightTheme.nodeColors).toHaveProperty(nodeType);
        expect(darkTheme.nodeColors).toHaveProperty(nodeType);
      });
    });
  });

  describe("color format validation", () => {
    it("should use consistent hex color format", () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

      // Test all light theme colors
      expect(lightTheme.background).toMatch(hexColorRegex);
      expect(lightTheme.textColor).toMatch(hexColorRegex);
      expect(lightTheme.borderColor).toMatch(hexColorRegex);
      expect(lightTheme.connectionColor).toMatch(hexColorRegex);
      expect(lightTheme.errorColor).toMatch(hexColorRegex);
      expect(lightTheme.successColor).toMatch(hexColorRegex);
      Object.values(lightTheme.nodeColors).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });

      // Test all dark theme colors
      expect(darkTheme.background).toMatch(hexColorRegex);
      expect(darkTheme.textColor).toMatch(hexColorRegex);
      expect(darkTheme.borderColor).toMatch(hexColorRegex);
      expect(darkTheme.connectionColor).toMatch(hexColorRegex);
      expect(darkTheme.errorColor).toMatch(hexColorRegex);
      expect(darkTheme.successColor).toMatch(hexColorRegex);
      Object.values(darkTheme.nodeColors).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });

    it("should not have any empty or undefined colors", () => {
      // Check light theme
      expect(lightTheme.background).toBeTruthy();
      expect(lightTheme.textColor).toBeTruthy();
      expect(lightTheme.borderColor).toBeTruthy();
      expect(lightTheme.connectionColor).toBeTruthy();
      expect(lightTheme.errorColor).toBeTruthy();
      expect(lightTheme.successColor).toBeTruthy();
      Object.values(lightTheme.nodeColors).forEach((color) => {
        expect(color).toBeTruthy();
      });

      // Check dark theme
      expect(darkTheme.background).toBeTruthy();
      expect(darkTheme.textColor).toBeTruthy();
      expect(darkTheme.borderColor).toBeTruthy();
      expect(darkTheme.connectionColor).toBeTruthy();
      expect(darkTheme.errorColor).toBeTruthy();
      expect(darkTheme.successColor).toBeTruthy();
      Object.values(darkTheme.nodeColors).forEach((color) => {
        expect(color).toBeTruthy();
      });
    });
  });

  describe("semantic color usage", () => {
    it("should use green colors for success states", () => {
      // Success and succeed states should use green-ish colors
      expect(lightTheme.nodeColors.succeed).toContain("e8f5e8"); // Light green
      expect(lightTheme.successColor).toContain("1d8102"); // Dark green

      expect(darkTheme.nodeColors.succeed).toContain("1e4d26"); // Dark green
      expect(darkTheme.successColor).toContain("51cf66"); // Light green
    });

    it("should use red colors for error/fail states", () => {
      // Fail states and error colors should use red-ish colors
      expect(lightTheme.nodeColors.fail).toContain("ffebee"); // Light red
      expect(lightTheme.errorColor).toContain("d13212"); // Dark red

      expect(darkTheme.nodeColors.fail).toContain("5c1e1e"); // Dark red
      expect(darkTheme.errorColor).toContain("ff6b6b"); // Light red
    });

    it("should use distinct colors for different state types", () => {
      // All node colors should be unique in each theme
      const lightColors = Object.values(lightTheme.nodeColors);
      const darkColors = Object.values(darkTheme.nodeColors);

      // Check light theme has unique colors (except for succeed/task which might be same green)
      const uniqueLightColors = new Set(lightColors);
      expect(uniqueLightColors.size).toBeGreaterThanOrEqual(
        lightColors.length - 1,
      );

      // Check dark theme has unique colors (except for succeed/task which might be same green)
      const uniqueDarkColors = new Set(darkColors);
      expect(uniqueDarkColors.size).toBeGreaterThanOrEqual(
        darkColors.length - 1,
      );
    });
  });
});
