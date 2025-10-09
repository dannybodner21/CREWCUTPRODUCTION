'use client';

import React from 'react';
import { Button, Spin } from 'antd';
import { FileText } from 'lucide-react';
import type { FeeBreakdown } from '@/lib/fee-calculator';

interface JurisdictionContactInfo {
  contact_department?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  contact_address?: string;
  contact_hours?: string;
}

interface PDFDownloadButtonProps {
  breakdown: FeeBreakdown;
  projectName?: string;
  projectAddress?: string;
  jurisdictionName: string;
  developerName?: string;
  contactEmail?: string;
  projectDescription?: string;
  startDate?: string;
  completionDate?: string;
  jurisdictionContactInfo?: JurisdictionContactInfo;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  breakdown,
  projectName,
  projectAddress,
  jurisdictionName,
  developerName,
  contactEmail,
  projectDescription,
  startDate,
  completionDate,
  jurisdictionContactInfo,
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamically import react-pdf/renderer only when button is clicked
      const { PDFDownloadLink, pdf } = await import('@react-pdf/renderer');
      const { FeasibilityReportPDF } = await import('./FeasibilityReportPDF');

      // Create the PDF document
      const doc = React.createElement(FeasibilityReportPDF, {
        breakdown,
        projectName,
        projectAddress,
        developerName,
        contactEmail,
        projectDescription,
        startDate,
        completionDate,
        jurisdictionContactInfo,
      });

      // Generate the PDF blob
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `feasibility-report-${jurisdictionName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
      setIsGenerating(false);
    }
  };

  if (!isClient) {
    return (
      <Button
        size="large"
        disabled
        style={{
          borderRadius: '8px',
          height: '48px',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Loading...
      </Button>
    );
  }

  if (error) {
    return (
      <Button
        size="large"
        danger
        onClick={() => setError(null)}
        style={{
          borderRadius: '8px',
          height: '48px',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Error: {error} (Click to retry)
      </Button>
    );
  }

  if (isGenerating) {
    return (
      <Button
        size="large"
        disabled
        icon={<Spin size="small" />}
        style={{
          borderRadius: '8px',
          height: '48px',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Generating PDF...
      </Button>
    );
  }

  return (
    <Button
      type="primary"
      size="large"
      icon={<FileText size={20} />}
      onClick={handleDownload}
      style={{
        borderRadius: '8px',
        height: '48px',
        fontSize: '16px',
        fontWeight: '500',
        backgroundColor: '#1890ff'
      }}
    >
      Download Feasibility Report PDF
    </Button>
  );
};
