import React, { useState } from "react";
import api from "../../api/client";

interface Props {
  formType: "contact" | "careers";
  sourcePage: string;
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  message: string;
  position: string;
  privacy_accepted: boolean;
  hp_field: string; // honeypot spam trap
}

const initialState: FormState = {
  full_name: "",
  email: "",
  phone: "",
  message: "",
  position: "",
  privacy_accepted: false,
  hp_field: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactForm: React.FC<Props> = ({ formType, sourcePage }) => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [renderedAt] = useState(Date.now());

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!emailRegex.test(form.email)) e.email = "Please enter a valid email address.";
    if (formType === "contact" && !form.message.trim()) e.message = "Please enter a message.";
    if (!form.privacy_accepted) e.privacy_accepted = "You must accept the Privacy Policy to continue.";
    // Honeypot: if filled, silently treat as spam (bots fill every field)
    // Time-trap: submissions faster than 2s are very likely automated
    return e;
  };

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (form.hp_field) {
      // Honeypot triggered — pretend success, do not submit.
      setStatus("success");
      return;
    }
    if (Date.now() - renderedAt < 1500) {
      setServerError("Please take a moment to review the form before submitting.");
      return;
    }

    setStatus("submitting");
    setServerError("");
    try {
      await api.post("/forms/submit/", {
        form_type: formType,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        privacy_accepted: form.privacy_accepted,
        source_page: sourcePage,
        extra_data: formType === "careers" ? { position_of_interest: form.position } : {},
      });
      setStatus("success");
      setForm(initialState);
    } catch (err: any) {
      setStatus("error");
      const data = err?.response?.data;
      if (data && typeof data === "object") {
        const flat = Object.values(data).flat().join(" ");
        setServerError(flat || "Something went wrong. Please try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        <strong>Thank you{form.full_name ? "" : ""} \u2014 your message has been received.</strong>
        <p style={{ marginBottom: 0 }}>Our team will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Honeypot field — hidden from real users, invisible to screen readers via aria-hidden */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="hp_field">Leave this field empty</label>
        <input
          id="hp_field"
          name="hp_field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.hp_field}
          onChange={(e) => handleChange("hp_field", e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="full_name">Full Name*</label>
        <input
          id="full_name"
          type="text"
          value={form.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          aria-invalid={!!errors.full_name}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
          required
        />
        {errors.full_name && <div className="form-error" id="full_name-error">{errors.full_name}</div>}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email Address*</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        {errors.email && <div className="form-error" id="email-error">{errors.email}</div>}
      </div>

      <div className="form-field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
      </div>

      {formType === "careers" && (
        <div className="form-field">
          <label htmlFor="position">Position of Interest</label>
          <input id="position" type="text" value={form.position} onChange={(e) => handleChange("position", e.target.value)} />
        </div>
      )}

      <div className="form-field">
        <label htmlFor="message">Message{formType === "contact" ? "(s)" : ""}</label>
        <textarea
          id="message"
          rows={5}
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && <div className="form-error" id="message-error">{errors.message}</div>}
      </div>

      <div className="form-field checkbox">
        <input
          id="privacy_accepted"
          type="checkbox"
          checked={form.privacy_accepted}
          onChange={(e) => handleChange("privacy_accepted", e.target.checked)}
          aria-invalid={!!errors.privacy_accepted}
        />
        <label htmlFor="privacy_accepted" style={{ marginBottom: 0, textTransform: "none", letterSpacing: 0 }}>
          I have read and accept the <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>*
        </label>
      </div>
      {errors.privacy_accepted && <div className="form-error">{errors.privacy_accepted}</div>}

      {serverError && <div className="form-error" style={{ marginBottom: 12 }}>{serverError}</div>}

      <button type="submit" className="btn" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting\u2026" : "Submit"}
      </button>
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: 10 }}>
        This form is protected against spam and abuse.
      </p>
    </form>
  );
};

export default ContactForm;
