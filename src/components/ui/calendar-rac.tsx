import { cn } from "../../lib/utils";
import { getLocalTimeZone, today } from "@internationalized/date";
import { ComponentProps } from "react";
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  RangeCalendar as RangeCalendarRac,
  composeRenderProps,
} from "react-aria-components";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface BaseCalendarProps {
  className?: string;
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps;
type RangeCalendarProps = ComponentProps<typeof RangeCalendarRac> &
  BaseCalendarProps;

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-3">
    <Button
      slot="previous"
      className="flex size-10 items-center justify-center rounded-lg text-slate-600 outline-offset-2 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
    >
      <ChevronLeftIcon width={20} height={20} />
    </Button>
    <HeadingRac className="grow text-center text-base font-semibold text-slate-900" />
    <Button
      slot="next"
      className="flex size-10 items-center justify-center rounded-lg text-slate-600 outline-offset-2 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
    >
      <ChevronRightIcon width={20} height={20} />
    </Button>
  </header>
);

const CalendarGridComponent = ({ isRange = false }: { isRange?: boolean }) => {
  const now = today(getLocalTimeZone());

  return (
    <CalendarGridRac className="w-full border-separate border-spacing-1">
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="w-10 h-10 rounded-lg p-0 text-sm font-semibold text-slate-500">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:p-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex w-10 h-10 items-center justify-center whitespace-nowrap rounded-lg border border-transparent p-0 text-sm font-medium outline-offset-2 transition-all duration-100 focus:outline-none cursor-pointer",
              "data-[disabled]:pointer-events-none data-[unavailable]:pointer-events-none",
              "hover:bg-slate-100 hover:text-slate-900",
              "data-[selected]:bg-[#1d7a5a] data-[selected]:text-white data-[selected]:font-semibold",
              "data-[unavailable]:line-through data-[disabled]:opacity-30 data-[unavailable]:opacity-30",
              "data-[outside-month]:text-slate-300 data-[outside-month]:pointer-events-none",
              isRange && cn(
                "data-[selected]:rounded-none",
                "data-[selection-start]:rounded-l-lg data-[selection-start]:bg-[#1d7a5a] data-[selection-start]:text-white",
                "data-[selection-end]:rounded-r-lg data-[selection-end]:bg-[#1d7a5a] data-[selection-end]:text-white",
                "data-[selected]:not([data-selection-start]):not([data-selection-end]):bg-[#ecfdf5] data-[selected]:not([data-selection-start]):not([data-selection-end]):text-[#1d7a5a]",
              ),
              date.compare(now) === 0 && "ring-2 ring-[#1d7a5a] ring-offset-1",
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  );
};

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-full min-w-[320px]", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  );
};

const RangeCalendar = ({ className, ...props }: RangeCalendarProps) => {
  return (
    <RangeCalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-full min-w-[320px]", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent isRange />
    </RangeCalendarRac>
  );
};

export { Calendar, RangeCalendar };
