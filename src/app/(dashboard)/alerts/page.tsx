"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
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
import { Bell, Plus, Trash2, X } from "lucide-react";

interface Alert {
  id: string;
  name: string;
  metric: string;
  condition: string;
  value: number;
  active: boolean;
  lastTriggered: string | null;
}

const metricLabels: Record<string, string> = {
  roi: "ROI (%)",
  roas: "ROAS (x)",
  cpa: "CPA (R$)",
  profit: "Lucro Liquido (R$)",
  sales_count: "Qtd. Vendas",
  ad_spend: "Gasto em Ads (R$)",
  revenue: "Faturamento (R$)",
};

const conditionLabels: Record<string, string> = {
  above: "Acima de",
  below: "Abaixo de",
  equals: "Igual a",
};

export default function AlertsPage() {
  const { data, mutate } = useRealtime<{ alerts: Alert[] }>("/api/alerts", 30000);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    metric: "roi",
    condition: "below",
    value: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", metric: "roi", condition: "below", value: "" });
    setShowForm(false);
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/alerts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Alertas</h1>
          <p className="text-sm text-zinc-400">Configure notificacoes automaticas para suas metricas</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Alerta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Novo Alerta</span>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome do Alerta *</label>
                  <Input
                    placeholder="Ex: ROI negativo"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Metrica *</label>
                  <Select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
                    {Object.entries(metricLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Condicao *</label>
                  <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                    {Object.entries(conditionLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Valor *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0 (para ROI abaixo de 0%)"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800 p-3 text-sm text-zinc-400">
                Alerta: Notificar quando <strong className="text-zinc-200">{metricLabels[form.metric]}</strong>{" "}
                estiver <strong className="text-zinc-200">{conditionLabels[form.condition]}</strong>{" "}
                <strong className="text-zinc-200">{form.value || "..."}</strong>
              </div>
              <Button type="submit">
                <Bell className="mr-2 h-4 w-4" />
                Criar Alerta
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alertas Configurados ({data?.alerts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Metrica</TableHead>
                <TableHead>Condicao</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.alerts?.length ? (
                data.alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.name}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{metricLabels[alert.metric] || alert.metric}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{conditionLabels[alert.condition] || alert.condition}</TableCell>
                    <TableCell className="font-medium text-zinc-100">{alert.value}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(alert.id, alert.active)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          alert.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {alert.active ? "Ativo" : "Inativo"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(alert.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                    Nenhum alerta configurado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
