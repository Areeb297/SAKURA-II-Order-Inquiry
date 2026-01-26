"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

const products = [
  { name: "SAKURA-II M.2 16GB Module", price: "$399 USD" },
  { name: "SAKURA-II Single Eval Card", price: "$499 USD" },
  { name: "SAKURA-II Dual Card", price: "$799 USD" },
  { name: "M.2 Development System", price: "$2,499 USD" },
  { name: "Single PCIe Dev System", price: "$2,499 USD" },
  { name: "Dual PCIe Dev System", price: "$2,799 USD" },
];

const timeframeOptions = [
  "Immediate (0–1 month)",
  "1–3 months",
  "3–6 months",
  "Budgeting / Not sure",
];

const useCaseOptions = [
  "Defense & Security",
  "Smart City / Video Analytics",
  "Industrial / IoT",
  "Robotics",
  "Healthcare",
  "Research / University",
  "Autonomous Vehicles",
  "Other",
];

interface FormErrors {
  [key: string]: string;
}

function OrderFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [city, setCity] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [estimatedQuantity, setEstimatedQuantity] = useState("");
  const [purchaseTimeframe, setPurchaseTimeframe] = useState("");
  const [useCase, setUseCase] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  // UTM params
  const [utmParams, setUtmParams] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  });

  useEffect(() => {
    setUtmParams({
      utm_source: searchParams.get("utm_source") || "",
      utm_medium: searchParams.get("utm_medium") || "",
      utm_campaign: searchParams.get("utm_campaign") || "",
      utm_term: searchParams.get("utm_term") || "",
      utm_content: searchParams.get("utm_content") || "",
    });
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = (field: string, value: string | string[] | boolean) => {
    switch (field) {
      case "firstName":
        return !value ? "First name is required" : "";
      case "lastName":
        return !value ? "Last name is required" : "";
      case "companyName":
        return !value ? "Company name is required" : "";
      case "jobTitle":
        return !value ? "Job title is required" : "";
      case "companyEmail":
        if (!value) return "Email is required";
        if (!validateEmail(value as string)) return "Please enter a valid email address";
        return "";
      case "phone":
        return !value ? "Phone number is required" : "";
      case "country":
        return !value ? "Country is required" : "";
      case "products":
        return (value as string[]).length === 0
          ? "Please select at least one product"
          : "";
      case "estimatedQuantity":
        if (!value) return "Quantity is required";
        if (parseInt(value as string) <= 0) return "Quantity must be greater than 0";
        return "";
      case "purchaseTimeframe":
        return !value ? "Please select a timeframe" : "";
      case "useCase":
        return !value ? "Please select a use case" : "";
      case "consent":
        return !value ? "You must agree to be contacted" : "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    const value = getFieldValue(field);
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const getFieldValue = (field: string): string | string[] | boolean => {
    const values: Record<string, string | string[] | boolean> = {
      firstName,
      lastName,
      companyName,
      jobTitle,
      companyEmail,
      phone,
      country,
      products: selectedProducts,
      estimatedQuantity,
      purchaseTimeframe,
      useCase,
      consent,
    };
    return values[field] ?? "";
  };

  const toggleProduct = (productName: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productName)
        ? prev.filter((p) => p !== productName)
        : [...prev, productName]
    );
    // Clear product error when selection changes
    if (!selectedProducts.includes(productName)) {
      setErrors((prev) => ({ ...prev, products: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const fields = [
      "firstName",
      "lastName",
      "companyName",
      "jobTitle",
      "companyEmail",
      "phone",
      "country",
      "products",
      "estimatedQuantity",
      "purchaseTimeframe",
      "useCase",
      "consent",
    ];

    let isValid = true;
    fields.forEach((field) => {
      const value = getFieldValue(field);
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(new Set(fields));
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector(".field-error");
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          companyName,
          jobTitle,
          companyEmail,
          phone,
          country,
          city: city || null,
          products: selectedProducts,
          estimatedQuantity: parseInt(estimatedQuantity),
          purchaseTimeframe,
          useCase,
          message: message || null,
          consent,
          ...utmParams,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/thank-you");
      } else {
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (field: string) => touched.has(field) && errors[field];

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

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">

              {/* SECTION 1: Contact Information */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Contact Information
                </h2>
                <div className="h-[2px] bg-[#00a0ab] mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  {/* First Name */}
                  <div className={showError("firstName") ? "field-error" : ""}>
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => handleBlur("firstName")}
                      className="mt-1.5"
                      required
                    />
                    {showError("firstName") && (
                      <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className={showError("lastName") ? "field-error" : ""}>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => handleBlur("lastName")}
                      className="mt-1.5"
                      required
                    />
                    {showError("lastName") && (
                      <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className={showError("companyName") ? "field-error" : ""}>
                    <Label htmlFor="companyName">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onBlur={() => handleBlur("companyName")}
                      className="mt-1.5"
                      required
                    />
                    {showError("companyName") && (
                      <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div className={showError("jobTitle") ? "field-error" : ""}>
                    <Label htmlFor="jobTitle">
                      Job Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      onBlur={() => handleBlur("jobTitle")}
                      className="mt-1.5"
                      required
                    />
                    {showError("jobTitle") && (
                      <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>
                    )}
                  </div>

                  {/* Company Email */}
                  <div className={showError("companyEmail") ? "field-error" : ""}>
                    <Label htmlFor="companyEmail">
                      Company Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      onBlur={() => handleBlur("companyEmail")}
                      className="mt-1.5"
                      required
                    />
                    {showError("companyEmail") && (
                      <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className={showError("phone") ? "field-error" : ""}>
                    <Label htmlFor="phone">
                      Phone / Mobile <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      className="mt-1.5"
                      required
                    />
                    {showError("phone") && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Country */}
                  <div className={showError("country") ? "field-error" : ""}>
                    <Label>
                      Country <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={country}
                      onValueChange={(val) => {
                        setCountry(val);
                        setErrors((prev) => ({ ...prev, country: "" }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showError("country") && (
                      <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 2: Product Selection */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Product Selection <span className="text-red-500">*</span>
                </h2>
                <div className="h-[2px] bg-[#00a0ab] mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => {
                    const isSelected = selectedProducts.includes(product.name);
                    return (
                      <label
                        key={product.name}
                        className={`product-card flex items-start gap-3 ${
                          isSelected ? "selected" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product.name)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 block leading-tight">
                            {product.name}
                          </span>
                          <span className="text-sm text-[#00a0ab] font-semibold mt-0.5 block">
                            {product.price}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {showError("products") && (
                  <p className="text-red-500 text-xs mt-2">{errors.products}</p>
                )}
              </section>

              {/* SECTION 3: Business Details */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Business Details
                </h2>
                <div className="h-[2px] bg-[#00a0ab] mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  {/* Estimated Quantity */}
                  <div className={showError("estimatedQuantity") ? "field-error" : ""}>
                    <Label htmlFor="estimatedQuantity">
                      Estimated Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="estimatedQuantity"
                      type="number"
                      min="1"
                      value={estimatedQuantity}
                      onChange={(e) => setEstimatedQuantity(e.target.value)}
                      onBlur={() => handleBlur("estimatedQuantity")}
                      className="mt-1.5"
                      required
                    />
                    {showError("estimatedQuantity") && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.estimatedQuantity}
                      </p>
                    )}
                  </div>

                  {/* Purchase Timeframe */}
                  <div className={showError("purchaseTimeframe") ? "field-error" : ""}>
                    <Label>
                      Purchase Timeframe <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={purchaseTimeframe}
                      onValueChange={(val) => {
                        setPurchaseTimeframe(val);
                        setErrors((prev) => ({ ...prev, purchaseTimeframe: "" }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframeOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showError("purchaseTimeframe") && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.purchaseTimeframe}
                      </p>
                    )}
                  </div>

                  {/* Use Case - full width */}
                  <div
                    className={`md:col-span-2 ${
                      showError("useCase") ? "field-error" : ""
                    }`}
                  >
                    <Label>
                      Use Case <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={useCase}
                      onValueChange={(val) => {
                        setUseCase(val);
                        setErrors((prev) => ({ ...prev, useCase: "" }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                      <SelectContent>
                        {useCaseOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showError("useCase") && (
                      <p className="text-red-500 text-xs mt-1">{errors.useCase}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="md:col-span-2">
                    <Label htmlFor="message">
                      Message / Notes
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your project requirements…"
                      className="mt-1.5"
                      rows={4}
                    />
                  </div>
                </div>
              </section>

              {/* SECTION 4: Consent */}
              <section>
                <div
                  className={`flex items-start gap-3 ${
                    showError("consent") ? "field-error" : ""
                  }`}
                >
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => {
                      setConsent(checked === true);
                      if (checked) {
                        setErrors((prev) => ({ ...prev, consent: "" }));
                      }
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent" className="text-sm text-gray-600 font-normal cursor-pointer leading-snug">
                    I agree to be contacted by Ebttikar Technology regarding this inquiry.
                    <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                </div>
                {showError("consent") && (
                  <p className="text-red-500 text-xs mt-1 ml-7">{errors.consent}</p>
                )}
              </section>
            </div>

            {/* Submit Button */}
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-lg bg-[#00a0ab] hover:bg-[#008a94] text-white transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 spinner" />
                    Submitting...
                  </>
                ) : (
                  "Submit Inquiry"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Ebttikar Technology. All rights reserved.
        </p>
      </main>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00a0ab]" />
        </div>
      }
    >
      <OrderFormContent />
    </Suspense>
  );
}
