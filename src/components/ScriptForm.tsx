"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Appeal {
  id: number;
  name: string;
  category: string;
}

export default function ScriptForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    originalVideoUrl: "",
    originalScript: "",
    persona: "",
    appealId: "",
    articleLpUrl: "",
    articleLpText: "",
  });

  useEffect(() => {
    fetch("/api/appeals").then((r) => r.json()).then(setAppeals);
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/scripts/${data.id}`);
    }
    setLoading(false);
  }

  const stepTitles = ["動画・台本入力", "ペルソナ設定", "訴求選択", "記事LP（任意）"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ステップインジケーター */}
      <div className="flex gap-2">
        {stepTitles.map((title, i) => (
          <button
            key={i}
            onClick={() => setStep(i + 1)}
            className={`flex-1 text-center py-2 text-sm rounded-md transition-colors ${
              step === i + 1
                ? "bg-primary text-primary-foreground"
                : step > i + 1
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {step}: {stepTitles[step - 1]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="例: 債務整理_痛み訴求_v1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoUrl">元動画URL（Google Drive等）</Label>
                <Input
                  id="videoUrl"
                  value={form.originalVideoUrl}
                  onChange={(e) => update("originalVideoUrl", e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script">元台本</Label>
                <Textarea
                  id="script"
                  value={form.originalScript}
                  onChange={(e) => update("originalScript", e.target.value)}
                  placeholder="台本のテキストを貼り付けてください"
                  rows={10}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="persona">ペルソナ</Label>
              <Textarea
                id="persona"
                value={form.persona}
                onChange={(e) => update("persona", e.target.value)}
                placeholder="例: 30代男性、借金300万、妻子あり、年収400万、毎月の返済に苦しんでいる"
                rows={6}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label>訴求パターン</Label>
              <Select value={form.appealId} onValueChange={(v) => { if (v) update("appealId", v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="訴求を選択" />
                </SelectTrigger>
                <SelectContent>
                  {appeals.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="lpUrl">記事LP URL（任意）</Label>
                <Input
                  id="lpUrl"
                  value={form.articleLpUrl}
                  onChange={(e) => update("articleLpUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lpText">記事LP テキスト（任意）</Label>
                <Textarea
                  id="lpText"
                  value={form.articleLpText}
                  onChange={(e) => update("articleLpText", e.target.value)}
                  placeholder="LPのテキストを貼り付け"
                  rows={6}
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                戻る
              </Button>
            )}
            <div className="ml-auto">
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!form.title || !form.originalScript)}
                >
                  次へ
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "保存中..." : "保存して詳細へ"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
