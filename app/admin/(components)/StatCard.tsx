import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium text-gray-600 m-0">
          {title}
        </CardTitle>
        <span className="text-xl text-black">{icon}</span>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {value === "Loading..." ? (
            <div>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mb-4"></div>
            </div>
          ) : (
            value
          )}
        </div>
      </CardContent>
    </Card>
  );
}
