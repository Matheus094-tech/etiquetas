import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe("App routing and shell", () => {
  it("renders the Casa Nexo shell and the Etiquetas section at /etiquetas", () => {
    renderAt("/etiquetas");

    expect(screen.getByRole("heading", { level: 1, name: "Casa Nexo" })).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Seções do Casa Nexo" });
    const activeLink = within(nav).getByRole("link", { name: "Etiquetas" });
    expect(activeLink).toHaveAttribute("aria-current", "page");

    expect(screen.getByRole("heading", { level: 2, name: "Etiquetas" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do alimento/)).toBeInTheDocument();
  });

  it("redirects / to /etiquetas", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "Casa Nexo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Etiquetas" })).toBeInTheDocument();
  });

  it("redirects an unknown route to /etiquetas instead of showing a confusing page", () => {
    renderAt("/rota-que-nao-existe");

    expect(screen.getByRole("heading", { level: 2, name: "Etiquetas" })).toBeInTheDocument();
  });

  it("keeps the label generator working after being placed inside the shell", () => {
    renderAt("/etiquetas");

    const nameInput = screen.getByLabelText(/Nome do alimento/);
    const descriptionInput = screen.getByLabelText(/Descrição/);
    const weightInput = screen.getByLabelText(/Peso/);

    fireEvent.change(nameInput, { target: { value: "Feijão" } });
    fireEvent.change(descriptionInput, { target: { value: "cozido" } });
    fireEvent.change(weightInput, { target: { value: "500" } });

    expect(nameInput).toHaveValue("Feijão");
    expect(descriptionInput).toHaveValue("cozido");
    expect(weightInput).toHaveValue("500");

    const preview = screen.getByRole("img", { name: /Etiqueta de cozinha: Feijão/i });
    expect(preview).toBeInTheDocument();
  });
});
