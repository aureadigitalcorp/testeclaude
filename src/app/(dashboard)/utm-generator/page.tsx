"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Link2, Copy, Check, Trash2, Code } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface UTMLink {
  id: string;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  utmTerm: string | null;
  fullUrl: string;
  clicks: number;
  createdAt: string;
  product: { name: string } | null;
}

export default function UTMGeneratorPage() {
  const { data, mutate } = useRealtime<{ links: UTMLink[] }>("/api/utm", 30000);
  const { data: productsData } = useRealtime<{ products: Product[] }>("/api/products", 60000);
  const [copied, setCopied] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [form, setForm] = useState({
    baseUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    productId: "",
  });

  const previewUrl = (() => {
    if (!form.baseUrl || !form.utmSource || !form.utmMedium || !form.utmCampaign) return "";
    try {
      const url = new URL(form.baseUrl);
      url.searchParams.set("utm_source", form.utmSource);
      url.searchParams.set("utm_medium", form.utmMedium);
      url.searchParams.set("utm_campaign", form.utmCampaign);
      if (form.utmContent) url.searchParams.set("utm_content", form.utmContent);
      if (form.utmTerm) url.searchParams.set("utm_term", form.utmTerm);
      return url.toString();
    } catch {
      return "";
    }
  })();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/utm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ baseUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "", utmTerm: "", productId: "" });
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/utm/${id}`, { method: "DELETE" });
    mutate();
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const trackingScript = `<script>
(function() {
  // LucroFy UTM Tracker
  var params = new URLSearchParams(window.location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var utmData = {};

  utmKeys.forEach(function(key) {
    var value = params.get(key);
    if (value) {
      utmData[key] = value;
      // Store in cookie for 30 days
      document.cookie = key + '=' + encodeURIComponent(value) + ';path=/;max-age=' + (30*24*60*60) + ';SameSite=Lax';
    }
  });

  // If no UTM params in URL, try to read from cookies
  if (Object.keys(utmData).length === 0) {
    utmKeys.forEach(function(key) {
      var match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
      if (match) utmData[key] = decodeURIComponent(match[2]);
    });
  }

  // Inject UTM data into checkout forms/links
  // Look for hidden inputs or data attributes
  document.querySelectorAll('[data-lucrofy-utm]').forEach(function(el) {
    var field = el.getAttribute('data-lucrofy-utm');
    if (utmData['utm_' + field]) {
      el.value = utmData['utm_' + field];
    }
  });

  // Auto-append UTM params to checkout links
  document.querySelectorAll('a[data-lucrofy-checkout]').forEach(function(el) {
    var href = el.getAttribute('href');
    if (href) {
      try {
        var url = new URL(href, window.location.origin);
        Object.keys(utmData).forEach(function(key) {
          url.searchParams.set(key, utmData[key]);
        });
        el.setAttribute('href', url.toString());
      } catch(e) {}
    }
  });

  // Expose UTM data globally
  window.__lucrofy_utm = utmData;
})();
</script>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gerador de UTM</h1>
          <p className="text-sm text-zinc-400">Crie links rastreados para suas campanhas</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowScript(!showScript)}>
          <Code className="mr-2 h-4 w-4" />
          Script de Rastreamento
        </Button>
      </div>

      {showScript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Script de Rastreamento UTM</span>
              <Button variant="secondary" size="sm" onClick={() => handleCopy(trackingScript, "script")}>
                {copied === "script" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied === "script" ? "Copiado!" : "Copiar"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-zinc-400">
              Cole este script na sua pagina de vendas para capturar os parametros UTM automaticamente.
              O script armazena as UTMs em cookies por 30 dias e injeta nos formularios/links de checkout.
            </p>
            <div className="mb-3 text-sm text-zinc-400">
              <p className="font-medium text-zinc-300 mb-1">Como usar:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Adicione <code className="rounded bg-zinc-800 px-1">data-lucrofy-utm=&quot;source&quot;</code> em inputs hidden para capturar UTMs</li>
                <li>Adicione <code className="rounded bg-zinc-800 px-1">data-lucrofy-checkout</code> em links de checkout para auto-append UTMs</li>
                <li>Acesse <code className="rounded bg-zinc-800 px-1">window.__lucrofy_utm</code> para ler as UTMs via JavaScript</li>
              </ul>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-300">
              {trackingScript}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-emerald-500" />
            Criar Link UTM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">URL Base *</label>
                <Input
                  placeholder="https://seusite.com/checkout"
                  required
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">Produto</label>
                <Select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                  <option value="">Selecionar produto (opcional)</option>
                  {productsData?.products?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">UTM Source *</label>
                <Input
                  placeholder="facebook, google, instagram..."
                  required
                  value={form.utmSource}
                  onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">UTM Medium *</label>
                <Input
                  placeholder="cpc, cpm, social, email..."
                  required
                  value={form.utmMedium}
                  onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">UTM Campaign *</label>
                <Input
                  placeholder="nome-da-campanha"
                  required
                  value={form.utmCampaign}
                  onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">UTM Content</label>
                <Input
                  placeholder="variacao-anuncio (opcional)"
                  value={form.utmContent}
                  onChange={(e) => setForm({ ...form, utmContent: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">UTM Term</label>
                <Input
                  placeholder="palavra-chave (opcional)"
                  value={form.utmTerm}
                  onChange={(e) => setForm({ ...form, utmTerm: e.target.value })}
                />
              </div>
            </div>

            {previewUrl && (
              <div className="rounded-lg bg-zinc-800 p-3">
                <p className="mb-1 text-xs font-medium text-zinc-400">Preview:</p>
                <p className="break-all text-sm text-emerald-400">{previewUrl}</p>
              </div>
            )}

            <Button type="submit" disabled={!previewUrl}>
              <Link2 className="mr-2 h-4 w-4" />
              Gerar Link UTM
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links Gerados ({data?.links?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>URL</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.links?.length ? (
                data.links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(link.createdAt)}</TableCell>
                    <TableCell className="text-sm">{link.product?.name || "-"}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{link.utmSource}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{link.utmMedium}</TableCell>
                    <TableCell className="text-sm text-zinc-400">{link.utmCampaign}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-emerald-400">{link.fullUrl}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(link.fullUrl, link.id)}>
                          {copied === link.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-zinc-500">
                    Nenhum link gerado ainda
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
