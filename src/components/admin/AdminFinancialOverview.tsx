import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
const db = supabase as any;
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Receipt,
  ShieldCheck,
  Loader2,
  Calendar,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPKR } from '@/lib/currency';
import { toast } from 'sonner';
import { PRIVACY_FEE } from '@/lib/constants';

type Expense = {
  id: string;
  created_at: string;
  category: 'server_costs' | 'packaging' | 'shipping' | 'marketing' | 'office' | 'other';
  amount: number;
  description: string;
  receipt_url: string | null;
};

const AdminFinancialOverview = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    grossRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    privacyRevenue: 0,
    cogs: 0,
    shippingCosts: 0,
    otherExpenses: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'other',
    amount: '',
    description: '',
    receipt_url: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch delivered orders
      const { data: orders, error: ordersError } = await db
        .from('orders')
        .select('total, book_cost, shipping_cost')
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await db
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch privacy mode revenue (count profiles who paid)
      const { count: privacyPaidCount, error: privacyError } = await db
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('privacy_paid', true);

      if (privacyError) throw privacyError;

      // Calculations
      const grossRevenue = (orders || []).reduce((acc, curr) => acc + (curr.total || 0), 0);
      const cogs = (orders || []).reduce((acc, curr) => acc + (Number(curr.book_cost) || 0), 0);
      const shippingCosts = (orders || []).reduce((acc, curr) => acc + (Number(curr.shipping_cost) || 0), 0);
      const otherExpenses = (expensesData || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const privacyRevenue = (privacyPaidCount || 0) * PRIVACY_FEE;

      const totalExpenses = cogs + shippingCosts + otherExpenses;
      const netProfit = grossRevenue - totalExpenses;

      setStats({
        grossRevenue,
        totalExpenses,
        netProfit,
        privacyRevenue,
        cogs,
        shippingCosts,
        otherExpenses
      });
      setExpenses(expensesData as Expense[]);
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await db
        .from('expenses')
        .insert([{
          category: newExpense.category as any,
          amount: parseFloat(newExpense.amount),
          description: newExpense.description,
          receipt_url: newExpense.receipt_url || null
        }]);

      if (error) throw error;

      toast.success('Expense logged successfully');
      setIsModalOpen(false);
      setNewExpense({
        category: 'other',
        amount: '',
        description: '',
        receipt_url: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error('Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Financial Overview</h2>
          <p className="text-sm text-muted-foreground">Track net profit and tax optimization metrics.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
              <Plus className="h-4 w-4" /> Log New Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Log Business Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(val) => setNewExpense({...newExpense, category: val})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="server_costs">Server Costs</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="rounded-xl"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Vercel Hosting Fee"
                  className="rounded-xl"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt URL (Optional)</Label>
                <Input
                  id="receipt"
                  placeholder="https://..."
                  className="rounded-xl"
                  value={newExpense.receipt_url}
                  onChange={(e) => setNewExpense({...newExpense, receipt_url: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={submitting} className="w-full rounded-xl">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Gross Revenue</p>
          <p className="mt-1 text-3xl font-bold font-display tracking-tight text-foreground">{formatPKR(stats.grossRevenue)}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> From delivered orders
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform">
              <TrendingDown className="h-6 w-6" />
            </div>
            <ArrowDownRight className="h-5 w-5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          <p className="mt-1 text-3xl font-bold font-display tracking-tight text-foreground">{formatPKR(stats.totalExpenses)}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
             Includes COGS & Shipping
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Net Taxable Profit</p>
          <p className="mt-1 text-3xl font-bold font-display tracking-tight text-foreground">{formatPKR(stats.netProfit)}</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium">
             Calculated for tax shield
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Privacy Tracker */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Privacy Mode Revenue
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Premium Service Fee</span>
              <span className="font-medium">{formatPKR(PRIVACY_FEE)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Subscribers</span>
              <span className="font-medium">{(stats.privacyRevenue / PRIVACY_FEE) || 0}</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Privacy Profit</p>
              <p className="text-2xl font-bold font-display text-primary">{formatPKR(stats.privacyRevenue)}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-xl">
              Privacy Mode is 100% margin service. This metric is isolated to track the ROI of our privacy-first features.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold text-foreground mb-6">Expense Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Book Costs (COGS)</span>
              </div>
              <p className="text-xl font-bold">{formatPKR(stats.cogs)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Actual Shipping Costs</span>
              </div>
              <p className="text-xl font-bold">{formatPKR(stats.shippingCosts)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vercel & Operations</span>
              </div>
              <p className="text-xl font-bold">{formatPKR(stats.otherExpenses)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Total Burn</span>
              </div>
              <p className="text-xl font-bold text-primary">{formatPKR(stats.totalExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Recent Expenses</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-center">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No expenses logged yet.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-xs font-medium">
                    {new Date(expense.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                      {expense.category.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatPKR(expense.amount)}</TableCell>
                  <TableCell className="text-center">
                    {expense.receipt_url ? (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Receipt className="h-4 w-4 mx-auto" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminFinancialOverview;
