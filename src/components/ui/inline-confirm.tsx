"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InlineConfirmProps {
  onConfirm: () => void;
  label?: string;
  cancelLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function InlineConfirm({
  onConfirm,
  label = "Eliminar",
  cancelLabel = "No",
  disabled = false,
  className = "",
}: InlineConfirmProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="destructive"
          size="sm"
          className="h-11 px-3 text-xs"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
          disabled={disabled}
        >
          {label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 px-3 text-xs"
          onClick={() => setConfirming(false)}
          disabled={disabled}
        >
          {cancelLabel}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-11 w-11 text-muted-foreground transition-colors duration-200 hover:text-destructive ${className}`}
      onClick={() => setConfirming(true)}
      disabled={disabled}
      aria-label={label}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
