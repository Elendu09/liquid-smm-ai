import { Routes, Route, Navigate } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/shell";
import BioEditor from "../linkbio/BioEditor";
import AnalyticsView from "../views/linkbio/AnalyticsView";

function AnalyticsPage() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PageHeader
          title="Link in Bio · Analytics"
          description="Click-through performance for your bio page."
        />
      </div>
      <AnalyticsView />
    </div>
  );
}

export default function LinkInBioHub() {
  return (
    <Routes>
      <Route index element={<BioEditor />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      {/* Legacy sub-routes → editor */}
      <Route path="pages" element={<Navigate to="/dashboard/link-in-bio" replace />} />
      <Route path="themes" element={<Navigate to="/dashboard/link-in-bio" replace />} />
      <Route path="templates" element={<Navigate to="/dashboard/link-in-bio" replace />} />
      <Route path="*" element={<Navigate to="/dashboard/link-in-bio" replace />} />
    </Routes>
  );
}
