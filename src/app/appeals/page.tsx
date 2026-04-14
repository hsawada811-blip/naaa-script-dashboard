"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Appeal {
  id: number;
  name: string;
  category: string;
  description: string;
  exampleScript: string | null;
  performanceScore: number | null;
}

const categoryLabels: Record<string, string> = {
  pain: "痛み",
  benefit: "ベネフィット",
  fear: "恐怖",
  social_proof: "社会的証明",
  authority: "権威性",
  scarcity: "希少性",
  curiosity: "好奇心",
  other: "その他",
};

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "pain",
    description: "",
    exampleScript: "",
  });

  const loadAppeals = useCallback(async () => {
    const res = await fetch("/api/appeals");
    if (res.ok) setAppeals(await res.json());
  }, []);

  useEffect(() => { loadAppeals(); }, [loadAppeals]);

  async function handleCreate() {
    await fetch("/api/appeals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", category: "pain", description: "", exampleScript: "" });
    setDialogOpen(false);
    loadAppeals();
  }

  async function handleDelete(id: number) {
    if (!confirm("削除しますか?")) return;
    await fetch(`/api/appeals?id=${id}`, { method: "DELETE" });
    loadAppeals();
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">訴求パターン管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>+ 新規訴求</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規訴求パターン</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>名前</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例: 痛み×緊急性"
                />
              </div>
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Select value={form.category} onValueChange={(v) => { if (v) setForm({ ...form, category: v }); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="この訴求パターンの特徴"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>例文（任意）</Label>
                <Textarea
                  value={form.exampleScript}
                  onChange={(e) => setForm({ ...form, exampleScript: e.target.value })}
                  placeholder="この訴求の台本例"
                  rows={4}
                />
              </div>
              <Button onClick={handleCreate} disabled={!form.name} className="w-full">
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appeals.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{a.name}</CardTitle>
                <Badge variant="secondary">{categoryLabels[a.category] ?? a.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{a.description}</p>
              {a.performanceScore && (
                <p className="text-sm">スコア: <span className="font-bold">{a.performanceScore}</span></p>
              )}
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
