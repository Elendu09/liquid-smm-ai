import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Cross-browser date+time picker built on the shadcn Calendar so scheduling
 * dialogs no longer fall back to the native Chrome `datetime-local` chrome.
 * `value` is the same ISO-ish string previously used with datetime-local
 * (YYYY-MM-DDTHH:mm) so existing state can be swapped in without changes.
 */
export function DateTimePicker({
  value,
  onChange,
  minuteStep = 5,
  placeholder = "Select date & time",
  className,
  disabled,
  fromDate,
}: {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (v: string) => void;
  minuteStep?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  const date = useMemo(() => {
    if (!value) return undefined;
    try { return parseISO(value); } catch { return undefined; }
  }, [value]);

  const [hour, minute] = useMemo(() => {
    if (!date) return [9, 0];
    return [date.getHours(), Math.round(date.getMinutes() / minuteStep) * minuteStep];
  }, [date, minuteStep]);

  const commit = (d: Date | undefined, h = hour, m = minute) => {
    if (!d) return;
    const next = new Date(d);
    next.setHours(h, m, 0, 0);
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(iso);
  };

  const minutes = useMemo(
    () => Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? (
            <span className="truncate">{format(date, "EEE, MMM d · h:mm a")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" sideOffset={6}>
        <div className="flex flex-col sm:flex-row">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => commit(d ?? undefined)}
            initialFocus
            disabled={fromDate ? { before: fromDate } : undefined}
            className="p-3"
          />
          <div className="border-t sm:border-t-0 sm:border-l border-border/60 p-3 flex sm:flex-col gap-2 sm:w-32">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Time
            </div>
            <div className="flex gap-1.5 flex-1">
              <select
                aria-label="Hour"
                value={hour}
                onChange={(e) => commit(date ?? new Date(), Number(e.target.value), minute)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                ))}
              </select>
              <select
                aria-label="Minute"
                value={minute}
                onChange={(e) => commit(date ?? new Date(), hour, Number(e.target.value))}
                className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex flex-wrap gap-1 mt-1">
              {[[9, 0], [12, 0], [17, 0], [20, 0]].map(([h, m]) => (
                <button
                  key={`${h}:${m}`}
                  type="button"
                  onClick={() => commit(date ?? new Date(), h, m)}
                  className="text-[10px] px-1.5 py-0.5 rounded-md border border-border/60 hover:bg-muted transition-colors tabular-nums"
                >
                  {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
            <Button size="sm" className="mt-auto" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
