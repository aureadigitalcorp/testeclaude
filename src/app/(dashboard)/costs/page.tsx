"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatCurrency } from "@/lib/utils";
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
import { Plus, Trash2, X, FolderPlus } from "lucide-react";

interface CostCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Cost {
  id: string;
  name: string;
  amount: number;
  type: string;
  recurrence: string | null;
  isPercentage: boolean;
  percentageValue: number | null;
  active: boolean;
  category: CostCategory | null;
}

interface CostsData {
  costs: Cost[];
  categories: CostCategory[];
}

export default function CostsPage() {
  const { data, mutate } = useRealtime<CostsData>("/api/costs", 30000);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [form, setForm] = useState({
    name: "",
    amount: "",
    type: "fixed",
    recurrence: "monthly",
    categoryId: "",
    isPercentage: false,
    percentageValue: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", amount: "", type: "fixed", recurrence: "monthly", categoryId: "", isPercentage: false, percentageValue: "" });
    setShowForm(false);
    mutate();
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/costs/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    setCategoryForm({ name: "", description: "" });
    setShowCategoryForm(false);
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/costs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    mutate();
  }

  const totalFixed = data?.costs
    ?.filter((c) => c.active && !c.isPercentage)
    .reduce((sum, c) => sum + c.amount, 0) || 0;

  const percentageCosts = data?.costs?.filter((c) => c.active && c.isPercentage) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gestao de Custos</h1>
          <p className="text-sm text-zinc-400">Gerencie custos fixos, variaveis e taxas de plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryForm(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Categoria
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Custo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-zinc-400">Custos Fixos (mensal)</p>
            <p className="mt-2 text-2xl font-bold text-orange-400">{formatCurrency(totalFixed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-zinc-400">Taxas de Plataforma</p>
            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {percentageCosts.length} taxa{percentageCosts.length !== 1 ? "s" : ""} ativa{percentageCosts.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-zinc-400">Total de Custos</p>
            <p className="mt-2 text-2xl font-bold text-zinc-100">{data?.costs?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nova Categoria</span>
              <button onClick={() => setShowCategoryForm(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCategory} className="flex gap-3">
              <Input
                placeholder="Nome da categoria"
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <Input
                placeholder="Descricao (opcional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <Button type="submit">Criar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Novo Custo</span>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome *</label>
                  <Input
                    placeholder="Ex: Taxa BlackCatPay"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Categoria</label>
                  <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Sem categoria</option>
                    {data?.categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Tipo *</label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="fixed">Fixo</option>
                    <option value="variable">Variavel</option>
                    <option value="platform_fee">Taxa de Plataforma</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Recorrencia</label>
                  <Select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="one_time">Unico</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.isPercentage}
                      onChange={(e) => setForm({ ...form, isPercentage: e.target.checked })}
                      className="rounded border-zinc-700"
                    />
                    Porcentagem por venda
                  </label>
                  {form.isPercentage ? (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 4.99 (%)"
                      value={form.percentageValue}
                      onChange={(e) => setForm({ ...form, percentageValue: e.target.value })}
                    />
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Valor em R$"
                      required
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Custo
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Recorrencia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.costs?.length ? (
                data.costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{cost.category?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={cost.type === "platform_fee" ? "warning" : "secondary"}>
                        {cost.type === "fixed" ? "Fixo" : cost.type === "variable" ? "Variavel" : "Taxa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-orange-400">
                      {cost.isPercentage ? `${cost.percentageValue}%` : formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {cost.recurrence === "monthly" ? "Mensal" : cost.recurrence === "weekly" ? "Semanal" : "Unico"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(cost.id, cost.active)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          cost.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {cost.active ? "Ativo" : "Inativo"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cost.id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                    Nenhum custo cadastrado
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
