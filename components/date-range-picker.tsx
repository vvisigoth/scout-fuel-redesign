"use client"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDay, iso, parseISO } from "@/lib/dates"
import { cn } from "@/lib/utils"

// Arbitrary start/end date-range picker: a two-month calendar with click-to-pick
// range selection and hover preview, plus quick day-count presets. An alternative
// to DateRangePresetTabs for views that need an exact custom range rather than the
// fixed Yesterday / This Week / This Month presets. Emits ISO (YYYY-MM-DD) strings.

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
]

const addMonths = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth() + count, 1)

// Six weeks starting on the Sunday on/before the 1st, so every month is the same height.
const monthGrid = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function Month({
  month,
  start,
  end,
  hovered,
  onSelect,
  onHover,
}: {
  month: Date
  start: string
  end: string
  hovered: string | null
  onSelect: (value: string) => void
  onHover: (value: string | null) => void
}) {
  const rangeEnd = hovered && hovered > start ? hovered : end
  const today = iso(new Date())

  return (
    <div className="w-[236px]">
      <p className="mb-2 text-center text-[13px] font-medium">
        {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(month).map((day) => {
          const value = iso(day)
          const outside = day.getMonth() !== month.getMonth()
          const inRange = value >= start && value <= rangeEnd
          const edge = value === start || value === rangeEnd

          return (
            <button
              key={value}
              type="button"
              disabled={value > today}
              onClick={() => onSelect(value)}
              onMouseEnter={() => onHover(value)}
              className={cn(
                "h-8 text-[13px] tabular-nums transition-colors disabled:opacity-30",
                outside && "text-muted-foreground/60",
                inRange && !edge && "bg-secondary/60",
                edge && "rounded-md bg-primary font-medium text-primary-foreground",
                !inRange && "rounded-md hover:bg-secondary/50",
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type DateRangePickerProps = {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  active?: boolean
}

export function DateRangePicker({ start, end, onChange, active }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(() => addMonths(parseISO(start), 0))
  const [pending, setPending] = React.useState<string | null>(null)
  const [hovered, setHovered] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setMonth(addMonths(parseISO(start), 0))
      setPending(null)
    }
  }, [open, start])

  const selectPreset = (days: number) => {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - (days - 1))
    onChange(iso(from), iso(today))
    setOpen(false)
  }

  const selectDay = (value: string) => {
    if (pending === null) {
      setPending(value)
      setHovered(null)
      return
    }
    const [from, to] = value < pending ? [value, pending] : [pending, value]
    setPending(null)
    onChange(from, to)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] whitespace-nowrap transition-colors",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "bg-card hover:bg-secondary/60",
            )}
          />
        }
      >
        <CalendarDays className="size-4" strokeWidth={1.75} />
        {formatDay(start)} – {formatDay(end)}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto rounded-lg p-3 shadow-xl">
        <div className="mb-3 flex items-center gap-1 border-b pb-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => selectPreset(preset.days)}
              className="rounded-md px-3 py-1.5 text-[13px] hover:bg-secondary/60"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="relative flex gap-5" onMouseLeave={() => setHovered(null)}>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
            className="absolute top-0 left-0 rounded-md p-1 hover:bg-secondary/60"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
            className="absolute top-0 right-0 rounded-md p-1 hover:bg-secondary/60"
          >
            <ChevronRight className="size-4" />
          </button>
          {[0, 1].map((offset) => (
            <Month
              key={offset}
              month={addMonths(month, offset)}
              start={pending ?? start}
              end={pending ?? end}
              hovered={hovered}
              onSelect={selectDay}
              onHover={setHovered}
            />
          ))}
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {pending ? "Pick an end date" : "Pick a start date, then an end date"}
        </p>
      </PopoverContent>
    </Popover>
  )
}
