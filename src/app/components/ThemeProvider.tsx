"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ComponentProps, ReactNode } from "react";

type NextThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

interface ThemeProviderProps extends Omit<NextThemeProviderProps, "children"> {
  children: ReactNode;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
