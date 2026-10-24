"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  Code2,
  Key,
  Play,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Layers,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

interface EndpointDef {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  description: string;
  params: { name: string; type: string; required: boolean; description: string; default?: string }[];
  sampleBody?: string;
  sampleResponse: Record<string, any>;
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: "get-events",
    method: "GET",
    path: "/api/v1/events",
    summary: "List all active events",
    description: "Retrieves metadata, competition categories, and scoring criteria for all configured events.",
    params: [],
    sampleResponse: {
      object: "list",
      data: [
        {
          id: "ev-nexathon-26",
          name: "Nexathon 2026 — AI & Hardware Summit",
          slug: "nexathon-2026",
          type: "hackathon",
          status: "active",
          venue: "Grand Arena Convention Center",
          city: "Bengaluru",
          categories: ["AI/ML", "HealthTech", "FinTech", "GreenTech", "Robotics"],
        },
      ],
    },
  },
  {
    id: "get-projects",
    method: "GET",
    path: "/api/v1/projects",
    summary: "List submitted projects",
    description: "Returns paginated innovation projects, assigned booth numbers, crowd votes, and tech stacks.",
    params: [
      { name: "eventId", type: "string", required: false, description: "Filter by event UUID", default: "ev-nexathon-26" },
      { name: "category", type: "string", required: false, description: "Filter by track (e.g. AI/ML, FinTech)" },
      { name: "limit", type: "number", required: false, description: "Number of records to return (1-100)", default: "50" },
      { name: "offset", type: "number", required: false, description: "Pagination offset", default: "0" },
    ],
    sampleResponse: {
      object: "list",
      limit: 50,
      offset: 0,
      total: 12,
      data: [
        {
          id: "p-bioguard",
          title: "BioGuard AI — Diagnostic Telemetry",
          category: "HealthTech",
          teamName: "NeuroHealth Labs",
          boothNo: "A-12",
          votes: 142,
          views: 940,
        },
      ],
    },
  },
  {
    id: "get-leaderboard",
    method: "GET",
    path: "/api/v1/leaderboard",
    summary: "Real-time ranked leaderboard",
    description: "Returns dynamically computed average jury scores, vote counts, and FairScore flags.",
    params: [
      { name: "eventId", type: "string", required: false, description: "Event UUID", default: "ev-nexathon-26" },
    ],
    sampleResponse: {
      object: "leaderboard",
      eventId: "ev-nexathon-26",
      count: 8,
      data: [
        {
          id: "p-bioguard",
          title: "BioGuard AI",
          teamName: "NeuroHealth Labs",
          boothNo: "A-12",
          avgScore: 38.6,
          judgeCount: 3,
          flags: 0,
        },
      ],
    },
  },
  {
    id: "post-checkin",
    method: "POST",
    path: "/api/v1/checkin",
    summary: "Verify & check in attendee pass",
    description: "Programmatically validate QR/barcode credentials for gate turnstiles and handheld hardware scanners.",
    params: [],
    sampleBody: JSON.stringify({ code: "VIS-NEXA-101", eventId: "ev-nexathon-26" }, null, 2),
    sampleResponse: {
      status: "success",
      checkedIn: true,
      wasAlreadyCheckedIn: false,
      attendee: {
        id: "v-1",
        name: "Arjun Verma",
        email: "arjun@example.com",
        type: "visitor",
        code: "VIS-NEXA-101",
        checkinAt: "2026-10-24T10:00:00.000Z",
      },
    },
  },
];

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [apiKey, setApiKey] = useState("ev_live_test_key_2026");
  const [requestQuery, setRequestQuery] = useState("?eventId=ev-nexathon-26");
  const [requestBody, setRequestBody] = useState(selectedEndpoint.sampleBody || "");
  const [activeTab, setActiveTab] = useState<"curl" | "fetch" | "python">("curl");
  const [testing, setTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSelect(ep: EndpointDef) {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody || "");
    setTestResponse(null);
  }

  async function handleSendRequest() {
    setTesting(true);
    setTestResponse(null);
    try {
      const url = `${selectedEndpoint.path}${selectedEndpoint.method === "GET" ? requestQuery : ""}`;
      const res = await fetch(url, {
        method: selectedEndpoint.method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: selectedEndpoint.method === "POST" && requestBody ? requestBody : undefined,
      });
      const data = await res.json();
      setTestResponse({ status: res.status, ok: res.ok, data });
    } catch (err: any) {
      setTestResponse({ status: 500, ok: false, data: { error: err.message || "Request failed" } });
    } finally {
      setTesting(false);
    }
  }

  function getCurlSnippet() {
    const url = `https://eventosintelligence.vercel.app${selectedEndpoint.path}${
      selectedEndpoint.method === "GET" ? requestQuery : ""
    }`;
    if (selectedEndpoint.method === "POST") {
      return `curl -X POST "${url}" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody || "{}"}'`;
    }
    return `curl -X GET "${url}" \\
  -H "X-API-Key: ${apiKey}"`;
  }

  function copySnippet() {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 pb-24">
      {/* Top Banner */}
      <div className="border-b border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Code2 className="h-3.5 w-3.5" />
                <span>REST API Reference · v1 Public</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900">
                Developer API &amp; Integrations
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Integrate EventOS Intelligence with physical turnstiles, badge badge printers, university portals, and CRM workflows.
              </p>
            </div>

            {/* Sandbox Key Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs max-w-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <Key className="h-4 w-4 text-indigo-600" />
                <span>Developer Sandbox Key</span>
              </div>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-[11px] text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none"
                placeholder="Enter API Key..."
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Default test key active. Manage keys in <Link href="/console" className="text-indigo-600 hover:underline">Admin Console</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Documentation Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Navigation */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              API Endpoints (v1)
            </div>
            <div className="space-y-1">
              {ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelect(ep)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition ${
                      isSelected
                        ? "bg-white border border-indigo-200 shadow-xs text-indigo-950 font-semibold"
                        : "hover:bg-slate-100 text-slate-600 text-xs"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            ep.method === "GET"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="truncate text-xs">{ep.path.replace("/api/v1", "")}</span>
                      </div>
                      <div className="mt-1 truncate text-[11px] text-slate-400 font-normal">
                        {ep.summary}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-2">
              <div className="font-semibold text-slate-700">Authentication</div>
              <p className="text-[11px] leading-relaxed">
                Send your API key in every request via the <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">X-API-Key</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">Authorization: Bearer</code> header.
              </p>
              <div className="font-semibold text-slate-700 pt-2">Rate Limits</div>
              <p className="text-[11px] leading-relaxed">
                Standard keys are capped at <strong>100 req/min</strong>. Enterprise SLA unlocks dedicated unmetered pipelines.
              </p>
            </div>
          </div>

          {/* Endpoint Details & Playground */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${
                    selectedEndpoint.method === "GET"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-base font-bold text-slate-900">
                  {selectedEndpoint.path}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-900">{selectedEndpoint.summary}</h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {selectedEndpoint.description}
              </p>

              {/* Parameters */}
              {selectedEndpoint.params.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Query Parameters
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                          <th className="pb-2">Parameter</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Default</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedEndpoint.params.map((p) => (
                          <tr key={p.name}>
                            <td className="py-2.5 font-mono text-indigo-600 font-semibold">{p.name}</td>
                            <td className="py-2.5 font-mono text-[11px] text-slate-500">{p.type}</td>
                            <td className="py-2.5 font-mono text-[11px] text-slate-400">{p.default || "—"}</td>
                            <td className="py-2.5 text-slate-600">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Request Code Snippet */}
              <div className="mt-8">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Request Example
                  </h3>
                  <button
                    onClick={copySnippet}
                    className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied" : "Copy cURL"}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-indigo-200 leading-relaxed">
                  {getCurlSnippet()}
                </pre>
              </div>

              {/* Live Interactive Playground */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Live Interactive Tester</span>
                  </h3>
                  <button
                    onClick={handleSendRequest}
                    disabled={testing}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    <span>{testing ? "Executing..." : "Send Live Request"}</span>
                  </button>
                </div>

                {selectedEndpoint.method === "POST" && (
                  <div className="mb-4">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      JSON Request Body:
                    </label>
                    <textarea
                      rows={4}
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Output Viewer */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Response Payload:</span>
                    {testResponse && (
                      <span
                        className={`font-mono font-bold ${
                          testResponse.ok ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        HTTP {testResponse.status}
                      </span>
                    )}
                  </div>
                  <pre className="max-h-72 overflow-y-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400">
                    {testResponse
                      ? JSON.stringify(testResponse.data, null, 2)
                      : JSON.stringify(selectedEndpoint.sampleResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
