import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Corrections policy",
  description: "How to report an error in MIC TECH journalism and how we correct, clarify and update stories.",
  path: "/corrections",
});

export default function CorrectionsPage() {
  return (
    <LegalPage
      eyebrow="Accountability"
      title="Corrections policy"
      updated="6 November 2026"
      intro="Journalism should be accurate, and when it is not, the fix should be visible. This page explains how to report an error and how we respond."
      sections={[
        {
          heading: "How to report an error",
          body: [
            "Email corrections@mictech.news with a link to the story, the specific passage you believe is wrong, and any supporting evidence. If your concern is urgent, say so in the subject line.",
            "We aim to acknowledge corrections within two working days. Complex complaints may take longer; we will explain the next step.",
          ],
        },
        {
          heading: "What counts as a correction",
          list: [
            "A factual error, including a wrong name, number, date or attribution.",
            "A quote that was materially misrepresented.",
            "A headline or image that creates a false impression.",
            "Omitted context that materially changes the meaning of a story.",
          ],
        },
        {
          heading: "How we correct",
          body: [
            "Corrections are made at the foot of the story with a clear note explaining what was wrong and what changed. Material errors may also be noted on the homepage or in a dedicated corrections log.",
            "We do not silently change facts. Minor style or grammar edits that do not change meaning may be made without a note.",
          ],
        },
        {
          heading: "Clarifications and updates",
          body: [
            "When a story is accurate but could be misunderstood, we add a clarification. When new information develops a running story, we update it and note the time of the latest revision.",
          ],
        },
        {
          heading: "Deletions and unpublishing",
          body: [
            "We rarely remove stories. We may unpublish content where it creates a serious safety risk, breaches a legal obligation or was published in error. Where a story is removed, we aim to explain why without exposing private information.",
          ],
        },
        {
          heading: "Right of reply",
          body: [
            "If you are the subject of a story and believe it is inaccurate or unfair, tell us. We will consider your response and, where appropriate, add it to the story or publish a follow-up.",
          ],
        },
      ]}
      footer={
        <p>
          Corrections contact:{" "}
          <a href="mailto:corrections@mictech.news" className="link-gold font-semibold">
            corrections@mictech.news
          </a>
          . Read our{" "}
          <Link href="/editorial-policy" className="link-gold font-semibold">
            editorial standards
          </Link>{" "}
          for how we verify and label content.
        </p>
      }
    />
  );
}
