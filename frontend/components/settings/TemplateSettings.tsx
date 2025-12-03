"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import DOMPurify from "dompurify";
import { useToast } from "@/components/ui/toast-context";

interface TemplateSettingsProps {
  disabled?: boolean; // <--- Step A: Define Prop
}

export function TemplateSettings({ disabled }: TemplateSettingsProps) { // <--- Step B: Destructure
  const { toast } = useToast();
  const [invoiceHtml, setInvoiceHtml] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing template
  useEffect(() => {
    api.get('/settings/template/INVOICE').then(res => {
        if (res.data.html) setInvoiceHtml(res.data.html);
        else setInvoiceHtml(DEFAULT_TEMPLATE); 
    });
  }, []);

  const handleSave = async () => {
    if (disabled) return; // <--- Logic Guard
    setLoading(true);
    
    // Client-side sanitization (Backend does it too)
    const clean = DOMPurify.sanitize(invoiceHtml, {
        ADD_TAGS: ['style'],
        ADD_ATTR: ['style', 'class']
    });

    try {
        await api.post('/settings/template', { html: clean, type: 'INVOICE' });
        toast("Template Saved & Secured!", "success");
    } catch (e) {
        toast("Failed to save template", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
        {/* EDITOR COLUMN */}
        <Card className="shadow-horizon border-none bg-card flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                    <span>HTML Editor</span>
                    {/* Step C: UI Guard */}
                    {!disabled && (
                        <Button size="sm" onClick={handleSave} disabled={loading} className="bg-primary text-white">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Template
                        </Button>
                    )}
                    {disabled && <span className="text-xs text-amber-500 font-medium">View Only</span>}
                </CardTitle>
                <CardDescription>Use <code>{`{{variable}}`}</code> to inject data.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden border-t border-border">
                <CodeMirror
                    value={invoiceHtml}
                    height="100%"
                    extensions={[html()]}
                    onChange={(val) => setInvoiceHtml(val)}
                    theme="dark"
                    className="h-full text-sm"
                    readOnly={disabled} // <--- Step C: Lock Editor
                    editable={!disabled}
                />
            </CardContent>
        </Card>

        {/* PREVIEW COLUMN */}
        <Card className="shadow-horizon border-none bg-card flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>How it might look (Data mocked)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-white dark:bg-slate-900 overflow-auto border-t border-border">
                <div className="p-4">
                    <div 
                        className="invoice-preview origin-top scale-75 w-[210mm] h-[297mm] bg-white text-black shadow-lg mx-auto p-10"
                        dangerouslySetInnerHTML={{ __html: invoiceHtml }}
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

const DEFAULT_TEMPLATE = `<html><body><h1>Invoice</h1></body></html>`;