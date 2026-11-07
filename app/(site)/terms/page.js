import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Terms of service",
  description: "The terms that govern your use of MIC TECH, reader accounts and community features.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of service"
      updated="6 November 2026"
      intro="These terms govern your use of MIC TECH. By reading, registering or interacting with the site you agree to them. If you do not agree, please do not use the service."
      sections={[
        {
          heading: "Using MIC TECH",
          body: [
            "You may read published journalism without an account. Creating an account lets you like, bookmark, comment and receive newsletters. You are responsible for activity carried out through your account.",
            "You must be at least 13 years old to register. If you are under 18, you should have permission from a parent or guardian.",
          ],
        },
        {
          heading: "Reader accounts",
          list: [
            "Provide accurate information and keep your password confidential.",
            "One account per person; do not share credentials or impersonate others.",
            "Tell us promptly if you believe your account has been compromised.",
            "We may suspend or remove accounts that breach these terms or our community guidelines.",
          ],
          body: [
            "You can delete your account at any time from Account → Security. Deletion removes your profile and interactions and anonymises your comments.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "You keep ownership of comments and other material you submit. By posting, you grant MIC TECH a non-exclusive licence to store, display, moderate and distribute that material on the service.",
            "You are responsible for what you post. Do not submit content you do not have the right to share, or content that is unlawful, harassing, defamatory or misleading.",
          ],
        },
        {
          heading: "Acceptable use",
          list: [
            "Do not scrape, overload or attempt to bypass security controls.",
            "Do not upload malware or attempt to gain unauthorised access.",
            "Do not use the service to harass, threaten or discriminate against others.",
            "Do not misrepresent sponsored or automated activity as independent editorial.",
          ],
        },
        {
          heading: "Journalism and liability",
          body: [
            "We work to be accurate and correct errors promptly, but the site is provided on an “as is” basis. To the extent permitted by law, MIC TECH is not liable for indirect or consequential loss arising from use of the service.",
            "Nothing in these terms limits rights you have under applicable consumer or data-protection law.",
          ],
        },
        {
          heading: "Third-party links",
          body: [
            "Stories may link to other websites. We are not responsible for their content, accuracy or privacy practices. Following an external link is at your own discretion.",
          ],
        },
        {
          heading: "Changes and governing law",
          body: [
            "We may update these terms as the service evolves and will revise the date above. Continued use after a change means you accept the updated terms.",
            "These terms are governed by the laws of Pakistan, without prejudice to mandatory protections in your country of residence.",
          ],
        },
      ]}
      footer={
        <p>
          Not sure whether something is allowed? Read our{" "}
          <Link href="/community-guidelines" className="link-gold font-semibold">
            community guidelines
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="link-gold font-semibold">
            contact the newsroom
          </Link>
          .
        </p>
      }
    />
  );
}
