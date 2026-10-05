"use client";

import { useActionState } from "react";

import { Monogram } from "@/components/monogram";

import { signIn } from "./actions";

/** The only page a signed-out visitor sees. The upload token is the password. */
export function SignIn() {
    const [error, action, pending] = useActionState(signIn, undefined);

    return (
        <main className="grid min-h-dvh place-items-center px-6">
            <form action={action} className="flex w-full max-w-[300px] flex-col items-center">
                <Monogram className="size-11 rounded-[10px] text-[19px]" />
                <h1 className="mt-3.5 mb-[26px] text-[22px] leading-tight font-bold">files.baree.be</h1>
                <input
                    name="token"
                    type="password"
                    required
                    // oxlint-disable-next-line jsx-a11y/no-autofocus -- the token field is the whole page
                    autoFocus
                    autoComplete="current-password"
                    placeholder="Access token"
                    aria-label="Access token"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "sign-in-error" : undefined}
                    className="h-9 w-full rounded-md bg-[rgb(242_241_238/0.6)] px-2.5 text-[15px] shadow-[inset_0_0_0_1px_rgb(15_15_15/0.1)] transition-shadow outline-none placeholder:text-faint focus:bg-white focus:shadow-[inset_0_0_0_1px_rgb(35_131_226/0.57),0_0_0_2px_rgb(35_131_226/0.35)]"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="mt-2.5 h-9 w-full rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                    Continue
                </button>
                {error && (
                    <p id="sign-in-error" role="alert" className="mt-3 text-sm text-destructive">
                        {error}
                    </p>
                )}
            </form>
        </main>
    );
}
