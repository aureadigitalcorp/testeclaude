"use client";

import { useState } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

interface Ad {
  id: string;
  adId: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
}

interface AdSet {
  id: string;
  adSetId: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  ads: Ad[];
}

interface Campaign {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  metaAccount: { accountName: string; accountId: string };
  adSets: AdSet[];
}

interface CampaignsData {
  campaigns: Campaign[];
}

export default function CampaignsPage() {
  const { data, isLoading, mutate } = useRealtime<CampaignsData>("/api/meta/campaigns", 30000);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedAdSets, setExpandedAdSets] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/meta/sync", { method: "POST" });
      mutate();
    } finally {
      setSyncing(false);
    }
  }

  const toggleCampaign = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleAdSet = (id: string) => setExpandedAdSets((p) => ({ ...p, [id]: !p[id] }));

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return <Badge variant="success">Ativo</Badge>;
    if (status === "PAUSED") return <Badge variant="warning">Pausado</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Campanhas</h1>
          <p className="text-sm text-zinc-400">Dados sincronizados do Meta Ads</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar Meta"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanhas ({data?.campaigns?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : !data?.campaigns?.length ? (
            <div className="py-12 text-center text-zinc-500">
              <p>Nenhuma campanha encontrada.</p>
              <p className="mt-1 text-sm">Adicione uma conta Meta em Configuracoes e sincronize.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gasto</TableHead>
                  <TableHead>Impressoes</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>CPM</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.campaigns.map((campaign) => (
                  <>
                    <TableRow key={campaign.id} className="cursor-pointer" onClick={() => toggleCampaign(campaign.id)}>
                      <TableCell>
                        {expanded[campaign.id] ? (
                          <ChevronDown className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{campaign.metaAccount.accountName}</TableCell>
                      <TableCell>{statusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-blue-400">{formatCurrency(campaign.spend)}</TableCell>
                      <TableCell>{formatNumber(campaign.impressions)}</TableCell>
                      <TableCell>{formatNumber(campaign.clicks)}</TableCell>
                      <TableCell>{formatCurrency(campaign.cpm)}</TableCell>
                      <TableCell>{formatCurrency(campaign.cpc)}</TableCell>
                      <TableCell>{campaign.ctr.toFixed(2)}%</TableCell>
                    </TableRow>

                    {expanded[campaign.id] && campaign.adSets.map((adSet) => (
                      <>
                        <TableRow key={adSet.id} className="cursor-pointer bg-zinc-900/50" onClick={() => toggleAdSet(adSet.id)}>
                          <TableCell className="pl-6">
                            {expandedAdSets[adSet.id] ? (
                              <ChevronDown className="h-3 w-3 text-zinc-500" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-zinc-500" />
                            )}
                          </TableCell>
                          <TableCell className="pl-6 text-sm text-zinc-300">{adSet.name}</TableCell>
                          <TableCell className="text-xs text-zinc-500">Conjunto</TableCell>
                          <TableCell>{statusBadge(adSet.status)}</TableCell>
                          <TableCell className="text-blue-400 text-sm">{formatCurrency(adSet.spend)}</TableCell>
                          <TableCell className="text-sm">{formatNumber(adSet.impressions)}</TableCell>
                          <TableCell className="text-sm">{formatNumber(adSet.clicks)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(adSet.cpm)}</TableCell>
                          <TableCell className="text-sm">{formatCurrency(adSet.cpc)}</TableCell>
                          <TableCell className="text-sm">{adSet.ctr.toFixed(2)}%</TableCell>
                        </TableRow>

                        {expandedAdSets[adSet.id] && adSet.ads.map((ad) => (
                          <TableRow key={ad.id} className="bg-zinc-900/30">
                            <TableCell></TableCell>
                            <TableCell className="pl-12 text-sm text-zinc-400">{ad.name}</TableCell>
                            <TableCell className="text-xs text-zinc-500">Anuncio</TableCell>
                            <TableCell>{statusBadge(ad.status)}</TableCell>
                            <TableCell className="text-blue-400 text-sm">{formatCurrency(ad.spend)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(ad.impressions)}</TableCell>
                            <TableCell className="text-sm">{formatNumber(ad.clicks)}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(ad.cpm)}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(ad.cpc)}</TableCell>
                            <TableCell className="text-sm">{ad.ctr.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
