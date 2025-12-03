import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { getStartOfToday, getStartOfWeek, getStartOfMonth } from "@/lib/helpers";

export type DateFilter = "today" | "week" | "month" | "all";

export const dateFilterLabels: Record<DateFilter, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export function getDateRangeFromFilter(filter: DateFilter): { startDate?: string } {
  switch (filter) {
    case "today":
      return { startDate: getStartOfToday().toISOString() };
    case "week":
      return { startDate: getStartOfWeek().toISOString() };
    case "month":
      return { startDate: getStartOfMonth().toISOString() };
    default:
      return {};
  }
}

interface DateFilterSelectProps {
  value: DateFilter;
  onValueChange: (value: DateFilter) => void;
}

export function DateFilterSelect({ value, onValueChange }: DateFilterSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as DateFilter)}>
      <SelectTrigger className="w-[180px]">
        <Calendar className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="all">All Time</SelectItem>
      </SelectContent>
    </Select>
  );
}
