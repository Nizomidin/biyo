import { useState } from "react";
import { ToothStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ToothChartProps {
  teeth: ToothStatus[];
  isChild: boolean;
  onToothChange: (teeth: ToothStatus[]) => void;
  readonly?: boolean;
}

// Adult teeth numbering (32 teeth)
// Layout as per dental chart:
// Upper right (patient's right): 18, 17, 16, 15, 14, 13, 12, 11
// Upper left (patient's left): 21, 22, 23, 24, 25, 26, 27, 28
// Lower right (patient's right): 48, 47, 46, 45, 44, 43, 42, 41
// Lower left (patient's left): 31, 32, 33, 34, 35, 36, 37, 38
const ADULT_TEETH = [
  // Upper jaw - right side (Верх справа) - displayed right to left (18 on left, 11 on right)
  [18, 17, 16, 15, 14, 13, 12, 11],
  // Upper jaw - left side (Верх слева) - displayed left to right (21 on left, 28 on right)
  [21, 22, 23, 24, 25, 26, 27, 28],
  // Lower jaw - right side (Низ справа) - displayed right to left (48 on left, 41 on right)
  [48, 47, 46, 45, 44, 43, 42, 41],
  // Lower jaw - left side (Низ слева) - displayed left to right (31 on left, 38 on right)
  [31, 32, 33, 34, 35, 36, 37, 38],
];

// Baby teeth numbering (20 teeth)
const BABY_TEETH = [
  // Upper jaw
  [55, 54, 53, 52, 51],
  [61, 62, 63, 64, 65],
  // Lower jaw
  [85, 84, 83, 82, 81],
  [71, 72, 73, 74, 75],
];

const STATUS_COLORS = {
  healthy: "bg-blue-500",
  problem: "bg-orange-500",
  treating: "bg-yellow-500",
  treated: "bg-green-500",
  missing: "bg-gray-400",
};

const STATUS_ORDER: ToothStatus["status"][] = [
  "healthy",
  "problem",
  "treating",
  "treated",
  "missing",
];

export function ToothChart({
  teeth,
  isChild,
  onToothChange,
  readonly = false,
}: ToothChartProps) {
  const toothMap = new Map(teeth.map((t) => [t.toothNumber, t.status]));

  const getToothStatus = (toothNumber: number): ToothStatus["status"] => {
    return toothMap.get(toothNumber) || "healthy";
  };

  const cycleToothStatus = (toothNumber: number) => {
    if (readonly) return;

    const currentStatus = getToothStatus(toothNumber);
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIndex];

    const updatedTeeth = teeth.filter((t) => t.toothNumber !== toothNumber);
    if (nextStatus !== "healthy" || toothMap.has(toothNumber)) {
      updatedTeeth.push({ toothNumber, status: nextStatus });
    }
    onToothChange(updatedTeeth);
  };

  const toothNumbers = isChild ? BABY_TEETH : ADULT_TEETH;

  return (
    <div className="w-full">
      <div className="text-sm font-medium mb-4 text-center">
        {isChild ? "Молочные зубы" : "Постоянные зубы"}
      </div>
      <div className="max-w-[600px] mx-auto">
        {/* Labels for upper jaw */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="text-xs text-muted-foreground text-center">Верх справа</div>
          <div className="text-xs text-muted-foreground text-center">Верх слева</div>
        </div>
        
        {/* Upper jaw */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Upper right */}
          <div className="flex justify-center gap-1">
            {toothNumbers[0].map((toothNum) => {
              const status = getToothStatus(toothNum);
              return (
                <button
                  key={`upper-right-${toothNum}`}
                  type="button"
                  onClick={() => cycleToothStatus(toothNum)}
                  disabled={readonly}
                  className={cn(
                    "h-12 w-12 rounded-full border-2 border-border flex items-center justify-center text-xs font-medium transition-colors",
                    STATUS_COLORS[status],
                    !readonly && "hover:opacity-80 cursor-pointer",
                    readonly && "cursor-default"
                  )}
                  title={`Зуб ${toothNum}: ${getStatusLabel(status)}`}
                >
                  {toothNum}
                </button>
              );
            })}
          </div>
          
          {/* Upper left */}
          <div className="flex justify-center gap-1">
            {toothNumbers[1].map((toothNum) => {
              const status = getToothStatus(toothNum);
              return (
                <button
                  key={`upper-left-${toothNum}`}
                  type="button"
                  onClick={() => cycleToothStatus(toothNum)}
                  disabled={readonly}
                  className={cn(
                    "h-12 w-12 rounded-full border-2 border-border flex items-center justify-center text-xs font-medium transition-colors",
                    STATUS_COLORS[status],
                    !readonly && "hover:opacity-80 cursor-pointer",
                    readonly && "cursor-default"
                  )}
                  title={`Зуб ${toothNum}: ${getStatusLabel(status)}`}
                >
                  {toothNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider line */}
        <div className="border-t border-border my-4"></div>

        {/* Labels for lower jaw */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div className="text-xs text-muted-foreground text-center">Низ справа</div>
          <div className="text-xs text-muted-foreground text-center">Низ слева</div>
        </div>

        {/* Lower jaw */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lower right */}
          <div className="flex justify-center gap-1">
            {toothNumbers[2].map((toothNum) => {
              const status = getToothStatus(toothNum);
              return (
                <button
                  key={`lower-right-${toothNum}`}
                  type="button"
                  onClick={() => cycleToothStatus(toothNum)}
                  disabled={readonly}
                  className={cn(
                    "h-12 w-12 rounded-full border-2 border-border flex items-center justify-center text-xs font-medium transition-colors",
                    STATUS_COLORS[status],
                    !readonly && "hover:opacity-80 cursor-pointer",
                    readonly && "cursor-default"
                  )}
                  title={`Зуб ${toothNum}: ${getStatusLabel(status)}`}
                >
                  {toothNum}
                </button>
              );
            })}
          </div>
          
          {/* Lower left */}
          <div className="flex justify-center gap-1">
            {toothNumbers[3].map((toothNum) => {
              const status = getToothStatus(toothNum);
              return (
                <button
                  key={`lower-left-${toothNum}`}
                  type="button"
                  onClick={() => cycleToothStatus(toothNum)}
                  disabled={readonly}
                  className={cn(
                    "h-12 w-12 rounded-full border-2 border-border flex items-center justify-center text-xs font-medium transition-colors",
                    STATUS_COLORS[status],
                    !readonly && "hover:opacity-80 cursor-pointer",
                    readonly && "cursor-default"
                  )}
                  title={`Зуб ${toothNum}: ${getStatusLabel(status)}`}
                >
                  {toothNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-full", STATUS_COLORS.healthy)} />
          <span>Здоровый</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-full", STATUS_COLORS.problem)} />
          <span>Проблема</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-full", STATUS_COLORS.treating)} />
          <span>Лечится</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-full", STATUS_COLORS.treated)} />
          <span>Вылечен</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded-full", STATUS_COLORS.missing)} />
          <span>Отсутствует</span>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: ToothStatus["status"]): string {
  const labels = {
    healthy: "Здоровый",
    problem: "Проблема",
    treating: "Лечится",
    treated: "Вылечен",
    missing: "Отсутствует",
  };
  return labels[status];
}

