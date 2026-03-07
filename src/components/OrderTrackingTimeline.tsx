import { Package, CreditCard, Settings, Truck, CheckCircle2 } from 'lucide-react';

const steps = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'verified', label: 'Payment Verified', icon: CreditCard },
  { key: 'processing', label: 'Processing', icon: Settings },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function getActiveStep(status: string, shippingStatus: string | null): number {
  if (status === 'rejected') return -1;
  if (shippingStatus === 'delivered') return 4;
  if (shippingStatus === 'shipped') return 3;
  if (shippingStatus === 'processing') return 2;
  if (status === 'approved') return 1;
  return 0; // pending
}

interface Props {
  status: string;
  shippingStatus: string | null;
  trackingNumber?: string | null;
}

const OrderTrackingTimeline = ({ status, shippingStatus, trackingNumber }: Props) => {
  const active = getActiveStep(status, shippingStatus);

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
          <Package className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold text-destructive">Order Rejected</p>
          <p className="text-xs text-muted-foreground">Payment could not be verified. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const isActive = i <= active;
          const isCurrent = i === active;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-md ring-4 ring-primary/15'
                    : isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground/40'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${
                  isActive ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 mt-[-18px] rounded-full transition-colors ${
                  i < active ? 'bg-primary/30' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      {trackingNumber && active >= 3 && (
        <div className="text-xs text-muted-foreground">
          Tracking: <span className="font-mono font-semibold text-foreground">{trackingNumber}</span>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingTimeline;
