/**
 * @file: FamilySettingsPage.tsx
 * @description: AI Family 模型设置页面
 */
import React, { useState } from "react";
import { Sliders, Key, Cpu, Save } from "lucide-react";
import { FAMILY_PERSONAS } from "../data";
import { storage, StorageKeys } from "@yyc3/shell";

export default function FamilySettingsPage() {
  const s = storage.aiFamily;
  const [apiKey, setApiKey] = useState(s.get(StorageKeys.AI_API_KEY, "")!);
  const [model, setModel] = useState(s.get(StorageKeys.AI_MODEL, "")!);

  const handleSave = () => {
    s.set(StorageKeys.AI_API_KEY, apiKey);
    s.set(StorageKeys.AI_MODEL, model);
  };

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="w-5 h-5 text-[#00FF88]" />
        <h1 className="text-[#e0f0ff] text-lg font-medium">Family 设置</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-[rgba(0,255,136,0.5)] text-sm mb-2">
            <Key className="w-4 h-4" /> API Key
          </label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[rgba(0,40,80,0.4)] border border-[rgba(0,255,136,0.15)] text-[#e0f0ff] focus:outline-none focus:border-[#00FF88]"
            style={{ fontSize: "0.8rem" }} placeholder="sk-..." />
        </div>

        <div>
          <label className="flex items-center gap-2 text-[rgba(0,255,136,0.5)] text-sm mb-2">
            <Cpu className="w-4 h-4" /> 默认模型
          </label>
          <input value={model} onChange={e => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[rgba(0,40,80,0.4)] border border-[rgba(0,255,136,0.15)] text-[#e0f0ff] focus:outline-none focus:border-[#00FF88]"
            style={{ fontSize: "0.8rem" }} placeholder="gpt-4o" />
        </div>

        <div>
          <h3 className="text-[rgba(0,255,136,0.5)] text-sm mb-2">家人模型绑定</h3>
          <div className="space-y-1">
            {FAMILY_PERSONAS.slice(0, 4).map(p => (
              <div key={p.id} className="flex justify-between px-3 py-2 rounded-lg"
                style={{ background: "rgba(0,40,80,0.15)", border: "1px solid rgba(0,255,136,0.06)" }}>
                <span className="text-[rgba(0,255,136,0.4)] text-sm">{p.shortName}</span>
                <span className="text-[#e0f0ff] text-sm">{p.modelName ?? "默认"}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", color: "#00FF88" }}>
          <Save className="w-4 h-4" /> 保存配置
        </button>
      </div>
    </div>
  );
}
