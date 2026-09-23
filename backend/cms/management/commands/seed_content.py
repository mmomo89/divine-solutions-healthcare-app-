"""
Seed the database with the content extracted from the supplied
Divine Solutions Healthcare LLC source HTML files.

Run with: python manage.py seed_content
"""
import os

from django.conf import settings
from django.contrib.auth.models import User
from django.core.files import File
from django.core.management.base import BaseCommand

from cms.models import (
    AdminProfile,
    MediaItem,
    NavigationItem,
    Page,
    PageSection,
    Resource,
    Service,
    SiteSettings,
)

SEED_ASSETS = os.path.join(settings.BASE_DIR, "seed_assets")

NAV_ITEMS = [
    ("Home", "/"),
    ("About Us", "/home-health-care-about-us"),
    ("Ohio Office Services", "/home-health-care-ohio-office-services"),
    ("North Dakota Office Services", "/home-health-care-north-dakota-office-services"),
    ("Careers", "/home-health-care-careers"),
    ("Resources", "/home-health-care-resources"),
    ("Contact Us", "/home-health-care-contact-us"),
]

MISSION_TEXT = (
    "Our mission is to provide quality residential care services for individuals with developmental "
    "disabilities. We are committed to delivering compassionate, personalized, and high-quality care "
    "that empowers individuals to live safely, comfortably, and independently in their own homes. We "
    "are committed to promoting our clients\u2019 well-being, dignity, and quality of life through "
    "exceptional care, professionalism, integrity, and a deep respect for each individual\u2019s "
    "unique needs."
)

VISION_TEXT = (
    "Our vision is to be a trusted leader in home health care, known for our commitment to excellence, "
    "innovation, and compassionate service. We strive to create a healthier, more inclusive community "
    "where individuals of all ages receive the support they need to thrive at home, ensuring that every "
    "patient receives care that enhances their independence and enriches their lives."
)

VALUES = [
    ("Compassion", "We approach every client and family with empathy, kindness, and understanding, "
                    "ensuring their needs and feelings are at the heart of our care."),
    ("Integrity", "We uphold the highest standards of ethics and professionalism, delivering care with "
                  "honesty, transparency, and accountability."),
    ("Excellence", "We strive for the highest level of quality in all our services, continuously improving "
                   "to exceed the expectations of those we serve."),
    ("Respect", "We treat every client, family member, and team member with dignity and respect, recognizing "
                "and valuing each individual\u2019s uniqueness."),
    ("Collaboration", "We foster a spirit of teamwork and open communication among clients, families, and our "
                       "Direct Support Professionals (DSP), ensuring that care is coordinated and comprehensive."),
    ("Innovation", "We embrace new technologies and best practices to improve outcomes and enhance the client "
                   "experience while remaining responsive to our community\u2019s evolving needs."),
    ("Commitment", "We are devoted to creating a safe, supportive, and nurturing environment where individuals "
                   "can heal, recover, and maintain their independence at home."),
]

OHIO_SERVICES = [
    ("Share Living", "share-living", "Our Shared Living Program matches clients with compassionate care.",
     "ohio_caregiver_and_senior_looking_each_other_and_smiling_9.png"),
    ("Community Transition", "community-transition",
     "Community Transition is designed to support individuals with developmental disabilities as they move "
     "from institutional settings back into their homes and communities. This service focuses on creating a "
     "smooth and successful transition by providing comprehensive planning and personalized support tailored "
     "to each individual\u2019s unique needs. Our dedicated team works closely with clients and their families "
     "to ensure a seamless integration process \u2014 assessing each individual\u2019s strengths and preferences, "
     "developing personalized care plans, and coordinating necessary resources to promote independence and "
     "self-sufficiency. We provide ongoing support during the transition period, offering assistance with life "
     "skills training, social integration, and community engagement, so clients can thrive in their new "
     "environment with confidence.",
     "ohio_caregiver_and_senior_smiling_10.png"),
    ("Homemaker Personal Care", "homemaker-personal-care",
     "Personalized in-home support that helps clients manage daily living with dignity.",
     "ohio_caregiver_assisting_senior_11.png"),
    ("Assisted Living", "assisted-living",
     "Supportive living services designed around each client\u2019s unique needs.",
     "ohio_caregiver_taking_care_on_her_patient_senior_12.png"),
    ("Participant Directed HPC", "participant-directed-hpc",
     "Participant-directed homemaker personal care that puts clients in control of their own care.",
     "ohio_caregiver_and_senior_smiling_13.png"),
]

ND_SERVICES = [
    ("Residential Services", "nd-residential-services",
     "Safe and supportive living environments designed to encourage independence and personal growth.",
     "nd_Caregiver_assisting_elderly_8.jpeg"),
    ("Independent Day Habilitation", "nd-independent-day-habilitation",
     "Structured programs that help individuals develop daily living, social, and community participation skills.",
     "nd_nurse_praparing_medecine_9.jpeg"),
    ("Prevocational Services", "nd-prevocational-services",
     "Skill-building opportunities that prepare individuals for meaningful employment and greater independence.",
     "nd_nurse_helping_patient_exercise_10.jpeg"),
    ("Family Support Services/In-Home Supports/Respite", "nd-in-home-supports-respite",
     "A trained caregiver steps in to help meet an individual\u2019s day-to-day care needs, giving the parent or "
     "primary caregiver scheduled relief and rest through respite support \u2014 whether they need a few hours "
     "away or ongoing periodic relief.",
     "nd_senior_hanging_outside_11.jpeg"),
    ("Family Support Services/Extended Home Health Care", "nd-extended-home-health-care",
     "An extension of the standard Home Health Care State Plan service, bringing skilled nursing care directly "
     "into an individual\u2019s family home so they can remain safe, comfortable, and close to the people who "
     "support them.",
     "nd_nurse_helping_patient_12.jpeg"),
    ("Family Support Services/Family Care Option", "nd-family-care-option",
     "Designed for a child who is unable to receive care in their own family home on a full-time basis. A child "
     "under 21 is placed in a family or adult foster care home that meets state safety standards, giving "
     "families a trusted, closely supported alternative.",
     "nd_nurse_helping_patient_walk_13.jpeg"),
    ("Family Support Services/Self-Directed Supports", "nd-self-directed-supports",
     "Families take the lead in directing their own care plan \u2014 choosing from services such as behavior "
     "consultation, adaptive equipment and supplies, environmental modifications to the home, and additional "
     "in-home supports tailored to what the family actually needs.",
     "nd_nurse_helping_patient_walk_14.jpeg"),
    ("Family Support Services/Parenting Supports", "nd-parenting-supports",
     "Hands-on parenting skills training and coaching for individuals who are parents, or who are preparing to "
     "become parents, helping build confidence and practical caregiving skills.",
     "nd_senior_hanging_outside_11.jpeg"),
]

RESOURCES = [
    ("American Health Care Association", "https://www.ahcancal.org"),
    ("American Heart Association", "https://www.americanheart.org"),
    ("Home Care Association of America", "https://www.hcaoa.org"),
    ("National Institutes of Health", "https://health.nih.gov"),
    ("Joint Commission on Accreditation of Healthcare Organizations", "https://www.jointcommission.org"),
]

# Extra internal destinations referenced from the source HTML that did not have
# their own full page export supplied. Routes + light CMS-editable structure only;
# no invented body copy beyond what appeared in the source link/card text.
STUB_LINKS = [
    ("home-health-care-request-a-consultation", "Request a Consultation",
     "Get personalized advice from our care team."),
    ("home-health-care-insurance-verification", "Insurance Verification",
     "Confirm your insurance options with us."),
    ("home-health-care-request-brochure", "Request Brochure",
     "Learn more about our services in detail."),
    ("home-health-care-billing-questions", "Billing Questions",
     "Assistance with any billing or payment inquiries."),
]


def media(filename, alt_text="", title=""):
    """Create (or reuse) a MediaItem from a file in seed_assets/."""
    path = os.path.join(SEED_ASSETS, filename)
    if not os.path.exists(path):
        return None
    existing = MediaItem.objects.filter(file__endswith=filename).first()
    if existing:
        return existing
    item = MediaItem(alt_text=alt_text, title=title or alt_text)
    with open(path, "rb") as f:
        item.file.save(filename, File(f), save=True)
    return item


class Command(BaseCommand):
    help = "Seed the database with content extracted from the source HTML files."

    def handle(self, *args, **options):
        self.stdout.write("Seeding site settings...")
        settings_obj, _ = SiteSettings.objects.get_or_create(pk=1)
        logo = media("home_Divine_Solutions_Healthcare_LLC_3.png", "Divine Solutions Healthcare LLC", "Primary Logo")
        settings_obj.logo_light = logo
        if not settings_obj.map_embed_url:
            settings_obj.map_embed_url = SiteSettings._meta.get_field("map_embed_url").default
        settings_obj.save()

        self.stdout.write("Seeding navigation...")
        NavigationItem.objects.all().delete()
        for i, (label, url) in enumerate(NAV_ITEMS):
            NavigationItem.objects.create(label=label, url=url, location="header", sort_order=i)
            NavigationItem.objects.create(label=label, url=url, location="footer", sort_order=i)

        self.stdout.write("Seeding Home page...")
        home, _ = Page.objects.update_or_create(
            slug="home",
            defaults=dict(
                title="Home Health Care in Columbus, Ohio",
                breadcrumb_label="Home",
                seo_title="Home Health Care in Columbus, Ohio",
                meta_description="Divine Solutions Healthcare LLC provides compassionate residential "
                                  "care services in Columbus, Ohio.",
                status="published",
            ),
        )
        home.sections.all().delete()
        slider_img_ids = [
            media("home_img8_8.jpeg", "senior and caregiver smiling while looking each other").id,
            media("home_img9_9.jpeg", "nurse and senior outdoors").id,
            media("home_img10_10.jpeg", "nurse comforting to senior").id,
        ]
        PageSection.objects.create(
            page=home, section_type="hero_slider", sort_order=0,
            heading="Nurturing Independence with Compassionate Service",
            body="Empowering clients through tailored care that respects their unique needs.",
            cta_text="Learn More", cta_link="/home-health-care-about-us",
            data={"images": slider_img_ids},
        )
        PageSection.objects.create(
            page=home, section_type="card_grid", sort_order=1, heading="middle_cards",
            data={"cards": [
                {"title": "Request a Consultation", "text": "Get personalized advice from our care team.",
                 "link": "/home-health-care-request-a-consultation"},
                {"title": "Insurance Verification", "text": "Confirm your insurance options with us.",
                 "link": "/home-health-care-insurance-verification"},
            ]},
        )
        PageSection.objects.create(
            page=home, section_type="intro", sort_order=2,
            heading="Introducing", subheading="Divine Solutions Healthcare LLC",
            body="We are dedicated to providing exceptional residential care services that empower "
                 "individuals to thrive in the comfort of their own homes, promoting dignity, well-being, "
                 "and a high quality of life.\n\nAt Divine Solutions, we envision a healthier, more inclusive "
                 "community where every individual receives the care they need to live independently and "
                 "confidently. Our commitment to fostering a nurturing environment ensures that our clients "
                 "and their families feel valued and supported throughout their care journey.",
            image=media("home_Caregiver_and_elderly_smiling_11.png", "Caregiver and elderly smiling"),
        )
        PageSection.objects.create(
            page=home, section_type="service_grid", sort_order=3,
            heading="What we Do", subheading="Services We Offer",
            body="Discover the range of services Divine Healthcare LLC offers to keep you healthy, "
                 "comfortable, and safe at home.",
            data={"region": "north_dakota"},
        )
        PageSection.objects.create(
            page=home, section_type="mission", sort_order=4, heading="Mission Statement", body=MISSION_TEXT,
            cta_text="About Us", cta_link="/home-health-care-about-us#mission",
        )
        PageSection.objects.create(
            page=home, section_type="vision", sort_order=5, heading="Vision Statement", body=VISION_TEXT,
        )
        PageSection.objects.create(
            page=home, section_type="card_grid", sort_order=6, heading="bottom_cards",
            data={"cards": [
                {"title": "Request Brochure", "text": "Learn more about our services in detail.",
                 "link": "/home-health-care-request-brochure"},
                {"title": "Billing Questions", "text": "Assistance with any billing or payment inquiries.",
                 "link": "/home-health-care-billing-questions"},
            ]},
        )
        PageSection.objects.create(
            page=home, section_type="contact_form", sort_order=7,
            heading="Reach Out Anytime", subheading="Send Us a Message",
            body="We're here to help answer any questions you may have. Whether you're interested in our "
                 "services or simply need guidance.",
        )

        self.stdout.write("Seeding About Us page...")
        about, _ = Page.objects.update_or_create(
            slug="home-health-care-about-us",
            defaults=dict(
                title="About Us | Home Health Care in Columbus, Ohio",
                breadcrumb_label="About Us",
                seo_title="About Us | Home Health Care in Columbus, Ohio",
                meta_description="Discover our commitment to compassionate care and enhancing your well-being.",
                hero_heading="About Us",
                hero_subheading="Discover our commitment to compassionate care and enhancing your well-being.",
                hero_image=media("about_caregiver_and_senior_smiling_8.jpeg", "caregiver and senior smiling"),
                status="published",
            ),
        )
        about.sections.all().delete()
        PageSection.objects.create(
            page=about, section_type="text", sort_order=1, heading="Who We Are",
            body="Divine Solutions Healthcare LLC embodies a commitment to compassionate and high-quality "
                 "care, empowering individuals to live their lives to the fullest within the comfort of their "
                 "own homes. Our dedicated team provides personalized support that enhances the well-being and "
                 "independence of our clients, fostering an environment of dignity and respect. We focus on "
                 "collaboration among caregivers, clients, and families to create a seamless experience centered "
                 "on communication and understanding. With a commitment to continuous improvement and innovation, "
                 "our services are tailored to meet the diverse needs of our community, promoting independence "
                 "and enhancing the quality of life for those we serve. Each individual is unique, and we honor "
                 "that by delivering personalized care that respects their preferences and choices, driving us "
                 "to build a healthier, more inclusive environment for everyone.",
        )
        PageSection.objects.create(
            page=about, section_type="mission", sort_order=2, heading="Mission Statement",
            body="Our mission is to provide quality residential care services for individuals with developmental "
                 "disabilities. We are committed to delivering compassionate, personalized, and high-quality care "
                 "that empowers individuals to live safely, comfortably, and independently in their own homes. We "
                 "are committed to promoting our clients\u2019 well-being, dignity, and quality of life through "
                 "exceptional care, professionalism, integrity, and a deep respect for each individual\u2019s "
                 "unique needs.",
        )
        PageSection.objects.create(
            page=about, section_type="vision", sort_order=3, heading="Vision Statement",
            body="Our vision is to be a trusted leader in home health care, known for our commitment to "
                 "excellence, innovation, and compassionate service. We strive to create a healthier, more "
                 "inclusive community where individuals of all ages receive the support they need to thrive at "
                 "home, ensuring that every patient receives care that enhances their independence and enriches "
                 "their lives.",
        )
        PageSection.objects.create(
            page=about, section_type="values", sort_order=4,
            heading="Value Statement for", subheading="Divine Solutions Healthcare Services",
            body="At Divine Solutions Healthcare Services, our values are the foundation of everything we do. "
                 "We are dedicated to providing compassionate and personalized care that honors the dignity and "
                 "well-being of every individual we serve. Our core values include:",
            data={
                "values": [{"name": n, "description": d} for n, d in VALUES],
                "closing": "These values guide our mission to deliver exceptional care that enriches the lives "
                           "of our patients and builds stronger, healthier communities.",
            },
        )
        PageSection.objects.create(
            page=about, section_type="cta", sort_order=5,
            body="Explore your care options\u2014contact us for a free assessment!",
            cta_text="Contact Us", cta_link="/home-health-care-contact-us",
        )

        self.stdout.write("Seeding Ohio Office Services page + services...")
        ohio, _ = Page.objects.update_or_create(
            slug="home-health-care-ohio-office-services",
            defaults=dict(
                title="Ohio Office Services | Home Health Care in Columbus, Ohio",
                breadcrumb_label="Ohio Office Services",
                seo_title="Ohio Office Services | Home Health Care in Columbus, Ohio",
                meta_description="Comprehensive care solutions tailored to meet your unique health needs.",
                hero_heading="Ohio Office Services",
                hero_subheading="Comprehensive care solutions tailored to meet your unique health needs.",
                hero_image=media("ohio_caregiver_assisting_senior_8.jpeg", "caregiver assisting senior"),
                status="published",
            ),
        )
        ohio.sections.all().delete()
        PageSection.objects.create(
            page=ohio, section_type="intro", sort_order=1,
            body="Divine Solutions Healthcare LLC is dedicated to providing comprehensive care for individuals "
                 "with developmental disabilities aged 18 and above, enhancing their independence and quality "
                 "of life. Our personalized support services are designed to meet each client\u2019s unique "
                 "needs, ensuring they receive the care and attention they deserve. We focus on fostering "
                 "dignity and promoting integration into the community, working closely with clients and their "
                 "families to align our services with their individual goals. Explore our range of services "
                 "below to discover how we can assist you or your loved one on the journey to a fulfilling life.",
        )
        PageSection.objects.create(page=ohio, section_type="service_grid", sort_order=2, data={"region": "ohio"})
        PageSection.objects.create(
            page=ohio, section_type="cta", sort_order=3,
            body="Ready to experience compassionate care tailored to your needs? Contact us today to learn how "
                 "we can support you or your loved ones on the journey to better health and independence!",
            cta_text="Contact Us", cta_link="/home-health-care-contact-us",
        )
        Service.objects.filter(region="ohio").delete()
        for i, (title, slug, desc, img) in enumerate(OHIO_SERVICES):
            Service.objects.update_or_create(
                slug=slug,
                defaults=dict(title=title, description=desc, region="ohio", status="published", sort_order=i,
                               link_url=f"/{slug}", image=media(img, title)),
            )

        self.stdout.write("Seeding North Dakota Office Services page + services...")
        nd, _ = Page.objects.update_or_create(
            slug="home-health-care-north-dakota-office-services",
            defaults=dict(
                title="North Dakota Office Services | Home Health Care in Columbus, Ohio",
                breadcrumb_label="North Dakota Office Services",
                seo_title="North Dakota Office Services | Home Health Care in Columbus, Ohio",
                meta_description="Compassionate Support Services for Individuals and Families",
                hero_heading="North Dakota Office Services",
                hero_subheading="Compassionate Support Services for Individuals and Families",
                hero_image=media("nd_Caregiver_assisting_elderly_8.jpeg", "Caregiver assisting elderly"),
                status="published",
            ),
        )
        nd.sections.all().delete()
        PageSection.objects.create(
            page=nd, section_type="intro", sort_order=1,
            body="We are committed to providing quality, person-centered support services that promote "
                 "independence, enhance daily living, and improve the quality of life for individuals and their "
                 "families throughout North Dakota. Our dedicated team works closely with each client to deliver "
                 "compassionate care tailored to their unique needs.",
        )
        PageSection.objects.create(page=nd, section_type="service_grid", sort_order=2, heading="Our Services",
                                    data={"region": "north_dakota"})
        PageSection.objects.create(
            page=nd, section_type="office_info", sort_order=3, heading="Contact Our North Dakota Office",
            body="If you have questions about our services or would like to learn how we can support you or "
                 "your loved one, please contact our North Dakota office. Our team is here to help.",
            data={
                "addresses": [
                    {"label": "Fargo Office", "address": "Brandt Office Park, 3523 45th St S, suit 100, Fargo, ND 58104."},
                    {"label": "Registered Address", "address": "5497 28th Ave S Apt 2013, Fargo, ND 58104."},
                ],
                "phones": ["(701) 306-9293", "614-571-2711", "614-999-3840"],
            },
        )
        Service.objects.filter(region="north_dakota").delete()
        for i, (title, slug, desc, img) in enumerate(ND_SERVICES):
            Service.objects.update_or_create(
                slug=slug,
                defaults=dict(title=title, description=desc, region="north_dakota", status="published",
                               sort_order=i, image=media(img, title)),
            )

        self.stdout.write("Seeding Careers page...")
        careers, _ = Page.objects.update_or_create(
            slug="home-health-care-careers",
            defaults=dict(
                title="Careers | Home Health Care in Columbus, Ohio",
                breadcrumb_label="Careers",
                seo_title="Careers | Home Health Care in Columbus, Ohio",
                meta_description="Join our dedicated team at Divine Solutions Healthcare LLC.",
                hero_heading="Careers",
                hero_image=media("careers_caregiver_smiling_8.jpeg", "caregiver smiling"),
                status="published",
            ),
        )
        careers.sections.all().delete()
        PageSection.objects.create(
            page=careers, section_type="intro", sort_order=1,
            body="Join our dedicated team at Divine Solutions Healthcare LLC, where your passion for helping "
                 "others can make a difference. Explore exciting career opportunities and complete the form to "
                 "start your journey with us today!",
        )
        PageSection.objects.create(
            page=careers, section_type="contact_form", sort_order=2,
            data={"form": "careers"},
        )

        self.stdout.write("Seeding Resources page + resources...")
        resources_page, _ = Page.objects.update_or_create(
            slug="home-health-care-resources",
            defaults=dict(
                title="Resources | Home Health Care in Columbus, Ohio",
                breadcrumb_label="Resources",
                seo_title="Resources | Home Health Care in Columbus, Ohio",
                meta_description="Helpful home health care resources from Divine Solutions Healthcare LLC.",
                hero_heading="Resources",
                hero_image=media("resources_caregiver_and_senior_smiling_8.jpeg", "caregiver and senior smiling"),
                status="published",
            ),
        )
        resources_page.sections.all().delete()
        PageSection.objects.create(page=resources_page, section_type="resource_list", sort_order=1)
        Resource.objects.all().delete()
        for i, (title, url) in enumerate(RESOURCES):
            Resource.objects.create(title=title, external_url=url, status="published", sort_order=i)

        self.stdout.write("Seeding Contact Us page...")
        contact, _ = Page.objects.update_or_create(
            slug="home-health-care-contact-us",
            defaults=dict(
                title="Contact Us | Home Health Care in Columbus, Ohio",
                breadcrumb_label="Contact Us",
                seo_title="Contact Us | Home Health Care in Columbus, Ohio",
                meta_description="Get in touch with Divine Solutions Healthcare LLC.",
                hero_heading="Contact Us",
                hero_image=media("contact_caregiver_calling_on_telephone_8.jpeg", "caregiver calling on telephone"),
                status="published",
            ),
        )
        contact.sections.all().delete()
        PageSection.objects.create(
            page=contact, section_type="contact_form", sort_order=1,
            heading="Get In Touch",
            body="We\u2019re here to answer your questions and provide support. Whether you need more "
                 "information about our services or have specific inquiries, complete the form, and our "
                 "team will get back to you promptly!",
            data={"form": "contact"},
        )
        PageSection.objects.create(
            page=contact, section_type="office_info", sort_order=2,
            heading="Contact Our North Dakota Office",
            body="If you have questions about our services or would like to learn how we can support you or "
                 "your loved one, please contact our North Dakota office. Our team is here to help.",
            data={
                "addresses": [
                    {"label": "Fargo Office", "address": "Brandt Office Park, 3523 45th St S, suit 100, Fargo, ND 58104."},
                    {"label": "Registered Address", "address": "5497 28th Ave S Apt 2013, Fargo, ND 58104."},
                ],
                "phones": ["(701) 306-9293", "614-571-2711", "614-999-3840"],
            },
        )

        self.stdout.write("Seeding Privacy Policy page...")
        privacy, _ = Page.objects.update_or_create(
            slug="privacy-policy",
            defaults=dict(
                title="Privacy Policy",
                breadcrumb_label="Privacy Policy",
                seo_title="Privacy Policy | Divine Solutions Healthcare LLC",
                meta_description="Privacy Policy for Divine Solutions Healthcare LLC.",
                hero_heading="Privacy Policy",
                status="published",
            ),
        )
        privacy.sections.all().delete()
        PageSection.objects.create(
            page=privacy, section_type="text", sort_order=1, heading="Our Commitment to Your Privacy",
            body="Divine Solutions Healthcare LLC is committed to protecting the privacy of the individuals and "
                 "families we serve. Information submitted through this website \u2014 including contact forms "
                 "and career applications \u2014 is used solely to respond to your inquiry and is not sold or "
                 "shared with third parties for marketing purposes. This page is managed through the site's "
                 "content management system; please contact us directly with any questions about how your "
                 "information is handled.",
        )

        self.stdout.write("Seeding stub destination pages (linked from source, full page not supplied)...")
        for slug, title, text in STUB_LINKS:
            p, _ = Page.objects.update_or_create(
                slug=slug,
                defaults=dict(
                    title=title,
                    breadcrumb_label=title,
                    hero_heading=title,
                    hero_subheading=text,
                    status="published",
                ),
            )
            p.sections.all().delete()
            PageSection.objects.create(
                page=p, section_type="cta", sort_order=1, body=text,
                cta_text="Contact Us", cta_link="/home-health-care-contact-us",
            )

        self.stdout.write("Seeding default admin users...")
        if not User.objects.filter(username="superadmin").exists():
            u = User.objects.create_superuser("superadmin", "admin@divinesolutions.care", "ChangeMe123!")
            AdminProfile.objects.update_or_create(user=u, defaults={"role": "super_admin"})
            self.stdout.write(self.style.WARNING(
                "Created superadmin / ChangeMe123!  -- change this password immediately."
            ))
        if not User.objects.filter(username="contentadmin").exists():
            u = User.objects.create_user("contentadmin", "content@divinesolutions.care", "ChangeMe123!", is_staff=True)
            AdminProfile.objects.update_or_create(user=u, defaults={"role": "content_admin"})
            self.stdout.write(self.style.WARNING(
                "Created contentadmin / ChangeMe123!  -- change this password immediately."
            ))

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
