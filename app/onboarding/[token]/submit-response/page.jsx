"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export default function PreviewPage() {
  const router = useRouter();
  const { token } = useParams();

  // 🔹 Mock data (replace with data from store / API)
  const [data] = useState({
    personal: {
      firstName: "Ramesh",
      lastName: "Kumar",
      email: "ramesh@email.com",
      phone: "9876543210",
    },
    education: {
      degree: "B.Tech",
      institution: "ABC Engineering College",
      year: "2022",
    },
    experience: {
      company: "XYZ Pvt Ltd",
      role: "Software Engineer",
      years: "2",
    },
  });

  const handleSubmit = async () => {
    try {
      // 🔹 Call final submit API here
      // await fetch("/onboarding/submit", ...)

      toast.success("Onboarding submitted successfully");

      router.push(`/onboarding/${token}/success`);
    } catch {
      toast.error("Submission failed. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Review & Submit Your Details
      </h2>

      {/* PERSONAL DETAILS */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Personal Details</h3>
        <div className="border rounded p-4 text-sm space-y-1">
          <p><b>Name:</b> {data.personal.firstName} {data.personal.lastName}</p>
          <p><b>Email:</b> {data.personal.email}</p>
          <p><b>Phone:</b> {data.personal.phone}</p>
        </div>
      </section>

      {/* EDUCATION DETAILS */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Education Details</h3>
        <div className="border rounded p-4 text-sm space-y-1">
          <p><b>Degree:</b> {data.education.degree}</p>
          <p><b>Institution:</b> {data.education.institution}</p>
          <p><b>Year:</b> {data.education.year}</p>
        </div>
      </section>

      {/* EXPERIENCE DETAILS */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Experience Details</h3>
        <div className="border rounded p-4 text-sm space-y-1">
          <p><b>Company:</b> {data.experience.company}</p>
          <p><b>Role:</b> {data.experience.role}</p>
          <p><b>Years:</b> {data.experience.years}</p>
        </div>
      </section>

      {/* SUBMIT */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          className="bg-[#1e3a8a] hover:bg-blue-800 transition-colors"
        >
          Submit Onboarding
        </button>
      </div>
    </div>
  );
}
