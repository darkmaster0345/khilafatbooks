import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX, 
  Globe, MapPin, AlertTriangle, RefreshCw, 
  Lock, CheckCircle2, XCircle, Clock,
  TrendingUp, Users, Activity, ChevronDown, ChevronUp,
  Info, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subHours } from 'date-fns';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_email: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

interface GeoStats {
  country: string;
  count: number;
  suspicious: number;
}

interface PolicyDetail {
  name: string;
  command: string;
  permissive: boolean;
  usingExpr: string | null;
  checkExpr: string | null;
}

interface Issue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

interface RLSCheck {
  table: string;
  hasRLS: boolean;
  policyCount: number;
  policies: PolicyDetail[];
  issues: Issue[];
  status: 'secure' | 'warning' | 'critical';
}

const AdminSecurity = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [geoStats, setGeoStats] = useState<GeoStats[]>([]);
  const [rlsChecks, setRlsChecks] = useState<RLSCheck[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);







  const [checkingRLS, setCheckingRLS] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    failedAttempts: 0,
    rateLimitHits: 0,
    uniqueIPs: 0,
    suspiciousActivity: 0
  });

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: eventsData } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsData) {
        setEvents(eventsData as SecurityEvent[]);

        const last24h = subHours(new Date(), 24);
        const recentEvents = eventsData.filter(e => new Date(e.created_at) > last24h);
        
        const failed = recentEvents.filter(e => !e.success);
        const rateLimits = recentEvents.filter(e => e.event_type === 'rate_limit');
        const suspicious = recentEvents.filter(e => e.event_type === 'suspicious_activity');
        const uniqueIPs = new Set(recentEvents.map(e => e.ip_address).filter(Boolean));

        setStats({
          totalAttempts: recentEvents.length,
          failedAttempts: failed.length,
          rateLimitHits: rateLimits.length,
          uniqueIPs: uniqueIPs.size,
          suspiciousActivity: suspicious.length
        });

        const geoMap = new Map<string, { count: number; suspicious: number }>();
        eventsData.forEach(event => {
          const country = event.country || 'Unknown';
          const current = geoMap.get(country) || { count: 0, suspicious: 0 };
          current.count++;
          if (!event.success || event.event_type === 'suspicious_activity') {
            current.suspicious++;
          }
          geoMap.set(country, current);
        });

        setGeoStats(
          Array.from(geoMap.entries())
            .map(([country, data]) => ({ country, ...data }))
            .sort((a, b) => b.count - a.count)
        );
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();

    // Subscribe to realtime security events
    const channel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_events' },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setEvents(prev => [newEvent, ...prev].slice(0, 100));
          
          // Update stats
          setStats(prev => ({
            ...prev,
            totalAttempts: prev.totalAttempts + 1,
            failedAttempts: newEvent.success ? prev.failedAttempts : prev.failedAttempts + 1,
            uniqueIPs: prev.uniqueIPs + (newEvent.ip_address ? 1 : 0),
            suspiciousActivity: newEvent.event_type === 'suspicious_activity' 
              ? prev.suspiciousActivity + 1 : prev.suspiciousActivity,
            rateLimitHits: newEvent.event_type === 'rate_limit'
              ? prev.rateLimitHits + 1 : prev.rateLimitHits,
          }));

          // Show toast for failed or suspicious events
          if (!newEvent.success) {
            toast.warning(`Failed ${newEvent.event_type.replace(/_/g, ' ')} from ${newEvent.ip_address || 'unknown IP'}`, {
              description: newEvent.user_email || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSecurityData]);

  const runRLSIntegrityCheck = async () => {
    setCheckingRLS(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-check');

      if (error) {
        toast.error('Failed to run integrity check: ' + error.message);
        return;
      }

      if (data?.checks) {
        setRlsChecks(data.checks as RLSCheck[]);
        setLastCheckedAt(data.checkedAt);

        const criticalCount = data.checks.filter((c: RLSCheck) => c.status === 'critical').length;
        const warningCount = data.checks.filter((c: RLSCheck) => c.status === 'warning').length;
        const secureCount = data.checks.filter((c: RLSCheck) => c.status === 'secure').length;
        const totalIssues = data.checks.reduce((acc: number, c: RLSCheck) => acc + c.issues.length, 0);

        if (criticalCount > 0) {
          toast.error(`🚨 ${criticalCount} critical security issues found! ${totalIssues} total findings.`);
        } else if (warningCount > 0) {
          toast.warning(`⚠️ ${warningCount} warnings across ${totalIssues} findings. ${secureCount} tables fully secure.`);
        } else {
          toast.success(`✅ All ${data.checks.length} tables are secure! ${totalIssues} informational notes.`);
        }
      }
    } catch (error) {
      console.error('Error checking RLS:', error);
      toast.error('Failed to complete integrity check');
    } finally {
      setCheckingRLS(false);
    }
  };

  const getFailureRate = () => {
    if (stats.totalAttempts === 0) return 0;
    return Math.round((stats.failedAttempts / stats.totalAttempts) * 100);
  };

  const getThreatLevel = () => {
    const failureRate = getFailureRate();
    if (stats.rateLimitHits > 10 || stats.suspiciousActivity > 5) return 'high';
    if (failureRate > 50 || stats.rateLimitHits > 5) return 'medium';
    return 'low';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
      default: return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 border-destructive/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const threatLevel = getThreatLevel();


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Perimeter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time threat monitoring, geographic analysis, and RLS policy verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
          <Button variant="outline" onClick={fetchSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Threat Level Banner */}
      <Card className={`border-2 ${
        threatLevel === 'high' ? 'border-destructive bg-destructive/5' :
        threatLevel === 'medium' ? 'border-yellow-500 bg-yellow-500/5' :
        'border-primary bg-primary/5'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {threatLevel === 'high' ? (
                <ShieldX className="h-8 w-8 text-destructive" />
              ) : threatLevel === 'medium' ? (
                <ShieldAlert className="h-8 w-8 text-yellow-500" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
              )}
              <div>
                <p className="font-semibold text-lg">
                  Threat Level: {threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {threatLevel === 'high' 
                    ? 'Elevated suspicious activity detected. Review immediately.'
                    : threatLevel === 'medium'
                    ? 'Some unusual activity detected. Monitor closely.'
                    : 'All systems operating normally. No threats detected.'}
                </p>
              </div>
            </div>
            <Badge variant={threatLevel === 'low' ? 'default' : 'destructive'} className="text-sm">
              Last 24 hours
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" />
              Events (24h)
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalAttempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <XCircle className="h-4 w-4" />
              Failed
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{stats.failedAttempts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertTriangle className="h-4 w-4" />
              Rate Limits
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-500">{stats.rateLimitHits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Unique IPs
            </div>
            <p className="text-2xl font-bold mt-1">{stats.uniqueIPs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Failure Rate
            </div>
            <p className="text-2xl font-bold mt-1">{getFailureRate()}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Security Events</TabsTrigger>
          <TabsTrigger value="geo">Geographic Traffic</TabsTrigger>
          <TabsTrigger value="integrity">
            Integrity Check
            {rlsChecks.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {rlsChecks.filter(c => c.status !== 'secure').length || '✓'}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recent Security Events
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </CardTitle>
              <CardDescription>
                Real-time feed of login attempts, rate limits, and suspicious activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No security events recorded yet.</p>
                  <p className="text-sm">Events will appear here in real-time as users interact with the system.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 30).map((event) => (
                      <TableRow key={event.id} className={!event.success ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            event.event_type === 'rate_limit' || event.event_type === 'suspicious_activity' 
                              ? 'destructive' 
                              : event.event_type === 'login_failed' ? 'outline' : 'secondary'
                          }>
                            {event.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {event.user_email || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {event.ip_address || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.city && event.country 
                            ? `${event.city}, ${event.country}`
                            : event.country || '—'}
                        </TableCell>
                        <TableCell>
                          {event.success ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Traffic Tab */}
        <TabsContent value="geo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Traffic Analysis
              </CardTitle>
              <CardDescription>
                Traffic distribution by country with suspicious activity indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {geoStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No geographic data available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {geoStats.map((geo) => {
                    const maxCount = geoStats[0]?.count || 1;
                    const percentage = Math.round((geo.count / maxCount) * 100);
                    const suspiciousRate = geo.count > 0 
                      ? Math.round((geo.suspicious / geo.count) * 100) 
                      : 0;
                    
                    return (
                      <div key={geo.country} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{geo.country}</span>
                            {suspiciousRate > 30 && (
                              <Badge variant="destructive" className="text-xs">
                                {suspiciousRate}% suspicious
                              </Badge>
                            )}
                          </div>
                          <span className="text-muted-foreground">
                            {geo.count} requests ({geo.suspicious} failed)
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={percentage} className="h-2" />
                          {geo.suspicious > 0 && (
                            <div 
                              className="absolute top-0 left-0 h-2 bg-destructive/50 rounded-full"
                              style={{ width: `${(geo.suspicious / maxCount) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrity Check Tab */}
        <TabsContent value="integrity">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    RLS Policy Integrity Check
                  </CardTitle>
                  <CardDescription>
                    Live verification of Row Level Security policies across all {rlsChecks.length || 23} tables
                    {lastCheckedAt && !isNaN(new Date(lastCheckedAt).getTime()) && (
                      <span className="ml-2 text-xs">
                        · Last checked: {format(new Date(lastCheckedAt), 'MMM d, HH:mm:ss')}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button onClick={runRLSIntegrityCheck} disabled={checkingRLS}>
                  {checkingRLS ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning {rlsChecks.length || 23} tables...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Run Integrity Check
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rlsChecks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Click "Run Integrity Check" to scan all database tables</p>
                  <p className="text-sm mt-1">This will verify RLS policies, access controls, and identify potential security gaps</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rlsChecks.map((check) => {
                    const isExpanded = expandedTable === check.table;
                    const issueCount = check.issues.length;
                    const criticalIssues = check.issues.filter(i => i.severity === 'critical').length;
                    const warningIssues = check.issues.filter(i => i.severity === 'warning').length;

                    return (
                      <div key={check.table} className="border rounded-lg overflow-hidden">
                        {/* Table row - clickable */}
                        <button
                          onClick={() => setExpandedTable(isExpanded ? null : check.table)}
                          className={`w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors ${
                            check.status === 'critical' ? 'bg-destructive/5' :
                            check.status === 'warning' ? 'bg-yellow-500/5' :
                            'bg-muted/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {check.status === 'secure' ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : check.status === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                            <div className="text-left">
                              <p className="font-medium font-mono text-sm">{check.table}</p>
                              <p className="text-xs text-muted-foreground">
                                {check.policyCount} policies · {issueCount} finding{issueCount !== 1 ? 's' : ''}
                                {criticalIssues > 0 && <span className="text-destructive ml-1">({criticalIssues} critical)</span>}
                                {warningIssues > 0 && !criticalIssues && <span className="text-yellow-600 ml-1">({warningIssues} warning{warningIssues !== 1 ? 's' : ''})</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={check.status === 'secure' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}>
                              {check.status}
                            </Badge>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t p-4 space-y-4 bg-background">
                            {/* Policies list */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                Active Policies ({check.policies.length})
                              </h4>
                              <div className="grid gap-1.5">
                                {check.policies.map((policy, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/40">
                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                                      {policy.command}
                                    </Badge>
                                    <span className="text-muted-foreground">{policy.name}</span>
                                    {policy.usingExpr && (
                                      <code className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded max-w-[300px] truncate">
                                        USING: {policy.usingExpr}
                                      </code>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Issues / Findings */}
                            {check.issues.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Findings ({check.issues.length})
                                </h4>
                                <div className="space-y-2">
                                  {check.issues.map((issue, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${getSeverityBg(issue.severity)}`}>
                                      <div className="flex items-start gap-2">
                                        {getSeverityIcon(issue.severity)}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium">{issue.message}</p>
                                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            <strong>Recommendation:</strong> {issue.recommendation}
                                          </p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                                          {issue.severity}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {check.issues.length === 0 && (
                              <div className="text-center py-3 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
                                No issues found. This table's security configuration is solid.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Summary */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Security Summary</p>
                        <p className="text-muted-foreground mt-1">
                          <span className="text-primary font-medium">{rlsChecks.filter(c => c.status === 'secure').length}</span> secure, {' '}
                          <span className="text-yellow-600 font-medium">{rlsChecks.filter(c => c.status === 'warning').length}</span> warnings, {' '}
                          <span className="text-destructive font-medium">{rlsChecks.filter(c => c.status === 'critical').length}</span> critical
                          {' · '}
                          {rlsChecks.reduce((acc, c) => acc + c.issues.length, 0)} total findings across {rlsChecks.length} tables
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Click on any table row to see detailed policy information and actionable recommendations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurity;
