"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_AI_URL_LENGTH, type AIProvider } from "../../core/ai";
import { Button } from "../primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu";
import { copyText } from "../lib/clipboard";
import { cn } from "../lib/cn";
import { CopyIcon, ExternalLink, SparklesIcon } from "./icons";

export interface AskAIMenuProps {
  /**
   * Built lazily on select so large schedules aren't serialized every render.
   * When `fits` is passed (opening a chat), return a prompt that satisfies it —
   * e.g. via `daysToAIPrompt` / `eventToAIPrompt`, which compact to fit.
   */
  getPrompt: (fits?: (prompt: string) => boolean) => string;
  providers: AIProvider[];
  /** Trigger text. Default "Ask AI". */
  label?: string;
  /** `icon` = icon-only trigger (header on small screens), `button` = labelled. */
  variant?: "icon" | "button";
  className?: string;
}

function open(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * "Ask AI" menu: copy the prompt (schedule as Markdown + instructions), or open a
 * chat app with the prompt already in its URL. Long schedules are compacted to
 * fit the link rather than handed off through the clipboard.
 */
export function AskAIMenu({ getPrompt, providers, label = "Ask AI", variant = "button", className }: AskAIMenuProps) {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (message: string) => {
    setStatus(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), 2500);
  };

  const handleCopy = () => {
    void copyText(getPrompt()).then((ok) => flash(ok ? "Copied for AI" : "Copy failed"));
  };

  const handleOpen = (provider: AIProvider) => {
    const prompt = getPrompt((p) => provider.url(p).length <= MAX_AI_URL_LENGTH);
    open(provider.url(prompt));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          aria-label={variant === "icon" ? label : undefined}
          title={variant === "icon" ? label : undefined}
          className={cn("text-muted-foreground hover:text-foreground", status && "text-foreground", className)}
        >
          <SparklesIcon className={variant === "icon" ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {variant === "button" ? <span>{status ?? label}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Use with AI</DropdownMenuLabel>
        <DropdownMenuItem onSelect={handleCopy}>
          <CopyIcon className="h-3.5 w-3.5 text-muted-foreground" />
          Copy for AI (Markdown)
        </DropdownMenuItem>
        {providers.length ? <DropdownMenuSeparator /> : null}
        {providers.map((provider) => (
          <DropdownMenuItem key={provider.id} onSelect={() => handleOpen(provider)}>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            Open in {provider.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      {/* Announce copy results to screen readers; the icon trigger has no visible text. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status}
      </span>
    </DropdownMenu>
  );
}
