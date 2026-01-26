"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-[#1a2744] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            SAKURA-II Order Inquiry
          </h1>
          <p className="text-[#00a0ab] mt-2 text-sm md:text-base font-medium">
            Ebttikar Technology × EdgeCortix Partnership
          </p>
        </div>
      </header>

      {/* Thank You Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#00a0ab]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-[#00a0ab]" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Thank You for Your Inquiry!
          </h2>

          <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            We have received your SAKURA-II order inquiry. Our team at Ebttikar
            Technology will review your request and get back to you within{" "}
            <strong>1-2 business days</strong>.
          </p>

          <div className="bg-[#f5f5f5] rounded-lg p-4 mb-8 max-w-sm mx-auto">
            <p className="text-sm text-gray-500 mb-1">Need immediate assistance?</p>
            <a
              href="mailto:edgecortix@ebttikar.com"
              className="text-[#00a0ab] font-medium hover:underline text-sm"
            >
              edgecortix@ebttikar.com
            </a>
          </div>

          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-[#00a0ab] hover:bg-[#008a94] text-white px-8"
          >
            Submit Another Inquiry
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Ebttikar Technology. All rights reserved.
        </p>
      </main>
    </div>
  );
}
