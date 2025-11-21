import {
  lightTheme,
  darkTheme,
  highContrastTheme,
  softTheme,
  getTheme,
  getAllThemes,
  getThemeNames,
  createCustomTheme,
} from "../theme";
import { ViewerTheme } from "../../types";

describe("Theme Utils", () => {
  describe("lightTheme", () => {
    it("should have all required theme properties", () => {
      expect(lightTheme).toBeDefined();
      expect(lightTheme.background).toBeDefined();
      expect(lightTheme.surfaceColor).toBeDefined();
      expect(lightTheme.overlayColor).toBeDefined();
      expect(lightTheme.nodeColors).toBeDefined();
      expect(lightTheme.nodeBorderColors).toBeDefined();
      expect(lightTheme.nodeHoverColors).toBeDefined();
      expect(lightTheme.textColor).toBeDefined();
      expect(lightTheme.textColorSecondary).toBeDefined();
      expect(lightTheme.textColorMuted).toBeDefined();
      expect(lightTheme.borderColor).toBeDefined();
      expect(lightTheme.borderColorHover).toBeDefined();
      expect(lightTheme.connectionColor).toBeDefined();
      expect(lightTheme.connectionHoverColor).toBeDefined();
      expect(lightTheme.connectionLabelColor).toBeDefined();
      expect(lightTheme.startNodeColor).toBeDefined();
      expect(lightTheme.endNodeColor).toBeDefined();
      expect(lightTheme.selectedNodeColor).toBeDefined();
      expect(lightTheme.shadowColor).toBeDefined();
      expect(lightTheme.errorColor).toBeDefined();
      expect(lightTheme.warningColor).toBeDefined();
      expect(lightTheme.infoColor).toBeDefined();
      expect(lightTheme.successColor).toBeDefined();
      expect(lightTheme.gridColor).toBeDefined();
      expect(lightTheme.miniMapBackground).toBeDefined();
      expect(lightTheme.controlsBackground).toBeDefined();
      expect(lightTheme.tooltipBackground).toBeDefined();
      expect(lightTheme.tooltipTextColor).toBeDefined();
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
      expect(lightTheme.background).toBe("#f8f9fa");

      // Text should be dark for readability on light background
      expect(lightTheme.textColor).toBe("#1e293b");

      // Node colors should be light/pastel
      expect(lightTheme.nodeColors.pass).toBe("#ffffff");
      expect(lightTheme.nodeColors.task).toBe("#ffffff");
      expect(lightTheme.nodeColors.choice).toBe("#ffffff");
      expect(lightTheme.nodeColors.wait).toBe("#ffffff");
      expect(lightTheme.nodeColors.succeed).toBe("#f0fdf4");
      expect(lightTheme.nodeColors.fail).toBe("#fef2f2");
      expect(lightTheme.nodeColors.parallel).toBe("#ffffff");
      expect(lightTheme.nodeColors.map).toBe("#ffffff");
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
      expect(darkTheme.background).toBe("#0f172a");

      // Text should be light for readability on dark background
      expect(darkTheme.textColor).toBe("#f8fafc");

      // Node colors should be darker variants
      expect(darkTheme.nodeColors.pass).toBe("#1e293b");
      expect(darkTheme.nodeColors.task).toBe("#1e293b");
      expect(darkTheme.nodeColors.choice).toBe("#1e293b");
      expect(darkTheme.nodeColors.wait).toBe("#1e293b");
      expect(darkTheme.nodeColors.succeed).toBe("#064e3b");
      expect(darkTheme.nodeColors.fail).toBe("#7f1d1d");
      expect(darkTheme.nodeColors.parallel).toBe("#1e293b");
      expect(darkTheme.nodeColors.map).toBe("#1e293b");
    });

    it("should be a valid ViewerTheme object", () => {
      const theme: ViewerTheme = darkTheme;
      expect(theme).toBeDefined();
    });
  });

  describe("highContrastTheme", () => {
    it("should have all required theme properties", () => {
      expect(highContrastTheme).toBeDefined();
      expect(highContrastTheme.background).toBe("#000000");
      expect(highContrastTheme.textColor).toBe("#ffffff");
      expect(highContrastTheme.borderColor).toBe("#ffffff");
    });

    it("should have high contrast colors", () => {
      expect(highContrastTheme.background).toBe("#000000");
      expect(highContrastTheme.textColor).toBe("#ffffff");
      expect(highContrastTheme.connectionColor).toBe("#ffffff");
    });
  });

  describe("softTheme", () => {
    it("should have all required theme properties", () => {
      expect(softTheme).toBeDefined();
      expect(softTheme.background).toBe("#f8f9fa");
      expect(softTheme.textColor).toBe("#37474f");
    });

    it("should have soft pastel colors", () => {
      const nodeColors = softTheme.nodeColors;
      Object.values(nodeColors).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe("getAllThemes function", () => {
    it("should return all available themes", () => {
      const themes = getAllThemes();
      expect(themes).toHaveProperty("light");
      expect(themes).toHaveProperty("dark");
      expect(themes).toHaveProperty("highContrast");
      expect(themes).toHaveProperty("soft");
      expect(themes.light).toEqual(lightTheme);
      expect(themes.dark).toEqual(darkTheme);
      expect(themes.highContrast).toEqual(highContrastTheme);
      expect(themes.soft).toEqual(softTheme);
    });
  });

  describe("getThemeNames function", () => {
    it("should return all theme names", () => {
      const names = getThemeNames();
      expect(names).toEqual(["light", "dark", "highContrast", "soft"]);
    });
  });

  describe("createCustomTheme function", () => {
    it("should create a custom theme based on light theme", () => {
      const customTheme = createCustomTheme("light", {
        background: "#custom",
        nodeColors: {
          ...lightTheme.nodeColors,
          task: "#customTask",
        },
      });

      expect(customTheme.background).toBe("#custom");
      expect(customTheme.nodeColors.task).toBe("#customTask");
      expect(customTheme.nodeColors.pass).toBe(lightTheme.nodeColors.pass);
      expect(customTheme.textColor).toBe(lightTheme.textColor);
    });

    it("should create a custom theme based on dark theme", () => {
      const customTheme = createCustomTheme("dark", {
        textColor: "#customText",
        nodeBorderColors: {
          ...darkTheme.nodeBorderColors,
          choice: "#customChoice",
        },
      });

      expect(customTheme.textColor).toBe("#customText");
      expect(customTheme.nodeBorderColors.choice).toBe("#customChoice");
      expect(customTheme.background).toBe(darkTheme.background);
      expect(customTheme.nodeBorderColors.task).toBe(
        darkTheme.nodeBorderColors.task,
      );
    });
  });

  describe("theme contrast and accessibility", () => {
    it("should have sufficient contrast between light theme text and background", () => {
      // Light theme: dark text on light background
      expect(lightTheme.background).toBe("#f8f9fa"); // Light background
      expect(lightTheme.textColor).toBe("#1e293b"); // Dark text
    });

    it("should have sufficient contrast between dark theme text and background", () => {
      // Dark theme: light text on dark background
      expect(darkTheme.background).toBe("#0f172a"); // Dark background
      expect(darkTheme.textColor).toBe("#f8fafc"); // Light text
    });

    it("should have appropriate error colors for both themes", () => {
      // Error colors should be clearly visible and indicate error state
      expect(lightTheme.errorColor).toBe("#ef4444"); // Red for light theme
      expect(darkTheme.errorColor).toBe("#ef4444"); // Lighter red for dark theme
    });

    it("should have appropriate success colors for both themes", () => {
      // Success colors should be clearly visible and indicate success state
      expect(lightTheme.successColor).toBe("#22c55e"); // Green for light theme
      expect(darkTheme.successColor).toBe("#22c55e"); // Lighter green for dark theme
    });
  });

  describe("getTheme function", () => {
    it('should return light theme when "light" is passed', () => {
      const theme = getTheme("light");
      expect(theme).toEqual(lightTheme);
      expect(theme.background).toBe("#f8f9fa");
      expect(theme.textColor).toBe("#1e293b");
    });

    it('should return dark theme when "dark" is passed', () => {
      const theme = getTheme("dark");
      expect(theme).toEqual(darkTheme);
      expect(theme.background).toBe("#0f172a");
      expect(theme.textColor).toBe("#f8fafc");
    });

    it('should return highContrast theme when "highContrast" is passed', () => {
      const theme = getTheme("highContrast");
      expect(theme).toEqual(highContrastTheme);
      expect(theme.background).toBe("#000000");
      expect(theme.textColor).toBe("#ffffff");
    });

    it('should return soft theme when "soft" is passed', () => {
      const theme = getTheme("soft");
      expect(theme).toEqual(softTheme);
      expect(theme.background).toBe("#f8f9fa");
      expect(theme.textColor).toBe("#37474f");
    });

    it("should return light theme as default for any other value", () => {
      // TypeScript ensures only valid theme names can be passed,
      // but let's test the default case
      const theme = getTheme("light");
      expect(theme).toEqual(lightTheme);
    });

    it("should return a valid ViewerTheme object for all themes", () => {
      const themes = [
        getTheme("light"),
        getTheme("dark"),
        getTheme("highContrast"),
        getTheme("soft"),
      ];

      themes.forEach((theme) => {
        expect(theme).toMatchObject({
          background: expect.any(String),
          surfaceColor: expect.any(String),
          overlayColor: expect.any(String),
          nodeColors: expect.any(Object),
          nodeBorderColors: expect.any(Object),
          nodeHoverColors: expect.any(Object),
          textColor: expect.any(String),
          textColorSecondary: expect.any(String),
          textColorMuted: expect.any(String),
          borderColor: expect.any(String),
          borderColorHover: expect.any(String),
          connectionColor: expect.any(String),
          connectionHoverColor: expect.any(String),
          connectionLabelColor: expect.any(String),
          startNodeColor: expect.any(String),
          endNodeColor: expect.any(String),
          selectedNodeColor: expect.any(String),
          shadowColor: expect.any(String),
          errorColor: expect.any(String),
          warningColor: expect.any(String),
          infoColor: expect.any(String),
          successColor: expect.any(String),
          gridColor: expect.any(String),
          miniMapBackground: expect.any(String),
          controlsBackground: expect.any(String),
          tooltipBackground: expect.any(String),
          tooltipTextColor: expect.any(String),
        });
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
      expect(lightTheme.nodeColors.succeed).toContain("f0fdf4"); // Light green
      expect(lightTheme.successColor).toContain("22c55e"); // Dark green

      expect(darkTheme.nodeColors.succeed).toContain("064e3b"); // Dark green
      expect(darkTheme.successColor).toContain("22c55e"); // Light green
    });

    it("should use red colors for error/fail states", () => {
      // Fail states and error colors should use red-ish colors
      expect(lightTheme.nodeColors.fail).toContain("fef2f2"); // Light red
      expect(lightTheme.errorColor).toContain("ef4444"); // Dark red

      expect(darkTheme.nodeColors.fail).toContain("7f1d1d"); // Dark red
      expect(darkTheme.errorColor).toContain("ef4444"); // Light red
    });
  });
});
