import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignInForm } from "@/components/auth/sign-in-form";

const { refreshMock, replaceMock, signInMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
  signInMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    replace: replaceMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

describe("SignInForm", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
  });

  it("shows field-level validation before attempting sign-in", async () => {
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/credentials required/i);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("submits trimmed credentials, disables controls while pending, and redirects on success", async () => {
    const user = userEvent.setup();
    let resolveSignIn:
      | ((value: { error?: string | null } | null) => void)
      | undefined;

    signInMock.mockImplementation(
      () =>
        new Promise<{ error?: string | null } | null>((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    render(<SignInForm />);

    await user.type(screen.getByLabelText(/^email$/i), "  admin@onesource.local  ");
    await user.type(screen.getByLabelText(/^password$/i), "LocalDevOnly!123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled(),
    );
    expect(screen.getByLabelText(/^email$/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      callbackUrl: "/",
      email: "admin@onesource.local",
      password: "LocalDevOnly!123",
      redirect: false,
    });

    resolveSignIn?.({ error: null });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("shows an auth error when credential sign-in fails", async () => {
    const user = userEvent.setup();

    signInMock.mockResolvedValue({ error: "CredentialsSignin" });

    render(<SignInForm />);

    await user.type(screen.getByLabelText(/^email$/i), "admin@onesource.local");
    await user.type(screen.getByLabelText(/^password$/i), "bad-password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i),
    );
    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
