"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import { Input } from "@/shared/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function DateTimePicker({
  value,
  onChange,
  placeholder = "날짜와 시간을 선택하세요",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the value (datetime-local format: "YYYY-MM-DDTHH:mm") into date and time parts
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value)
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const timeValue = React.useMemo(() => {
    if (!parsedDate) return "00:00"
    const h = String(parsedDate.getHours()).padStart(2, "0")
    const m = String(parsedDate.getMinutes()).padStart(2, "0")
    return `${h}:${m}`
  }, [parsedDate])

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return
    // Preserve existing time
    const [hours, minutes] = timeValue.split(":").map(Number)
    selected.setHours(hours, minutes, 0, 0)
    emitValue(selected)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    if (!time) return
    const [hours, minutes] = time.split(":").map(Number)
    const d = parsedDate ? new Date(parsedDate) : new Date()
    d.setHours(hours, minutes, 0, 0)
    emitValue(d)
  }

  const emitValue = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    onChange(val)
  }

  const displayText = parsedDate
    ? format(parsedDate, "yyyy년 M월 d일 HH:mm", { locale: ko })
    : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {displayText ?? placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          locale={ko}
        />
        <div className="border-t px-3 py-2">
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateTimePicker }
