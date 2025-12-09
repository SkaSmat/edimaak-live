import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdminExportButtonProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string; transform?: (value: any, row: any) => string }[];
}

export const AdminExportButton = ({ data, filename, columns }: AdminExportButtonProps) => {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Create CSV header
      const header = columns.map(col => col.label).join(";");
      
      // Create CSV rows
      const rows = data.map(row => {
        return columns.map(col => {
          const value = col.key.split('.').reduce((obj, key) => obj?.[key], row);
          const transformed = col.transform ? col.transform(value, row) : value;
          // Escape quotes and wrap in quotes if contains special chars
          const stringValue = String(transformed ?? "");
          if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(";");
      });

      const csv = [header, ...rows].join("\n");
      
      // Create and download file
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Export réussi (${data.length} lignes)`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      disabled={exporting || data.length === 0}
      className="h-9"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </Button>
  );
};
