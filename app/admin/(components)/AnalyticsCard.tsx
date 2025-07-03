import { cn } from "@/lib/client/utils";
import React from "react";

type AnalyticsCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "orange" | "purple" | "gray" | "yellow"; // ✅ Added yellow
};

const colorMap = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  gray: "bg-gray-100 text-gray-800",
  yellow: "bg-yellow-100 text-yellow-800", // ✅ Added yellow
};

export default function AnalyticsCard({
  label,
  value,
  icon,
  color = "gray",
}: AnalyticsCardProps) {
  return (
    <div className={cn("p-4 rounded-lg shadow", colorMap[color])}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm uppercase font-medium">{label}</h3>

          {value === "loading" ? (
            <div
              className={cn(
                "animate-spin mt-2 rounded-full h-5 w-5 border-b-2 mb-4",
                `border-${color}-500`
              )}
            ></div>
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );
}
