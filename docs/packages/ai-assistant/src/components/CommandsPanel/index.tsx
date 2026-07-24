"use client";

/**
 * @file components/CommandsPanel/index.tsx
 * @description 命令面板容器组件（接入 i18n）
 * @author YanYuCloudCube Team
 * @version v1.1.0
 */

import { SystemCommand, CMD_CATEGORIES } from "../../constants/commands";
import { CommandCard } from "./CommandCard";
import { useI18n } from "../../hooks/useI18n";

export interface CommandsPanelProps {
  commands: SystemCommand[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onExecute: (command: SystemCommand) => void;
}

export function CommandsPanel({ commands, filter, onFilterChange, onExecute }: CommandsPanelProps) {
  const { t } = useI18n();
  const filteredCommands = filter === "all" ? commands : commands.filter((c) => c.category === filter);

  return (
    <div className="min-h-0">
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {CMD_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onFilterChange(cat.key)}
            className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
              filter === cat.key
                ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]"
                : "text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] border border-transparent"
            }`}
          >
            {t(cat.i18nKey)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filteredCommands.map((cmd) => (
          <CommandCard key={cmd.id} command={cmd} onExecute={onExecute} />
        ))}
      </div>
    </div>
  );
}
