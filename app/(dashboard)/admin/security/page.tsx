
import { checkSystemHealth } from "@/app/actions/system-health";
import { getActivityLogs } from "@/app/actions/logging";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Activity, Database, Server, HardDrive, Clock, Cpu,
    CheckCircle2, XCircle, Shield, AlertTriangle, Layers,
    Globe, Terminal, FileText, Router, List
} from "lucide-react";

import { AutoRefresh } from "@/components/admin/auto-refresh";
import { formatDistanceToNow } from "date-fns";

export default async function SystemHealthPage() {
    const health = await checkSystemHealth();
    const logs = await getActivityLogs(100);

    // @ts-ignore
    const dbVersion = health.database.version || "PostgreSQL";

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Health & Security</h1>
                        <p className="text-muted-foreground">Deep inspection of infrastructure, data integrity, and security configuration.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <AutoRefresh intervalMs={60000} />
                        <Badge variant="outline" className="text-xs font-mono">
                            Last Checked: {health.timestamp.toLocaleString()}
                        </Badge>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="health" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="health">System Health</TabsTrigger>
                    <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="health" className="space-y-6">
                    {/* Critical Services Grid */}
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Database Status */}
                        <Card className={health.database.status ? "border-green-500/50 bg-green-500/5 relative overflow-hidden" : "border-red-500/50 bg-red-500/5"}>
                            <div className="absolute top-0 right-0 p-3 opacity-10"><Database className="w-24 h-24" /></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Database Cluster</CardTitle>
                                <Database className={`h-4 w-4 ${health.database.status ? "text-green-500" : "text-red-500"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${health.database.status ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                    {health.database.status ? "Operational" : "Down"}
                                </div>
                                <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Latency:</span>
                                        <span className="font-mono">{health.database.latency}ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Version:</span>
                                        <span className="font-mono truncate w-32 text-right" title={dbVersion}>{dbVersion}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Redis Status */}
                        <Card className={health.redis.status ? "border-green-500/50 bg-green-500/5 relative overflow-hidden" : "border-yellow-500/50 bg-yellow-500/5"}>
                            <div className="absolute top-0 right-0 p-3 opacity-10"><Activity className="w-24 h-24" /></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cache & Rate Limit</CardTitle>
                                <Activity className={`h-4 w-4 ${health.redis.status ? "text-green-500" : "text-yellow-500"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${health.redis.status ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                                    {health.redis.status ? "Operational" : "Issue"}
                                </div>
                                <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Latency:</span>
                                        <span className="font-mono">{health.redis.latency}ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Provider:</span>
                                        <span className="font-mono">Upstash (Redis)</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Storage Status */}
                        <Card className={health.storage.status ? "border-green-500/50 bg-green-500/5 relative overflow-hidden" : "border-red-500/50 bg-red-500/5"}>
                            <div className="absolute top-0 right-0 p-3 opacity-10"><HardDrive className="w-24 h-24" /></div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Object Storage</CardTitle>
                                <HardDrive className={`h-4 w-4 ${health.storage.status ? "text-green-500" : "text-red-500"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${health.storage.status ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                    {health.storage.status ? "Operational" : "Error"}
                                </div>
                                <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Latency:</span>
                                        <span className="font-mono">{health.storage.latency}ms</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Provider:</span>
                                        <span className="font-mono">Cloudflare R2</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Data Integrity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5" />
                                    Data Distribution
                                </CardTitle>
                                <CardDescription>Live record counts and file type breakdown</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                                        <span className="text-2xl font-bold">{health.database.recordCounts?.students}</span>
                                        <span className="text-xs text-muted-foreground">Total Students</span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                                        <span className="text-2xl font-bold">{health.database.recordCounts?.documents}</span>
                                        <span className="text-xs text-muted-foreground">Total Documents</span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-muted/30 rounded-lg">
                                        <span className="text-2xl font-bold">{health.database.recordCounts?.payments}</span>
                                        <span className="text-xs text-muted-foreground">Transactions</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> Document Inventory (by Type)
                                    </h4>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                        {health.documents && health.documents.length > 0 ? (
                                            health.documents.map((doc, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-xs">{doc.type}</Badge>
                                                    </div>
                                                    <span className="font-mono font-medium">{doc.count}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground text-center py-4">No documents found.</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Environment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    Server Environment
                                </CardTitle>
                                <CardDescription>Runtime configuration and resource usage</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 grid-cols-2">
                                {/* Memory */}
                                <div className="col-span-2 grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/10">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Activity className="h-3 w-3" /> RSS Memory
                                        </span>
                                        <span className="text-lg font-mono font-medium">{(health.system.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Activity className="h-3 w-3" /> Heap Used
                                        </span>
                                        <span className="text-lg font-mono font-medium">{(health.system.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>

                                {/* Runtime Details */}
                                <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" /> Uptime
                                    </span>
                                    <span className="font-mono font-medium">{Math.floor(health.system.uptime / 60)}m {Math.floor(health.system.uptime % 60)}s</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Cpu className="h-3 w-3" /> Node Version
                                    </span>
                                    <span className="font-mono font-medium">{health.system.nodeVersion}</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Globe className="h-3 w-3" /> Region
                                    </span>
                                    <span className="font-mono font-medium">{health.system.region}</span>
                                </div>
                                <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Terminal className="h-3 w-3" /> Environment
                                    </span>
                                    <span className="font-mono font-medium uppercase">{health.system.env}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Config Audit */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Configuration Audit
                            </CardTitle>
                            <CardDescription>Validation of required environment variables (values are masked)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {health.config.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between p-2 border rounded-md text-xs group hover:border-foreground/50 transition-colors">
                                        <span className="font-mono truncate max-w-[240px] text-muted-foreground group-hover:text-foreground transition-colors" title={item.key}>
                                            {item.key}
                                        </span>
                                        {item.exists ? (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>OK</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full">
                                                <XCircle className="h-3 w-3" />
                                                <span>MISSING</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>
                            <strong className="block mb-1">Administrative Access Only</strong>
                            This dashboard exposes sensitive infrastructure details. Ensure strict access controls are maintained.
                            Unauthorized access could lead to system reconnaissance.
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="logs">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <List className="h-5 w-5" />
                                System Activity Logs
                            </CardTitle>
                            <CardDescription>
                                Recent system events, user actions, and security alerts (Last 100 entries).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                                <div className="space-y-4">
                                    {logs.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-10">
                                            No logs recorded yet.
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className="flex flex-col gap-2 border-b last:border-0 pb-4 last:pb-0 relative">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={
                                                            log.action === 'UPLOAD' ? 'secondary' :
                                                                log.action === 'DELETE' ? 'destructive' :
                                                                    log.action === 'LOGIN' ? 'default' :
                                                                        'outline'
                                                        }>
                                                            {log.action}
                                                        </Badge>
                                                        <span className="font-medium text-sm">{log.title}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                                                    </span>
                                                </div>

                                                {log.description && (
                                                    <p className="text-xs text-muted-foreground ml-1">{log.description}</p>
                                                )}

                                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded w-fit">
                                                    <div className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        {log.userEmail || "Anonymous"}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Router className="h-3 w-3" />
                                                        {log.ipAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
