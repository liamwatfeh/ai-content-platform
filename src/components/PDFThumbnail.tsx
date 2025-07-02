"use client";

import { useState, useEffect } from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface PDFThumbnailProps {
  fileUrl: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function PDFThumbnail({
  fileUrl,
  className = "",
  width = 120,
  height = 160,
}: PDFThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const generateThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // Dynamically import PDF.js with proper syntax for Next.js 15
        const pdfjs = await import("pdfjs-dist");

        // Use reliable CDN worker source - this is the key fix
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        console.log("PDF.js version:", pdfjs.version);
        console.log("Worker source:", pdfjs.GlobalWorkerOptions.workerSrc);
        console.log("Loading PDF from:", fileUrl);

        // Load the PDF document with additional options
        const loadingTask = pdfjs.getDocument({
          url: fileUrl,
          verbosity: 0, // Suppress console warnings
        });

        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully, pages:", pdf.numPages);

        if (!mounted) return;

        // Get the first page
        const page = await pdf.getPage(1);
        console.log("Page 1 loaded successfully");

        if (!mounted) return;

        // Create canvas dynamically instead of using ref
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          console.error("Canvas context not available");
          throw new Error("Canvas context not available");
        }

        console.log("Canvas created successfully");

        // Calculate scale to fit the desired dimensions
        const viewport = page.getViewport({ scale: 1 });
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        const scale = Math.min(scaleX, scaleY);

        console.log(
          "Original dimensions:",
          viewport.width,
          "x",
          viewport.height
        );
        console.log("Target dimensions:", width, "x", height);
        console.log("Scale factor:", scale);

        // Set canvas dimensions
        const scaledViewport = page.getViewport({ scale });
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        console.log("Canvas dimensions set:", canvas.width, "x", canvas.height);

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        console.log("Starting page render...");
        await page.render(renderContext).promise;
        console.log("Page rendered successfully");

        if (!mounted) return;

        // Convert canvas to blob URL
        canvas.toBlob((blob) => {
          if (blob && mounted) {
            const url = URL.createObjectURL(blob);
            setThumbnailUrl(url);
            setLoading(false);
            console.log("Thumbnail generated successfully");
          } else {
            console.error("Failed to create blob from canvas");
            if (mounted) {
              setError(true);
              setLoading(false);
            }
          }
        }, "image/png");
      } catch (err) {
        console.error("Error generating PDF thumbnail:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      generateThumbnail();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      // Clean up blob URL when component unmounts
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [fileUrl, width, height]);

  // Clean up blob URL when it changes
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  if (loading) {
    return (
      <div
        className={`bg-gray-100 rounded-md border border-gray-200 flex flex-col items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
        <div className="text-xs text-gray-500 text-center px-2">
          Loading PDF...
        </div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div
        className={`bg-gradient-to-br from-red-50 to-red-100 rounded-md border border-red-200 flex flex-col items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <DocumentTextIcon className="w-8 h-8 text-red-400 mb-1" />
        <div className="text-xs text-red-600 font-medium text-center px-2">
          PDF Error
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width, height }}>
      <img
        src={thumbnailUrl}
        alt="PDF thumbnail"
        className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
        style={{ width, height }}
      />
    </div>
  );
}
