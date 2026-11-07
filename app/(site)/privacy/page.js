import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Privacy policy",
  description: "How MIC TECH collects, uses, stores and protects reader information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy"
      updated="6 November 2026"
      intro="This policy explains what MIC TECH collects when you read, register or interact with the site, why we collect it, and the choices you have."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "Reading does not require an account. If you create one, we store your name, username, email address, a salted password hash, optional profile details and your notification preferences.",
            "When you comment, like, bookmark or report content, we store the action and its timestamp so the feature works and so moderation can be audited.",
            "We collect first-party analytics such as page path, article identifier, referrer category, device type, approximate country and a random visitor identifier. We do not run third-party advertising trackers.",
          ],
        },
        {
          heading: "Cookies and local storage",
          body: [
            "We use an HttpOnly session cookie to keep you signed in and a random HttpOnly visitor cookie to count unique readers. These are first-party cookies, not advertising identifiers.",
            "You can clear cookies in your browser at any time. Clearing the session cookie signs you out; clearing the visitor cookie starts a new anonymous analytics session.",
          ],
        },
        {
          heading: "Why we use information",
          list: [
            "To provide accounts, comments, likes, bookmarks and newsletters you request.",
            "To moderate comments and keep the community safe.",
            "To understand which stories are read, in aggregate, and improve the site.",
            "To detect abuse, protect the service and meet legal obligations.",
          ],
          body: [
            "We do not sell reader data. We do not use your email address for advertising without your consent.",
          ],
        },
        {
          heading: "Retention",
          body: [
            "Account data is kept while the account exists. You can delete your account from Account → Security; this removes your profile, sessions, likes and bookmarks, and anonymises your comments.",
            "Analytics events are kept for the retention period configured in the newsroom settings. Operational logs and audit records are kept only as long as needed for security and accountability.",
          ],
        },
        {
          heading: "Sharing and processors",
          body: [
            "We use service providers for hosting, database, media storage and transactional email. They process data on our instructions. Where a provider stores data outside Pakistan, transfers rely on that provider’s safeguards.",
            "We may disclose information if required by law or to protect the rights and safety of readers, staff or the public.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can access and update your profile, change your password, export a copy of your account data by contacting us, and request deletion. Some records may be retained where the law requires it or to resolve disputes.",
            "To make a privacy request, email privacy@mictech.news. We may need to verify your identity before acting.",
          ],
        },
        {
          heading: "Children",
          body: [
            "MIC TECH is a general-audience news site and is not directed at children under 13. If you believe a child has created an account, contact us so we can remove it.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We will update this page when our practices change and revise the date above. Material changes will be highlighted on the site.",
          ],
        },
      ]}
      footer={
        <p>
          Controller: MIC TECH editorial team. Privacy contact:{" "}
          <a href="mailto:privacy@mictech.news" className="link-gold font-semibold">privacy@mictech.news</a>.
          This policy describes current practice; it is not a claim of zero risk. No online service can
          guarantee absolute security.
        </p>
      }
    />
  );
}
