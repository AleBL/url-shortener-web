import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "./App";
import { APP_NAME } from "./config";

test("renders the app name and the main heading", () => {
  render(<App />);

  expect(screen.getByText(APP_NAME)).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
});
