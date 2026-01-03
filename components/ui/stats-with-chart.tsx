"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as RechartsPrimitive from "recharts";
import { ExternalLink } from "lucide-react";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-xl border bg-card text-card-foreground shadow",
            className
        )}
        {...props}
    />
));
Card.displayName = "Card";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Chart related components and types
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
    [k in string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
    } & (
        | { color?: string; theme?: never }
        | { color?: never; theme: Record<keyof typeof THEMES, string> }
    );
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }

    return context;
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
    const colorConfig = Object.entries(config).filter(
        ([, config]) => config.theme || config.color
    );

    if (!colorConfig.length) {
        return null;
    }

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
                                .map(([key, itemConfig]) => {
                                    const color =
                                        itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
                                        itemConfig.color;
                                    return color ? `  --color-${key}: ${color};` : null;
                                })
                                .join("\n")}
}
`
                    )
                    .join("\n"),
            }}
        />
    );
};

function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
        typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-slot="chart"
                data-chart={chartId}
                className={cn(
                    "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
                    className
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

const data = [
    {
        date: "Nov 24, 2023",
        "Student Enrolls": 12,
        "Course Completes": 5,
        "Revenue": 830,
    },
    {
        date: "Nov 25, 2023",
        "Student Enrolls": 15,
        "Course Completes": 8,
        "Revenue": 960,
    },
    {
        date: "Nov 26, 2023",
        "Student Enrolls": 18,
        "Course Completes": 12,
        "Revenue": 1100,
    },
    {
        date: "Nov 27, 2023",
        "Student Enrolls": 14,
        "Course Completes": 9,
        "Revenue": 890,
    },
    {
        date: "Nov 28, 2023",
        "Student Enrolls": 8,
        "Course Completes": 15,
        "Revenue": 1200,
    },
    {
        date: "Nov 29, 2023",
        "Student Enrolls": 22,
        "Course Completes": 18,
        "Revenue": 1500,
    },
    {
        date: "Nov 30, 2023",
        "Student Enrolls": 19,
        "Course Completes": 14,
        "Revenue": 1350,
    },
];

const summary = [
    {
        name: "Student Enrolls",
        label: "Total Enrolls",
        value: "145",
        change: "+12",
        percentageChange: "+8.4%",
        changeType: "positive",
    },
    {
        name: "Course Completes",
        label: "Completions",
        value: "86",
        change: "+8",
        percentageChange: "+6.3%",
        changeType: "positive",
    },
    {
        name: "Revenue",
        label: "Revenue",
        value: "€12,450",
        change: "+1250",
        percentageChange: "+11.2%",
        changeType: "positive",
    },
];

const sanitizeName = (name: string) => {
    return name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "_")
        .toLowerCase();
};

export default function StatsWithChart() {
    return (
        <div className="w-full">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
                {summary.map((item) => {
                    const sanitizedName = sanitizeName(item.name);
                    const gradientId = `gradient-${sanitizedName}`;

                    const color =
                        item.changeType === "positive"
                            ? "hsl(142.1 76.2% 36.3%)"
                            : "hsl(0 72.2% 50.6%)";

                    return (
                        <Card key={item.name} className="p-0">
                            <CardContent className="p-4 pb-0">
                                <div>
                                    <dt className="text-sm font-medium text-foreground">
                                        {item.label}
                                    </dt>
                                    <div className="flex items-baseline justify-between">
                                        <dd
                                            className={cn(
                                                item.changeType === "positive"
                                                    ? "text-green-600 dark:text-green-500"
                                                    : "text-red-600 dark:text-red-500",
                                                "text-lg font-semibold"
                                            )}
                                        >
                                            {item.value}
                                        </dd>
                                        <dd className="flex items-center space-x-1 text-sm">
                                            <span className="font-medium text-foreground">
                                                {item.change}
                                            </span>
                                            <span
                                                className={cn(
                                                    item.changeType === "positive"
                                                        ? "text-green-600 dark:text-green-500"
                                                        : "text-red-600 dark:text-red-500"
                                                )}
                                            >
                                                ({item.percentageChange})
                                            </span>
                                        </dd>
                                    </div>
                                </div>

                                <div className="mt-2 h-16 overflow-hidden">
                                    <ChartContainer
                                        className="w-full h-full"
                                        config={{
                                            [item.name]: {
                                                label: item.name,
                                                color: color,
                                            },
                                        }}
                                    >
                                        <RechartsPrimitive.AreaChart data={data}>
                                            <defs>
                                                <linearGradient
                                                    id={gradientId}
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor={color}
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={color}
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <RechartsPrimitive.XAxis dataKey="date" hide={true} />
                                            <RechartsPrimitive.Area
                                                dataKey={item.name}
                                                stroke={color}
                                                fill={`url(#${gradientId})`}
                                                fillOpacity={0.4}
                                                strokeWidth={1.5}
                                                type="monotone"
                                            />
                                        </RechartsPrimitive.AreaChart>
                                    </ChartContainer>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </dl>
        </div>
    );
}
