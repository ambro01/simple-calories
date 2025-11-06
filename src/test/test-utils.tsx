import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

/**
 * Custom render function that wraps components with common providers
 * Add any global providers here (e.g., ThemeProvider, QueryClientProvider, etc.)
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { ...options });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
