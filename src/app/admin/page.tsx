"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  LogOut,
  Database,
} from "lucide-react";

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string;
  job_title: string;
  company_email: string;
  phone: string;
  country: string;
  city: string | null;
  products: string[];
  estimated_quantity: number;
  purchase_timeframe: string;
  use_case: string;
  message: string | null;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  source: string | null;
  submission_date: string;
  updated_at: string;
  notes: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const statuses = ["New", "Contacted", "Qualified", "Quoted", "Closed", "Lost"];
const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Qualified: "bg-purple-100 text-purple-700",
  Quoted: "bg-cyan-100 text-cyan-700",
  Closed: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);

  const getAuthHeader = useCallback(() => {
    return "Basic " + btoa(`${username}:${password}`);
  }, [username, password]);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "25" });
        if (statusFilter) params.set("status", statusFilter);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/leads?${params}`, {
          headers: { Authorization: getAuthHeader() },
        });

        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }

        const data = await res.json();
        setLeads(data.leads || []);
        setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 });
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchQuery, getAuthHeader]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/leads?page=1&limit=1", {
        headers: { Authorization: "Basic " + btoa(`${username}:${password}`) },
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid credentials");
      }
    } catch {
      setAuthError("Connection error");
    }
  };

  const initDb = async () => {
    try {
      const res = await fetch("/api/db-init", {
        method: "POST",
        headers: { Authorization: getAuthHeader() },
      });
      if (res.ok) {
        setDbInitialized(true);
        fetchLeads();
      }
    } catch (err) {
      console.error("DB init error:", err);
    }
  };

  const updateLeadStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({ status }),
      });
      fetchLeads(pagination.page);
      if (selectedLead?.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const exportCSV = () => {
    const link = document.createElement("a");
    link.href = `/api/leads/export`;
    // Set auth via URL isn't standard, so we fetch it manually
    fetch("/api/leads/export", {
      headers: { Authorization: getAuthHeader() },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `edgecortix-leads-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated, fetchLeads]);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#1a2744]">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">EdgeCortix Leads Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {authError && (
              <p className="text-red-500 text-sm text-center">{authError}</p>
            )}
            <Button type="submit" className="w-full bg-[#00a0ab] hover:bg-[#008a94]">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Admin Header */}
      <header className="bg-[#1a2744] py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">EdgeCortix Leads</h1>
            <p className="text-[#00a0ab] text-xs">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            {!dbInitialized && (
              <Button
                onClick={initDb}
                variant="outline"
                size="sm"
                className="text-xs bg-transparent border-[#00a0ab] text-[#00a0ab] hover:bg-[#00a0ab] hover:text-white"
              >
                <Database className="h-3 w-3 mr-1" /> Init DB
              </Button>
            )}
            <Button
              onClick={() => setIsAuthenticated(false)}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Leads</p>
            <p className="text-2xl font-bold text-[#1a2744] mt-1">
              {pagination.total}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">New</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {leads.filter((l) => l.status === "New").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Qualified</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {leads.filter((l) => l.status === "Qualified").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Closed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {leads.filter((l) => l.status === "Closed").length}
            </p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLeads(1)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val === "all" ? "" : val);
              }}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchLeads(1)}
                variant="outline"
                size="default"
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" /> Search
              </Button>
              <Button
                onClick={exportCSV}
                className="bg-[#00a0ab] hover:bg-[#008a94] gap-1"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                    Products
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                    Qty
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No leads found. Submit a form to see data here.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(lead.submission_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.company_email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                        {lead.company_name}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-xs text-gray-600 max-w-[200px] truncate">
                          {lead.products?.join(", ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                        {lead.estimated_quantity}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={lead.status}
                          onValueChange={(val) => updateLeadStatus(lead.id, val)}
                        >
                          <SelectTrigger className="h-7 text-xs border-0 p-0 w-auto">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[lead.status] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s]}`}
                                >
                                  {s}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} leads)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLeads(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchLeads(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-[#1a2744]">Lead Details</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Contact
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Name:</span>{" "}
                    <strong>
                      {selectedLead.first_name} {selectedLead.last_name}
                    </strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Company:</span>{" "}
                    {selectedLead.company_name}
                  </p>
                  <p>
                    <span className="text-gray-500">Title:</span>{" "}
                    {selectedLead.job_title}
                  </p>
                  <p>
                    <span className="text-gray-500">Email:</span>{" "}
                    <a
                      href={`mailto:${selectedLead.company_email}`}
                      className="text-[#00a0ab] hover:underline"
                    >
                      {selectedLead.company_email}
                    </a>
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span>{" "}
                    {selectedLead.phone}
                  </p>
                  <p>
                    <span className="text-gray-500">Location:</span>{" "}
                    {selectedLead.city ? `${selectedLead.city}, ` : ""}
                    {selectedLead.country}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Products & Business
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Products:</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1 mb-2">
                    {selectedLead.products?.map((p) => (
                      <span
                        key={p}
                        className="bg-[#00a0ab]/10 text-[#00a0ab] text-xs px-2 py-0.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <p>
                    <span className="text-gray-500">Quantity:</span>{" "}
                    {selectedLead.estimated_quantity}
                  </p>
                  <p>
                    <span className="text-gray-500">Timeframe:</span>{" "}
                    {selectedLead.purchase_timeframe}
                  </p>
                  <p>
                    <span className="text-gray-500">Use Case:</span>{" "}
                    {selectedLead.use_case}
                  </p>
                </div>
              </div>

              {selectedLead.message && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      Message
                    </h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedLead.message}
                    </p>
                  </div>
                </>
              )}

              <div className="h-px bg-gray-100" />

              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Status & Tracking
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status:</span>
                    <Select
                      value={selectedLead.status}
                      onValueChange={(val) =>
                        updateLeadStatus(selectedLead.id, val)
                      }
                    >
                      <SelectTrigger className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p>
                    <span className="text-gray-500">Submitted:</span>{" "}
                    {new Date(selectedLead.submission_date).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-gray-500">Source:</span>{" "}
                    {selectedLead.source || "web_form"}
                  </p>
                  {selectedLead.utm_source && (
                    <p>
                      <span className="text-gray-500">UTM Source:</span>{" "}
                      {selectedLead.utm_source}
                    </p>
                  )}
                  {selectedLead.utm_campaign && (
                    <p>
                      <span className="text-gray-500">UTM Campaign:</span>{" "}
                      {selectedLead.utm_campaign}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
