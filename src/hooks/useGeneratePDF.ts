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

            // Temporarily add a class to force light theme for printing
            const originalBg = element.style.backgroundColor;
            element.classList.add('pdf-print-mode');

            // Override text colors and backgrounds recursively for the screenshot
            const htmlNode = document.documentElement;
            htmlNode.style.setProperty('--print-bg', '#ffffff');
            htmlNode.style.setProperty('--print-text', '#000000');
            htmlNode.style.setProperty('--print-border', '#e2e8f0');

            // Wait a tick for styles to apply
            await new Promise(resolve => setTimeout(resolve, 100));

            let imgData;
            try {
                imgData = await toPng(element, {
                    pixelRatio: 2, // Higher scale for better resolution
                    backgroundColor: '#ffffff', // Force white background for the PDF
                    style: {
                        color: 'black',
                        backgroundColor: 'white'
                    },
                    filter: (node) => {
                        // Optional: filter out buttons from the PDF
                        if (node.tagName === 'BUTTON') return false;
                        return true;
                    }
                });
            } finally {
                // Restore original styling
                element.classList.remove('pdf-print-mode');
                htmlNode.style.removeProperty('--print-bg');
                htmlNode.style.removeProperty('--print-text');
                htmlNode.style.removeProperty('--print-border');
            }

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
