"use client";

import type { RefObject } from "react";
import { useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import {
  formatDateInput,
  getStartOfMonth,
  getStartOfToday,
  getStartOfWeek,
} from "@/lib/helpers";

export type DateRangeInput = {
  from?: string;
  to?: string;
};

export type DateRangePreset = "today" | "week" | "month" | "all";

function getPresetRange(preset: DateRangePreset): DateRangeInput {
  const today = formatDateInput(getStartOfToday());

  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week":
      return { from: formatDateInput(getStartOfWeek()), to: today };
    case "month":
      return { from: formatDateInput(getStartOfMonth()), to: today };
    case "all":
    default:
      return { from: undefined, to: undefined };
  }
}

export function DateRangePicker(props: {
  value: DateRangeInput;
  onValueChange: (value: DateRangeInput) => void;
  presets?: boolean;
  showClear?: boolean;
  className?: string;
}) {
  const { value, onValueChange, presets = true, showClear = true, className } = props;

  const fromId = useId();
  const toId = useId();
  const fromRef = useRef<HTMLInputElement | null>(null);
  const toRef = useRef<HTMLInputElement | null>(null);

  const openNativePicker = (ref: RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    const anyEl = el as unknown as { showPicker?: () => void };
    if (typeof anyEl.showPicker === "function") {
      anyEl.showPicker();
      return;
    }
    el.focus();
  };

  const setFrom = (from?: string) => {
    if (from && value.to && from > value.to) {
      onValueChange({ from, to: from });
      return;
    }
    onValueChange({ ...value, from: from || undefined });
  };

  const setTo = (to?: string) => {
    if (to && value.from && value.from > to) {
      onValueChange({ from: to, to });
      return;
    }
    onValueChange({ ...value, to: to || undefined });
  };

  const clear = () => onValueChange({ from: undefined, to: undefined });

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {presets && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onValueChange(getPresetRange("today"))}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onValueChange(getPresetRange("week"))}
          >
            This Week
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onValueChange(getPresetRange("month"))}
          >
            This Month
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onValueChange(getPresetRange("all"))}
          >
            All Time
          </Button>
        </div>
      )}

      <div className="grid gap-1">
        <Label htmlFor={fromId} className="text-xs text-muted-foreground">
          From
        </Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fromRef}
            id={fromId}
            type="date"
            value={value.from ?? ""}
            onChange={(e) => setFrom(e.target.value)}
            className="w-[160px]"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => openNativePicker(fromRef)}
            aria-label="Open from date calendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-1">
        <Label htmlFor={toId} className="text-xs text-muted-foreground">
          To
        </Label>
        <div className="flex items-center gap-2">
          <Input
            ref={toRef}
            id={toId}
            type="date"
            value={value.to ?? ""}
            onChange={(e) => setTo(e.target.value)}
            className="w-[160px]"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => openNativePicker(toRef)}
            aria-label="Open to date calendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showClear && (value.from || value.to) && (
        <Button type="button" size="sm" variant="ghost" onClick={clear}>
          Clear
        </Button>
      )}
    </div>
  );
}
