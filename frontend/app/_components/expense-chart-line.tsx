"use client";

import { AnimatedLine } from "@mui/x-charts/LineChart";
import type { ComponentProps } from "react";

type ExpenseChartLineProps = ComponentProps<typeof AnimatedLine> & {
  "data-series"?: string;
};

export function ExpenseChartLine(props: ExpenseChartLineProps) {
  const { "data-series": seriesId, style, ...rest } = props;

  if (seriesId === "budgetPace") {
    return (
      <AnimatedLine
        {...rest}
        style={{
          ...style,
          stroke: "#c65d12",
          strokeDasharray: "8 6",
          strokeWidth: 2.5,
        }}
      />
    );
  }

  return (
    <AnimatedLine
      {...rest}
      style={{
        ...style,
        stroke: "#59b655",
        strokeWidth: 2.5,
      }}
    />
  );
}
