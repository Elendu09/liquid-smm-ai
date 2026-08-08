import { AlertTriangle, CreditCard, Pause, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillingState } from "@/hooks/useBillingState";
import { useNavigate } from "react-router-dom";

export function GracePeriodBanner() {
  const { status, daysLeft, resume, cancel } = useBillingState();
  const navigate = useNavigate();

  if (status === "active") return null;

  const isGrace = status === "grace";
  const bg = isGrace
    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100"
    : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-100";

  const title = isGrace
    ? `Subscription past due — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in grace period`
    : "Subscription frozen — publishing paused";

  const description = isGrace
    ? "Publishing keeps running, analytics are read-only, and exports always work. Update your payment method to stay active."
    : "Your queue is paused and analytics are read-only. Reactivate to resume publishing. You can always export your data.";

  const handleExport = () => {
    // exports always work — navigate to billing invoices export or analytics export
    navigate("/dashboard/settings/billing");
  };

  const handleUpdatePayment = () => navigate("/dashboard/settings/billing");
  const handleReactivate = () => {
    resume();
  };
  const handlePause = () => cancel();

  return (
    <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${bg}`}>
      <div className="flex gap-3 min-w-0">
        <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${isGrace ? "bg-amber-500/20 text-amber-600" : "bg-rose-500/20 text-rose-600"}`}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">{title}</p>
          <p className="text-xs opacity-80 mt-1 leading-relaxed">{description}</p>
          {isGrace && <p className="text-[11px] opacity-70 mt-1">{daysLeft} days left — publishing continues for {daysLeft} days, then frozen.</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {isGrace ? (
          <>
            <Button size="sm" onClick={handleUpdatePayment} className="h-8">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Update payment
            </Button>
            <Button size="sm" variant="outline" onClick={handlePause} className="h-8">
              <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport} className="h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export data
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" onClick={handleReactivate} className="h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reactivate
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export data
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
