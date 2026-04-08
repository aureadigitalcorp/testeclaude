"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Target,
  BarChart3,
  RefreshCw,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";

interface Metrics {
  overview: {
    revenue: number;
    grossRevenue: number;
    refundedAmount: number;
    adSpend: number;
    grossProfit: number;
    netProfit: number;
    additionalCosts: number;
    fixedCosts: number;
    percentageCosts: number;
    roas: number;
    roi: number;
    cpa: number;
    conversionRate: number;
    salesCount: number;
    refundCount: number;
    pendingCount: number;
    pendingAmount: number;
    totalTransactions: number;
  };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, mutate } = useRealtime<Metrics>(
    `/api/metrics?period=${period}`,
    10000
  );

  const o = data?.overview;

  const cards = [
    {
      title: "Faturamento Pago",
      value: formatCurrency(o?.revenue || 0),
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Gasto em Ads",
      value: formatCurrency(o?.adSpend || 0),
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Lucro Bruto",
      value: formatCurrency(o?.grossProfit || 0),
      icon: (o?.grossProfit || 0) >= 0 ? TrendingUp : TrendingDown,
      color: (o?.grossProfit || 0) >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: (o?.grossProfit || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(o?.netProfit || 0),
      icon: (o?.netProfit || 0) >= 0 ? TrendingUp : TrendingDown,
      color: (o?.netProfit || 0) >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: (o?.netProfit || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      title: "ROAS",
      value: `${(o?.roas || 0).toFixed(2)}x`,
      icon: Target,
      color: (o?.roas || 0) >= 2 ? "text-emerald-500" : "text-yellow-500",
      bgColor: (o?.roas || 0) >= 2 ? "bg-emerald-500/10" : "bg-yellow-500/10",
    },
    {
      title: "ROI",
      value: formatPercent(o?.roi || 0),
      icon: Percent,
      color: (o?.roi || 0) >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: (o?.roi || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      title: "CPA",
      value: formatCurrency(o?.cpa || 0),
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Vendas Aprovadas",
      value: String(o?.salesCount || 0),
      icon: ShoppingCart,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Taxa de Conversão",
      value: formatPercent(o?.conversionRate || 0),
      icon: ArrowUpRight,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Reembolsos",
      value: String(o?.refundCount || 0),
      icon: ArrowDownRight,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Custos Adicionais",
      value: formatCurrency(o?.additionalCosts || 0),
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Pendentes",
      value: `${o?.pendingCount || 0} (${formatCurrency(o?.pendingAmount || 0)})`,
      icon: RefreshCw,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-400">Visao geral das suas metricas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
          </Select>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 rounded bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-400">{card.title}</p>
                  <div className={`rounded-lg p-2 ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className={`mt-2 text-2xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">Faturamento Bruto</span>
                <span className="font-medium text-zinc-100">{formatCurrency(o?.grossRevenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">(-) Reembolsos</span>
                <span className="font-medium text-red-400">-{formatCurrency(o?.refundedAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">= Faturamento Liquido</span>
                <span className="font-semibold text-zinc-100">{formatCurrency(o?.revenue || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">(-) Gasto em Ads</span>
                <span className="font-medium text-blue-400">-{formatCurrency(o?.adSpend || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className={(o?.grossProfit || 0) >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                  = Lucro Bruto
                </span>
                <span className={(o?.grossProfit || 0) >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                  {formatCurrency(o?.grossProfit || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">(-) Custos Fixos</span>
                <span className="font-medium text-orange-400">-{formatCurrency(o?.fixedCosts || 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">(-) Taxas de Plataforma</span>
                <span className="font-medium text-orange-400">-{formatCurrency(o?.percentageCosts || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className={`text-lg font-bold ${(o?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  = Lucro Liquido
                </span>
                <span className={`text-lg font-bold ${(o?.netProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatCurrency(o?.netProfit || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">Total de Transacoes</span>
                <span className="font-medium text-zinc-100">{o?.totalTransactions || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">Vendas Aprovadas</span>
                <span className="font-medium text-emerald-400">{o?.salesCount || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">Reembolsos</span>
                <span className="font-medium text-red-400">{o?.refundCount || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">Pendentes</span>
                <span className="font-medium text-yellow-400">{o?.pendingCount || 0}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">ROAS</span>
                <span className={(o?.roas || 0) >= 2 ? "font-semibold text-emerald-400" : "font-semibold text-yellow-400"}>
                  {(o?.roas || 0).toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">ROI</span>
                <span className={(o?.roi || 0) >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                  {formatPercent(o?.roi || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-zinc-400">CPA (Custo por Aquisicao)</span>
                <span className="font-medium text-purple-400">{formatCurrency(o?.cpa || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Taxa de Conversao</span>
                <span className="font-medium text-cyan-400">{formatPercent(o?.conversionRate || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
