"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineConfirmProps {
  onConfirm: () => void;
  label?: string;
  className?: string;
}

export function InlineConfirm({
  onConfirm,
  label = "Eliminar",
  className = "",
}: InlineConfirmProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            onConfirm();
            setConfirming(false);
          }}
        >
          {label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setConfirming(false)}
        >
          No
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
      aria-label={label}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
