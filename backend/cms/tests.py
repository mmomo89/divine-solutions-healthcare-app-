from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Page, PageDraft, PageSection


class PageDraftWorkflowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="cms-test-admin",
            password="TestPassword-OnlyForTests-123!",
            is_staff=True,
        )
        self.page = Page.objects.create(
            slug="draft-test-page",
            title="Original published title",
            status="published",
        )
        self.client = APIClient()
        self.url = f"/api/pages/{self.page.slug}/draft/"

    def valid_content(self, title="Draft title"):
        return {
            "title": title,
            "breadcrumb_label": "",
            "seo_title": "",
            "meta_description": "",
            "og_image": None,
            "hero_image": None,
            "hero_heading": "",
            "hero_subheading": "",
            "status": "published",
            "sections": [
                {
                    "section_type": "intro",
                    "heading": "Draft introduction",
                    "subheading": "",
                    "body": "Draft body text",
                    "image": None,
                    "cta_text": "",
                    "cta_link": "",
                    "anchor_id": "",
                    "data": {},
                    "is_visible": True,
                    "sort_order": 0,
                }
            ],
        }

    def test_anonymous_user_cannot_read_draft(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_saving_draft_does_not_change_published_page(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.put(
            self.url,
            {"content": self.valid_content()},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.page.refresh_from_db()
        self.assertEqual(self.page.title, "Original published title")
        self.assertEqual(self.page.status, "published")
        self.assertTrue(PageDraft.objects.filter(page=self.page).exists())
        self.assertEqual(self.page.sections.count(), 0)

    def test_invalid_draft_is_rejected(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.put(
            self.url,
            {"content": {"title": "Incomplete draft"}},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.page.refresh_from_db()
        self.assertEqual(self.page.title, "Original published title")

    def test_publishing_saved_draft_updates_page_and_sections(self):
        self.client.force_authenticate(user=self.user)
        content = self.valid_content("Published from draft")

        save_response = self.client.put(
            self.url,
            {"content": content},
            format="json",
        )
        self.assertEqual(save_response.status_code, 200)

        publish_response = self.client.post(
            f"/api/pages/{self.page.slug}/publish-draft/",
            {},
            format="json",
        )

        self.assertEqual(publish_response.status_code, 200)
        self.page.refresh_from_db()
        self.assertEqual(self.page.title, "Published from draft")
        self.assertEqual(self.page.status, "published")
        self.assertEqual(self.page.sections.count(), 1)
        self.assertEqual(
            self.page.sections.first().heading,
            "Draft introduction",
        )
        self.assertFalse(PageDraft.objects.filter(page=self.page).exists())
