import { useState } from "react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
}

export function CustomDatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  fromYear = 2020,
  toYear = new Date().getFullYear() + 2,
  disabled = false,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(date || new Date());
  const [selectedDate, setSelectedDate] = useState(date);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentMonth = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();

  // Generate year options
  const yearOptions = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i,
  );

  // Calculate days to display in calendar
  const daysInMonth = getDaysInMonth(displayDate);
  const firstDayOfMonth = getDay(startOfMonth(displayDate));
  const daysArray: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    setDate(newDate); // Update parent state
    setOpen(false); // Close picker after selection
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    const newDate = new Date(currentYear, monthIndex, 1);
    setDisplayDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), currentMonth, 1);
    setDisplayDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setDisplayDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setDisplayDate(newDate);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setDate(undefined);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full justify-start text-left font-normal h-10"
      >
        {selectedDate ? format(selectedDate, "yyyy-MM-dd") : placeholder}
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-50 p-4 w-80">
          {/* Header with Month/Year Controls */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Select
                value={months[currentMonth]}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month} className="text-xs">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-xs"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground h-8 flex items-center justify-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {daysArray.map((day, index) => (
              <div key={index} className="h-8 flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "w-8 h-8 rounded text-xs p-0 font-normal flex items-center justify-start pl-1.5",
                      selectedDate &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === currentMonth &&
                        selectedDate.getFullYear() === currentYear
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
