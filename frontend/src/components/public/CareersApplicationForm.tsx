import React, { useState } from "react";
import api from "../../api/client";
import PhoneInput from "./PhoneInput";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
];

const ETHNICITY_OPTIONS = [
  "Hispanic or Latino",
  "White (Not Hispanic or Latino)",
  "Black or African American (Not Hispanic or Latino)",
  "Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)",
  "Asian (Not Hispanic or Latino)",
  "American Indian or Alaska Native (Not Hispanic or Latino)",
  "Two or More Races (Not Hispanic or Latino)",
  "I do not wish to answer",
];

interface EmploymentEntry {
  employer: string;
  address: string;
  supervisor: string;
  jobTitle: string;
  phone: string;
  datesFrom: string;
  datesTo: string;
  reasonForLeaving: string;
  responsibilities: string;
}

const emptyEmployment: EmploymentEntry = {
  employer: "", address: "", supervisor: "", jobTitle: "", phone: "",
  datesFrom: "", datesTo: "", reasonForLeaving: "", responsibilities: "",
};

interface FormState {
  lastName: string; firstName: string; middleInitial: string;
  address: string; city: string; state: string; zip: string;
  phone: string; email: string;
  dateOfApplication: string; positionAppliedFor: string;
  dateAvailableToStart: string; desiredSalary: string;
  employmentDesired: string[];
  legallyAuthorized: string; requireSponsorship: string; atLeast18: string;
  appliedBefore: string; convictedFelony: string;
  hsLocation: string; hsYears: string; hsDiploma: string; hsMajor: string;
  collegeLocation: string; collegeYears: string; collegeDiploma: string; collegeMajor: string;
  otherLocation: string; otherYears: string; otherDiploma: string; otherMajor: string;
  employment: EmploymentEntry[];
  ethnicity: string[];
  veteranStatus: string;
  cert1: boolean; cert2: boolean; cert3: boolean; cert4: boolean;
  signatureName: string; signatureDate: string;
  notRobot: boolean;
  hp_field: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const initialState: FormState = {
  lastName: "", firstName: "", middleInitial: "",
  address: "", city: "", state: "", zip: "",
  phone: "", email: "",
  dateOfApplication: today(), positionAppliedFor: "",
  dateAvailableToStart: "", desiredSalary: "",
  employmentDesired: [],
  legallyAuthorized: "", requireSponsorship: "", atLeast18: "",
  appliedBefore: "", convictedFelony: "",
  hsLocation: "", hsYears: "", hsDiploma: "", hsMajor: "",
  collegeLocation: "", collegeYears: "", collegeDiploma: "", collegeMajor: "",
  otherLocation: "", otherYears: "", otherDiploma: "", otherMajor: "",
  employment: [{ ...emptyEmployment }, { ...emptyEmployment }, { ...emptyEmployment }],
  ethnicity: [],
  veteranStatus: "",
  cert1: false, cert2: false, cert3: false, cert4: false,
  signatureName: "", signatureDate: today(),
  notRobot: false,
  hp_field: "",
};

const YesNoSelect: React.FC<{ label: string; value: string; onChange: (v: string) => void; required?: boolean }> = ({
  label, value, onChange, required,
}) => (
  <div className="adm-field form-field">
    <label>{label}{required && <span className="form-required"> *</span>}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      <option value="">Select\u2026</option>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </div>
);

const EducationBlock: React.FC<{
  title: string;
  location: string; years: string; diploma: string; major: string;
  onChange: (field: "Location" | "Years" | "Diploma" | "Major", value: string) => void;
}> = ({ title, location, years, diploma, major, onChange }) => (
  <>
    <div className="form-section-bar">{title}</div>
    <div className="form-grid-2">
      <div className="form-field"><label>Location</label><input value={location} onChange={(e) => onChange("Location", e.target.value)} /></div>
      <div className="form-field"><label>Years Attended</label><input value={years} onChange={(e) => onChange("Years", e.target.value)} /></div>
    </div>
    <div className="form-grid-2">
      <div className="form-field"><label>Diploma/Degree</label><input value={diploma} onChange={(e) => onChange("Diploma", e.target.value)} /></div>
      <div className="form-field"><label>Major/Subject</label><input value={major} onChange={(e) => onChange("Major", e.target.value)} /></div>
    </div>
  </>
);

interface Props {
  sourcePage: string;
}

const CareersApplicationForm: React.FC<Props> = ({ sourcePage }) => {
  const [form, setForm] = useState<FormState>(initialState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [renderedAt] = useState(Date.now());

  const field = (key: keyof FormState, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleArrayValue = (key: "employmentDesired" | "ethnicity", value: string) => {
    setForm((f) => {
      const arr = f[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next };
    });
  };

  const updateEmployment = (index: number, patch: Partial<EmploymentEntry>) => {
    setForm((f) => {
      const employment = [...f.employment];
      employment[index] = { ...employment[index], ...patch };
      return { ...f, employment };
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.middleInitial.trim()) e.middleInitial = "Required";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.zip.trim()) e.zip = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.positionAppliedFor.trim()) e.positionAppliedFor = "Required";
    if (!form.dateAvailableToStart) e.dateAvailableToStart = "Required";
    if (!form.desiredSalary.trim()) e.desiredSalary = "Required";
    if (form.employmentDesired.length === 0) e.employmentDesired = "Select at least one";
    if (!form.signatureName.trim()) e.signatureName = "Required";
    if (!form.signatureDate) e.signatureDate = "Required";
    if (!(form.cert1 && form.cert2 && form.cert3 && form.cert4)) e.certifications = "You must agree to all statements to continue.";
    if (!form.notRobot) e.notRobot = "Please confirm you're not a robot.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (form.hp_field) {
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
      const fd = new FormData();
      fd.append("form_type", "careers");
      fd.append("full_name", `${form.firstName} ${form.lastName}`.trim());
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("message", "");
      fd.append("privacy_accepted", form.cert4 ? "true" : "false");
      fd.append("source_page", sourcePage);

      const { employment, ethnicity, employmentDesired, ...rest } = form;
      const extra = {
        ...rest,
        employment_desired: employmentDesired,
        ethnicity_race: ethnicity,
        employment_history: employment.filter((entry) => Object.values(entry).some((v) => v.trim())),
      };
      fd.append("extra_data", JSON.stringify(extra));
      if (resumeFile) fd.append("resume", resumeFile);

      await api.post("/forms/submit/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      const data = err?.response?.data;
      setServerError((data && (data.detail || Object.values(data).flat().join(" "))) || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        <strong>Thank you for applying to Divine Solutions Healthcare LLC.</strong>
        <p style={{ marginBottom: 0 }}>We've received your application and will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="hp_field">Leave this field empty</label>
        <input id="hp_field" type="text" tabIndex={-1} autoComplete="off" value={form.hp_field} onChange={(e) => field("hp_field", e.target.value)} />
      </div>

      <p className="form-required-note"><span className="form-required">*</span> Required Information</p>

      <div className="form-section-bar">Personal Information</div>
      <div className="form-grid">
        <div className="form-field"><label>Last Name <span className="form-required">*</span></label><input value={form.lastName} onChange={(e) => field("lastName", e.target.value)} />{errors.lastName && <div className="form-error">{errors.lastName}</div>}</div>
        <div className="form-field"><label>First Name <span className="form-required">*</span></label><input value={form.firstName} onChange={(e) => field("firstName", e.target.value)} />{errors.firstName && <div className="form-error">{errors.firstName}</div>}</div>
        <div className="form-field"><label>Middle Initial <span className="form-required">*</span></label><input value={form.middleInitial} onChange={(e) => field("middleInitial", e.target.value)} maxLength={2} />{errors.middleInitial && <div className="form-error">{errors.middleInitial}</div>}</div>
      </div>

      <div className="form-field"><label>Address <span className="form-required">*</span></label><input value={form.address} onChange={(e) => field("address", e.target.value)} />{errors.address && <div className="form-error">{errors.address}</div>}</div>

      <div className="form-grid">
        <div className="form-field"><label>City <span className="form-required">*</span></label><input value={form.city} onChange={(e) => field("city", e.target.value)} />{errors.city && <div className="form-error">{errors.city}</div>}</div>
        <div className="form-field">
          <label>State <span className="form-required">*</span></label>
          <select value={form.state} onChange={(e) => field("state", e.target.value)}>
            <option value="">Select\u2026</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <div className="form-error">{errors.state}</div>}
        </div>
        <div className="form-field"><label>Zip <span className="form-required">*</span></label><input value={form.zip} onChange={(e) => field("zip", e.target.value)} />{errors.zip && <div className="form-error">{errors.zip}</div>}</div>
      </div>

      <div className="form-grid-2">
        <div className="form-field"><label>Phone <span className="form-required">*</span></label><PhoneInput value={form.phone} onChange={(v) => field("phone", v)} />{errors.phone && <div className="form-error">{errors.phone}</div>}</div>
        <div className="form-field"><label>Email <span className="form-required">*</span></label><input type="email" value={form.email} onChange={(e) => field("email", e.target.value)} />{errors.email && <div className="form-error">{errors.email}</div>}</div>
      </div>

      <div className="form-grid-2">
        <div className="form-field"><label>Date of Application</label><input type="date" value={form.dateOfApplication} onChange={(e) => field("dateOfApplication", e.target.value)} /></div>
        <div className="form-field"><label>Position Applied For <span className="form-required">*</span></label><input value={form.positionAppliedFor} onChange={(e) => field("positionAppliedFor", e.target.value)} />{errors.positionAppliedFor && <div className="form-error">{errors.positionAppliedFor}</div>}</div>
      </div>

      <div className="form-grid-2">
        <div className="form-field"><label>Date Available to Start <span className="form-required">*</span></label><input type="date" value={form.dateAvailableToStart} onChange={(e) => field("dateAvailableToStart", e.target.value)} />{errors.dateAvailableToStart && <div className="form-error">{errors.dateAvailableToStart}</div>}</div>
        <div className="form-field"><label>Desired Salary <span className="form-required">*</span></label><input value={form.desiredSalary} onChange={(e) => field("desiredSalary", e.target.value)} placeholder="$" />{errors.desiredSalary && <div className="form-error">{errors.desiredSalary}</div>}</div>
      </div>

      <div className="form-field">
        <label>Employment Desired <span className="form-required">*</span></label>
        <div className="checkbox-group">
          {["Full-Time", "Part-Time", "Temporary"].map((opt) => (
            <label key={opt}>
              <input type="checkbox" checked={form.employmentDesired.includes(opt)} onChange={() => toggleArrayValue("employmentDesired", opt)} />
              {opt}
            </label>
          ))}
        </div>
        {errors.employmentDesired && <div className="form-error">{errors.employmentDesired}</div>}
      </div>

      <div className="form-section-bar">Eligibility</div>
      <YesNoSelect label="Are you legally authorized to work in the U.S.?" value={form.legallyAuthorized} onChange={(v) => field("legallyAuthorized", v)} />
      <YesNoSelect label="Will you now or in the future require sponsorship?" value={form.requireSponsorship} onChange={(v) => field("requireSponsorship", v)} />
      <YesNoSelect label="Are you at least 18 years of age?" value={form.atLeast18} onChange={(v) => field("atLeast18", v)} />
      <YesNoSelect label="Have you ever applied to or worked for this company before?" value={form.appliedBefore} onChange={(v) => field("appliedBefore", v)} />
      <YesNoSelect label="Have you ever been convicted of a felony?" value={form.convictedFelony} onChange={(v) => field("convictedFelony", v)} />

      <EducationBlock
        title="High School" location={form.hsLocation} years={form.hsYears} diploma={form.hsDiploma} major={form.hsMajor}
        onChange={(f, v) => field(("hs" + f) as keyof FormState, v)}
      />
      <EducationBlock
        title="College/University" location={form.collegeLocation} years={form.collegeYears} diploma={form.collegeDiploma} major={form.collegeMajor}
        onChange={(f, v) => field(("college" + f) as keyof FormState, v)}
      />
      <EducationBlock
        title="Other/Trade School" location={form.otherLocation} years={form.otherYears} diploma={form.otherDiploma} major={form.otherMajor}
        onChange={(f, v) => field(("other" + f) as keyof FormState, v)}
      />

      <div className="form-section-bar">Employment History</div>
      {form.employment.map((entry, i) => (
        <div className="employment-block" key={i}>
          <div className="employment-block__title">Previous Employer {i + 1}</div>
          <div className="form-field"><label>Employer</label><input value={entry.employer} onChange={(e) => updateEmployment(i, { employer: e.target.value })} /></div>
          <div className="form-field"><label>Address</label><input value={entry.address} onChange={(e) => updateEmployment(i, { address: e.target.value })} /></div>
          <div className="form-grid-2">
            <div className="form-field"><label>Supervisor</label><input value={entry.supervisor} onChange={(e) => updateEmployment(i, { supervisor: e.target.value })} /></div>
            <div className="form-field"><label>Job Title</label><input value={entry.jobTitle} onChange={(e) => updateEmployment(i, { jobTitle: e.target.value })} /></div>
          </div>
          <div className="form-field"><label>Phone</label><PhoneInput value={entry.phone} onChange={(v) => updateEmployment(i, { phone: v })} /></div>
          <div className="form-grid-2">
            <div className="form-field"><label>Dates Employed (From)</label><input type="date" value={entry.datesFrom} onChange={(e) => updateEmployment(i, { datesFrom: e.target.value })} /></div>
            <div className="form-field"><label>To</label><input type="date" value={entry.datesTo} onChange={(e) => updateEmployment(i, { datesTo: e.target.value })} /></div>
          </div>
          <div className="form-field"><label>Reason for Leaving</label><input value={entry.reasonForLeaving} onChange={(e) => updateEmployment(i, { reasonForLeaving: e.target.value })} /></div>
          <div className="form-field"><label>Responsibilities</label><textarea rows={3} value={entry.responsibilities} onChange={(e) => updateEmployment(i, { responsibilities: e.target.value })} /></div>
        </div>
      ))}

      <div className="form-section-bar">Voluntary Self-Identification</div>
      <div className="form-field">
        <label>Ethnicity &amp; Race</label>
        <div className="checkbox-group">
          {ETHNICITY_OPTIONS.map((opt) => (
            <label key={opt}>
              <input type="checkbox" checked={form.ethnicity.includes(opt)} onChange={() => toggleArrayValue("ethnicity", opt)} />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>Protected Veteran Status</label>
        <select value={form.veteranStatus} onChange={(e) => field("veteranStatus", e.target.value)}>
          <option value="">Select\u2026</option>
          <option value="I identify as one or more of the classifications of protected veterans.">I identify as one or more of the classifications of protected veterans.</option>
          <option value="I am not a protected veteran.">I am not a protected veteran.</option>
          <option value="I do not wish to answer.">I do not wish to answer.</option>
        </select>
      </div>
      <div className="form-field">
        <label>Attach Resume <span className="muted" style={{ fontWeight: 400, textTransform: "none" }}>(accepted file types: .doc, .docx, .pdf, .txt)</span></label>
        <label className="file-field">
          <input type="file" accept=".doc,.docx,.pdf,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
          <span className="file-field__label">{resumeFile ? resumeFile.name : "Choose a file\u2026"}</span>
        </label>
      </div>

      <div className="form-section-bar">Applicant Certification and Agreement</div>
      <div className="certification-list">
        <label>
          <input type="checkbox" checked={form.cert1} onChange={(e) => field("cert1", e.target.checked)} />
          I certify that the information provided in this application is true and complete to the best of my knowledge. I understand that any false statements, misrepresentations, or omissions may result in disqualification from consideration or termination if employed.
        </label>
        <label>
          <input type="checkbox" checked={form.cert2} onChange={(e) => field("cert2", e.target.checked)} />
          I authorize the Company to verify all information provided and to contact previous employers, references, and educational institutions concerning my qualifications.
        </label>
        <label>
          <input type="checkbox" checked={form.cert3} onChange={(e) => field("cert3", e.target.checked)} />
          I understand that this application is not a contract of employment, if hired, employment is "at-will" and may be terminated by either the Company or myself at any time, with or without notice.
        </label>
        <label>
          <input type="checkbox" checked={form.cert4} onChange={(e) => field("cert4", e.target.checked)} />
          I consent to the collection, use, storage, and processing of my personal and, where applicable, health-related information, including any data I submit on behalf of others, for the purpose of evaluating or fulfilling my request made through this form. I understand this will be handled in accordance with the{" "}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
        </label>
      </div>
      {errors.certifications && <div className="form-error" style={{ marginBottom: 12 }}>{errors.certifications}</div>}

      <div className="form-grid-2">
        <div className="form-field"><label>Signature Name <span className="form-required">*</span></label><input value={form.signatureName} onChange={(e) => field("signatureName", e.target.value)} />{errors.signatureName && <div className="form-error">{errors.signatureName}</div>}</div>
        <div className="form-field"><label>Date <span className="form-required">*</span></label><input type="date" value={form.signatureDate} onChange={(e) => field("signatureDate", e.target.value)} />{errors.signatureDate && <div className="form-error">{errors.signatureDate}</div>}</div>
      </div>

      <div className="form-field checkbox">
        <input type="checkbox" id="notRobot" checked={form.notRobot} onChange={(e) => field("notRobot", e.target.checked)} />
        <label htmlFor="notRobot" style={{ marginBottom: 0, textTransform: "none", letterSpacing: 0 }}>I'm not a robot</label>
      </div>
      {errors.notRobot && <div className="form-error" style={{ marginBottom: 12 }}>{errors.notRobot}</div>}

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

export default CareersApplicationForm;
