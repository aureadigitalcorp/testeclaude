"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

interface Sale {
  id: string;
  transactionId: string;
  platform: string;
  status: string;
  amount: number;
  customerName: string | null;
  customerEmail: string | null;
  paymentMethod: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  saleDate: string;
  product: { name: string } | null;
}

interface SalesData {
  sales: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
  approved: { label: "Aprovada", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  refunded: { label: "Reembolsada", variant: "danger" },
  chargeback: { label: "Chargeback", variant: "danger" },
  cancelled: { label: "Cancelada", variant: "secondary" },
};

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("30d");
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "25", period });
  if (status !== "all") params.set("status", status);
  if (search) params.set("search", search);

  const { data, isLoading } = useRealtime<SalesData>(`/api/sales?${params.toString()}`, 10000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Vendas</h1>
        <p className="text-sm text-zinc-400">Acompanhe todas as suas vendas em tempo real</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Buscar por nome, email ou transacao..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Todos os status</option>
              <option value="approved">Aprovadas</option>
              <option value="pending">Pendentes</option>
              <option value="refunded">Reembolsadas</option>
              <option value="chargeback">Chargebacks</option>
              <option value="cancelled">Canceladas</option>
            </Select>
            <Select value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }}>
              <option value="today">Hoje</option>
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Vendas</span>
            <span className="text-sm font-normal text-zinc-400">
              {data?.pagination.total || 0} vendas encontradas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>UTM Source</TableHead>
                    <TableHead>UTM Campaign</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.sales && data.sales.length > 0 ? (
                    data.sales.map((sale) => {
                      const st = statusMap[sale.status] || { label: sale.status, variant: "secondary" as const };
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="whitespace-nowrap text-sm">{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{sale.customerName || "-"}</p>
                              <p className="text-xs text-zinc-500">{sale.customerEmail || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{sale.product?.name || "-"}</TableCell>
                          <TableCell className="font-medium text-emerald-400">{formatCurrency(sale.amount)}</TableCell>
                          <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                          <TableCell className="text-sm capitalize">{sale.paymentMethod || "-"}</TableCell>
                          <TableCell className="text-sm text-zinc-400">{sale.utmSource || "-"}</TableCell>
                          <TableCell className="text-sm text-zinc-400">{sale.utmCampaign || "-"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-zinc-500">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    Pagina {data.pagination.page} de {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setSelectedSale(null)}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Detalhes da Venda</h3>
              <button onClick={() => setSelectedSale(null)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">ID da Transacao</span>
                <span className="font-mono text-xs text-zinc-100">{selectedSale.transactionId}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Plataforma</span>
                <span className="capitalize text-zinc-100">{selectedSale.platform}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Valor</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(selectedSale.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Status</span>
                <Badge variant={statusMap[selectedSale.status]?.variant || "secondary"}>
                  {statusMap[selectedSale.status]?.label || selectedSale.status}
                </Badge>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Cliente</span>
                <span className="text-zinc-100">{selectedSale.customerName || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Email</span>
                <span className="text-zinc-100">{selectedSale.customerEmail || "-"}</span>
              </div>
              {selectedSale.utmSource && (
                <>
                  <div className="mb-1 mt-2 text-xs font-semibold uppercase text-zinc-500">UTM Parameters</div>
                  {[
                    ["Source", selectedSale.utmSource],
                    ["Medium", selectedSale.utmMedium],
                    ["Campaign", selectedSale.utmCampaign],
                    ["Content", selectedSale.utmContent],
                    ["Term", selectedSale.utmTerm],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between border-b border-zinc-800 pb-2 last:border-0">
                      <span className="text-zinc-400">{label}</span>
                      <span className="text-zinc-100">{val || "-"}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
