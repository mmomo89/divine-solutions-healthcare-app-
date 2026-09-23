export type Status = "draft" | "published" | "archived";

export interface MediaItem {
  id: number;
  url: string;
  alt_text: string;
  title: string;
}

export interface PageSection {
  id: number;
  page: number;
  section_type: string;
  heading: string;
  subheading: string;
  body: string;
  image: number | null;
  image_url: string | null;
  slide_image_urls: string[];
  cta_text: string;
  cta_link: string;
  anchor_id: string;
  data: Record<string, any>;
  is_visible: boolean;
  sort_order: number;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  breadcrumb_label: string;
  seo_title: string;
  meta_description: string;
  hero_image: number | null;
  hero_image_url: string | null;
  hero_heading: string;
  hero_subheading: string;
  status: Status;
  sections: PageSection[];
}

export interface Service {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: number | null;
  image_url: string | null;
  link_url: string;
  region: "ohio" | "north_dakota" | "home";
  status: Status;
  sort_order: number;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  external_url: string;
  document_url: string | null;
  status: Status;
  sort_order: number;
}

export interface NavigationItem {
  id: number;
  label: string;
  url: string;
  icon: number | null;
  icon_url: string | null;
  location: "header" | "footer";
  sort_order: number;
  is_visible: boolean;
  opens_new_tab: boolean;
}

export interface SiteSettings {
  id: number;
  company_name: string;
  phone: string;
  email_primary: string;
  email_secondary: string;
  address: string;
  map_embed_url: string;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  facebook_url: string;
  instagram_url: string;
  footer_tagline: string;
  copyright_text: string;
  display_copyright: string;
  designer_credit: string;
  seo_site_title: string;
  seo_meta_description: string;
}

export interface SubmissionReply {
  id: number;
  submission: string;
  subject: string;
  body: string;
  to_email: string;
  sent_by: number | null;
  sent_by_display: string;
  status: "sent" | "failed";
  error_message: string;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_type: "contact" | "careers";
  full_name: string;
  email: string;
  phone: string;
  message: string;
  extra_data: Record<string, any>;
  resume_url?: string | null;
  privacy_accepted: boolean;
  source_page: string;
  ip_address: string | null;
  status: "new" | "read" | "in_progress" | "completed" | "archived";
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_pages: number;
  published_pages: number;
  draft_pages: number;
  total_submissions: number;
  new_submissions: number;
  read_submissions: number;
  in_progress_submissions: number;
  completed_submissions: number;
  archived_submissions: number;
  total_resources: number;
  total_services: number;
  recent_submissions: FormSubmission[];
  recent_activity: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: number;
  user_display: string;
  action: string;
  description: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "super_admin" | "content_admin";
  is_active: boolean;
  needs_setup?: boolean;
}
