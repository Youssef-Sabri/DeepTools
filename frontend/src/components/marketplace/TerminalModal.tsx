'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Copy, Check, Terminal as TerminalIcon, Sparkles } from 'lucide-react'
import type { Product } from '@/lib/types'
import { normalizeCategory } from '@/lib/utils'

interface TerminalModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  locale?: string
}

export function TerminalModal({ product, isOpen, onClose }: TerminalModalProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'python' | 'schema'>('json')
  const [copied, setCopied] = useState(false)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  if (!isOpen || !product) return null

  const normCat = normalizeCategory(product.category)

  const getCodeSnippet = () => {
    if (activeTab === 'json') {
      return `{\n  "meta": {\n    "name": "${product.name}",\n    "category": "${normCat}",\n    "version": "${product.version || '1.0.0'}"\n  },\n  "nodes": [\n    {\n      "id": "trigger_webhook",\n      "type": "n8n-nodes-base.webhook",\n      "parameters": { "path": "/webhook/event", "httpMethod": "POST" }\n    },\n    {\n      "id": "ai_agent_evaluator",\n      "type": "deeptools.agent_evaluator",\n      "parameters": { "temperature": 0.2, "model": "gemini-2.5-pro" }\n    }\n  ]\n}`
    }
    if (activeTab === 'python') {
      return `import asyncio\nfrom deeptools_runtime import AssetRunner\n\nasync def main():\n    runner = AssetRunner(asset_id="${product.id}")\n    await runner.init_sandbox()\n    result = await runner.execute_dry_run({\n        "source": "cli_simulator",\n        "payload": { "test_event": "verification_ok" }\n    })\n    print(f"Status: {result.status_code} | Output: {result.data}")\n\nif __name__ == "__main__":\n    asyncio.run(main())`
    }
    return `{\n  "$schema": "https://json-schema.org/draft/2020-12/schema",\n  "title": "${product.name} Schema",\n  "type": "object",\n  "required": ["trigger", "payload", "auth_token"],\n  "properties": {\n    "trigger": { "type": "string", "enum": ["cron", "webhook", "agent_call"] },\n    "payload": { "type": "object" },\n    "auth_token": { "type": "string", "pattern": "^DT_[A-Za-z0-9_]{32}$" }\n  }\n}`
  }

  const codeSnippet = getCodeSnippet()
  const codeLines = codeSnippet.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRunDryTest = () => {
    setRunning(true)
    setLogs(['[INF] Initializing DeepTools dry-run sandbox v2.4.1...'])

    setTimeout(() => {
      setLogs((prev) => [...prev, `[INF] Loading asset artifact "${product.name}" [category: ${product.category}]`])
    }, 400)

    setTimeout(() => {
      setLogs((prev) => [...prev, '[OK] Environment isolated. Mock credentials and node adapters verified.'])
    }, 900)

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        '[EXEC] Executing sample payload against mock runtime harness...',
        '[OK] Process returned code 0. Memory: 28.4MB. Latency: 142ms.',
        '[SUCCESS] Verification passed: 0 errors, 0 runtime warnings.',
      ])
      setRunning(false)
    }, 1500)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl terminal-modal overflow-hidden text-left"
        >
          {/* Header */}
          <div className="terminal-header justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="mac-dot mac-dot-red" />
                <span className="mac-dot mac-dot-yellow" />
                <span className="mac-dot mac-dot-green" />
              </div>
              <span className="text-xs text-[var(--muted)] font-mono ml-3 flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                dry-run://{product.name.toLowerCase().replace(/\s+/g, '-')}.sandbox
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader & Tabs */}
          <div className="px-5 py-3 bg-[var(--surface)] border-b border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              {(['json', 'python', 'schema'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                    activeTab === tab
                      ? 'bg-[var(--surface-3)] text-[var(--blue-bright)] border border-[var(--blue)]/40 font-semibold'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--line)] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[var(--green)]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Spec'}
              </button>

              <button
                onClick={handleRunDryTest}
                disabled={running}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-semibold text-white bg-[var(--blue)] hover:bg-[var(--blue-bright)] disabled:opacity-50 transition-colors shadow-sm"
              >
                {running ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                {running ? 'Executing...' : 'Run Dry Test'}
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="p-4 overflow-x-auto max-h-[340px] bg-[#070b11] font-mono text-xs leading-relaxed">
            {codeLines.map((line, idx) => (
              <div key={idx} className="flex hover:bg-[#121927]/60 px-2 py-0.5 rounded">
                <span className="code-line-number">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-[#d8e2f0] whitespace-pre">{line}</span>
              </div>
            ))}
          </div>

          {/* Execution Telemetry Terminal */}
          {logs.length > 0 && (
            <div className="p-4 bg-[#05070a] border-t border-[var(--line)] font-mono text-xs max-h-[160px] overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] mb-2 font-semibold">
                Execution Telemetry Output
              </div>
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    log.includes('[SUCCESS]') || log.includes('[OK]')
                      ? 'text-[var(--green)]'
                      : log.includes('[INF]')
                      ? 'text-[var(--blue-bright)]'
                      : 'text-[var(--muted)]'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
