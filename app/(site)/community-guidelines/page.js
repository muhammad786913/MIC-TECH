import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Community guidelines",
  description: "How readers can comment, disagree and report content on MIC TECH without harming others.",
  path: "/community-guidelines",
});

export default function CommunityGuidelinesPage() {
  return (
    <LegalPage
      eyebrow="Community"
      title="Community guidelines"
      updated="6 November 2026"
      intro="MIC TECH comments are for discussion, not abuse. These guidelines explain what we expect from readers and how moderation works."
      sections={[
        {
          heading: "Be civil",
          body: [
            "Disagree with ideas, not people. Attack the argument, not the person making it. Harassment, threats, hate speech and targeted abuse are not allowed.",
          ],
        },
        {
          heading: "Stay on topic",
          body: [
            "Keep comments relevant to the story. Off-topic threads, repeated spam and promotional links may be removed without notice.",
          ],
        },
        {
          heading: "Do not post harmful content",
          list: [
            "No incitement to violence, terrorism or self-harm.",
            "No sexual content involving minors, or non-consensual intimate imagery.",
            "No doxxing, private addresses, phone numbers or financial details.",
            "No malware, phishing or deceptive links.",
          ],
        },
        {
          heading: "Respect privacy",
          body: [
            "Do not identify victims, minors or private individuals without consent. Public figures have less expectation of privacy in matters relevant to their public role, but that is not a licence for abuse.",
          ],
        },
        {
          heading: "No manipulation",
          body: [
            "Do not use multiple accounts, coordinated posting or automation to amplify a view, manipulate engagement or evade a ban. Impersonating another person or outlet is prohibited.",
          ],
        },
        {
          heading: "Moderation",
          body: [
            "Comments may be reviewed before publication. Moderators can approve, hide or remove content, and can suspend accounts for serious or repeated breaches.",
            "We aim to apply these rules consistently, but moderation involves judgement. If you think a decision was wrong, use the report option or contact us.",
          ],
        },
        {
          heading: "Reporting",
          body: [
            "Use the report action on a comment to flag abuse. Reports are reviewed by the newsroom. False or retaliatory reports may themselves be treated as abuse.",
          ],
        },
        {
          heading: "Appeals",
          body: [
            "If your account is restricted, you may appeal by contacting support@mictech.news with your username and the reason for the restriction. We will review the decision and reply where possible.",
          ],
        },
      ]}
      footer={
        <p>
          These guidelines sit alongside our{" "}
          <Link href="/terms" className="link-gold font-semibold">
            terms of service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="link-gold font-semibold">
            privacy policy
          </Link>
          . Serious safety concerns should go to{" "}
          <a href="mailto:support@mictech.news" className="link-gold font-semibold">
            support@mictech.news
          </a>
          .
        </p>
      }
    />
  );
}
