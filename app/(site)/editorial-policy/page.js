import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Editorial standards",
  description: "How MIC TECH reports, verifies, labels opinion and sponsored content, and handles corrections.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <LegalPage
      eyebrow="Newsroom standards"
      title="Editorial standards"
      updated="6 November 2026"
      intro="These standards describe how MIC TECH gathers, verifies and presents journalism. They apply to every desk and every format, including text, video, data and social."
      sections={[
        {
          heading: "Accuracy and verification",
          body: [
            "We verify claims before publication using primary documents, named sources and independent confirmation. Where verification is incomplete, we say so clearly rather than implying certainty.",
            "Sourcing is described as precisely as safety allows. Anonymous sources are used only when the information is in the public interest and the source is known to the editor.",
          ],
        },
        {
          heading: "Independence",
          body: [
            "Editorial decisions are made by the newsroom. Advertisers, sponsors and political actors do not see stories before publication and cannot change editorial coverage.",
            "Any financial interest, gift or relationship that could affect a story is disclosed to an editor and, where relevant, to readers.",
          ],
        },
        {
          heading: "News, analysis and opinion",
          body: [
            "News reporting separates verified fact from interpretation. Analysis explains context and is labelled. Opinion reflects the author’s view and is clearly marked as opinion.",
            "Headlines and standfirsts must be supported by the body of the story. We do not use misleading framing for attention.",
          ],
        },
        {
          heading: "Sponsored content and partnerships",
          body: [
            "Paid content is labelled “Sponsored” or “Partner content” at the top of the story and in navigation where practical. It is visually distinct from editorial.",
            "Newsroom staff do not write sponsored content without disclosure, and sponsorship does not confer approval over editorial coverage.",
          ],
        },
        {
          heading: "Fairness and privacy",
          body: [
            "People and organisations facing criticism are given a fair opportunity to respond, unless doing so would create a risk of harm or defeat the purpose of the story.",
            "We consider the public interest before publishing private information. We avoid identifying victims, minors and bystanders unless there is a clear editorial justification.",
          ],
        },
        {
          heading: "Corrections and updates",
          body: [
            "When we get something wrong we correct it promptly and transparently. Corrections note what changed and when. Significant updates are explained at the foot of the story.",
            "The full process is described in our corrections policy. To raise a concern, email corrections@mictech.news.",
          ],
        },
        {
          heading: "Use of AI and automation",
          body: [
            "Automation may assist with transcription, translation or data processing, but published journalism is reviewed by an editor. We do not publish AI-generated text as reporting without human verification and disclosure where material.",
          ],
        },
        {
          heading: "Complaints",
          body: [
            "Readers can complain about accuracy, fairness or conduct. We aim to acknowledge complaints within two working days and to explain the outcome. This does not replace any legal right you may have.",
          ],
        },
      ]}
      footer={
        <p>
          Related:{" "}
          <Link href="/corrections" className="link-gold font-semibold">
            Corrections policy
          </Link>{" "}
          ·{" "}
          <Link href="/community-guidelines" className="link-gold font-semibold">
            Community guidelines
          </Link>{" "}
          ·{" "}
          <Link href="/about" className="link-gold font-semibold">
            About MIC TECH
          </Link>
          .
        </p>
      }
    />
  );
}
