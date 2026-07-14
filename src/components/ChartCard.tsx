/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { Download, EyeOff, Eye } from 'lucide-react';

interface ChartCardProps {
  key?: React.Key;
  chartId: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  visible: boolean;
  onHide?: (id: string) => void;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function ChartCard({
  chartId,
  title,
  subtitle,
  icon,
  visible,
  onHide,
  fullWidth = false,
  children
}: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cardRef.current) return;

    try {
      // Find and temporarily hide action buttons during capture
      const actionsEl = cardRef.current.querySelector('.chart-card-actions') as HTMLElement;
      if (actionsEl) {
        actionsEl.style.visibility = 'hidden';
      }

      // Capture the card
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Adjust cloned layout for optimal scaling
          const container = clonedDoc.querySelector('.recharts-responsive-container') as HTMLElement;
          if (container) {
            container.style.width = '600px';
            container.style.height = '350px';
          }
        }
      });

      // Restore action buttons visibility
      if (actionsEl) {
        actionsEl.style.visibility = 'visible';
      }

      // Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const formattedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `ALOK_HR_${formattedTitle}_${dateStr}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export chart PNG', err);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`border border-slate-200 rounded-2xl p-5 bg-white text-left shadow-2xs relative flex flex-col justify-between min-w-0 min-h-0 overflow-hidden ${
        fullWidth ? 'col-span-1 lg:col-span-2' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {icon && <div className="mt-0.5 text-indigo-600 shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-indigo-500 font-semibold font-mono mt-0.5 animate-fade-in truncate">
                Avg tenure: {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 chart-card-actions" data-html2canvas-ignore="true">
          <button
            onClick={handleDownload}
            title="Download Chart as PNG"
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          {onHide && (
            <button
              onClick={() => onHide(chartId)}
              title="Hide Chart"
              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[240px]">
        {children}
      </div>
    </div>
  );
}
