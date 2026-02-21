import { useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface GeneratePDFOptions {
    elementId: string;
    filename?: string;
}

export function useGeneratePDF() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePDF = async ({ elementId, filename = 'report.pdf' }: GeneratePDFOptions) => {
        setIsGenerating(true);
        setError(null);

        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Element with id "${elementId}" not found`);
            }

            const imgData = await toPng(element, {
                pixelRatio: 2, // Higher scale for better resolution
                backgroundColor: '#18181b', // Match the zinc-900 background for a seamless look if dark mode
            });

            // Calculate dimensions
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);

        } catch (err: any) {
            console.error('Error generating PDF:', err);
            setError(err.message || 'Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return { generatePDF, isGenerating, error };
}
