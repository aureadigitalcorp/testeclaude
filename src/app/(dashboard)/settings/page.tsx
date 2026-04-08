"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, X, Webhook, ShoppingBag, Globe, Copy, Check } from "lucide-react";

interface MetaAccount {
  id: string;
  accountId: string;
  accountName: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  _count: { campaigns: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  active: boolean;
}

export default function SettingsPage() {
  const { data: accountsData, mutate: mutateAccounts } = useRealtime<{ accounts: MetaAccount[] }>("/api/meta/accounts", 30000);
  const { data: productsData, mutate: mutateProducts } = useRealtime<{ products: Product[] }>("/api/products", 30000);

  const [showMetaForm, setShowMetaForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [metaForm, setMetaForm] = useState({
    accountId: "",
    accountName: "",
    accessToken: "",
    appId: "",
    appSecret: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/blackcatpay`
    : "/api/webhooks/blackcatpay";

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddMeta(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/meta/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaForm),
    });
    setMetaForm({ accountId: "", accountName: "", accessToken: "", appId: "", appSecret: "" });
    setShowMetaForm(false);
    mutateAccounts();
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productForm),
    });
    setProductForm({ name: "", price: "", description: "" });
    setShowProductForm(false);
    mutateProducts();
  }

  async function handleDeleteProduct(id: string) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    mutateProducts();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Configuracoes</h1>
        <p className="text-sm text-zinc-400">Gerencie integracoes, produtos e webhook</p>
      </div>

      <Tabs defaultValue="webhook">
        <TabsList>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="meta">Meta Ads</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-emerald-500" />
                Webhook BlackCatPay
              </CardTitle>
              <CardDescription>
                Configure este URL como webhook na sua conta BlackCatPay para receber eventos de vendas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">URL do Webhook</label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={handleCopyWebhook}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-800 p-4 text-sm text-zinc-400 space-y-2">
                <p className="font-medium text-zinc-300">Como configurar:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Acesse o painel da BlackCatPay</li>
                  <li>Va em Configuracoes &gt; Webhooks</li>
                  <li>Cole a URL acima no campo de webhook</li>
                  <li>Selecione os eventos: pagamento aprovado, reembolso, chargeback</li>
                  <li>Salve as configuracoes</li>
                </ol>
              </div>

              <div className="rounded-lg bg-zinc-800 p-4 text-sm text-zinc-400 space-y-2">
                <p className="font-medium text-zinc-300">Eventos suportados:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Pagamento Aprovado</Badge>
                  <Badge variant="warning">Pagamento Pendente</Badge>
                  <Badge variant="danger">Reembolso</Badge>
                  <Badge variant="danger">Chargeback</Badge>
                  <Badge variant="secondary">Cancelamento</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Contas Meta Ads
                </div>
                <Button size="sm" onClick={() => setShowMetaForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Conta
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showMetaForm && (
                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-zinc-100">Nova Conta Meta</h4>
                    <button onClick={() => setShowMetaForm(false)} className="text-zinc-400 hover:text-zinc-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddMeta} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">ID da Conta *</label>
                        <Input
                          placeholder="Ex: 123456789"
                          required
                          value={metaForm.accountId}
                          onChange={(e) => setMetaForm({ ...metaForm, accountId: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">Nome da Conta *</label>
                        <Input
                          placeholder="Ex: Minha conta principal"
                          required
                          value={metaForm.accountName}
                          onChange={(e) => setMetaForm({ ...metaForm, accountName: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm text-zinc-400">Access Token *</label>
                        <Input
                          type="password"
                          placeholder="Token de acesso do Meta"
                          required
                          value={metaForm.accessToken}
                          onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">App ID (opcional)</label>
                        <Input
                          placeholder="ID do aplicativo Meta"
                          value={metaForm.appId}
                          onChange={(e) => setMetaForm({ ...metaForm, appId: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">App Secret (opcional)</label>
                        <Input
                          type="password"
                          placeholder="Secret do aplicativo Meta"
                          value={metaForm.appSecret}
                          onChange={(e) => setMetaForm({ ...metaForm, appSecret: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button type="submit">Adicionar Conta</Button>
                  </form>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Account ID</TableHead>
                    <TableHead>Campanhas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ultima Sinc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountsData?.accounts?.length ? (
                    accountsData.accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell className="font-mono text-sm text-zinc-400">{account.accountId}</TableCell>
                        <TableCell>{account._count.campaigns}</TableCell>
                        <TableCell>
                          <Badge variant={account.status === "active" ? "success" : "warning"}>
                            {account.status === "active" ? "Ativo" : account.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-400">
                          {account.lastSyncAt ? formatDate(account.lastSyncAt) : "Nunca"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                        Nenhuma conta Meta conectada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-500" />
                  Produtos
                </div>
                <Button size="sm" onClick={() => setShowProductForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showProductForm && (
                <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium text-zinc-100">Novo Produto</h4>
                    <button onClick={() => setShowProductForm(false)} className="text-zinc-400 hover:text-zinc-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddProduct} className="flex gap-3">
                    <Input
                      placeholder="Nome do produto"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Preco (R$)"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                    <Input
                      placeholder="Descricao (opcional)"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                    <Button type="submit">Criar</Button>
                  </form>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData?.products?.length ? (
                    productsData.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-emerald-400">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-400">{product.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={product.active ? "success" : "secondary"}>
                            {product.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                        Nenhum produto cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
