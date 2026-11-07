import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "About MIC TECH",
  description: "MIC TECH is an independent digital newsroom covering Pakistan, world affairs, technology, business and culture.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="Who we are"
      title="About MIC TECH"
      intro="MIC TECH is an independent digital publication built for readers who want context, not noise. We report on the forces shaping Pakistan and the wider world — with precision, perspective and a clear separation between news and opinion."
      sections={[
        {
          heading: "Our mission",
          body: [
            "Good journalism helps people understand what is happening and why it matters. We prioritise verified reporting, plain language and the evidence behind every claim.",
            "We publish news, analysis, explainers and data-led stories across Pakistan, world affairs, business, technology, science, education, health, sport and culture.",
          ],
        },
        {
          heading: "How we work",
          body: [
            "Our editorial process is documented in our editorial standards. Every story is reviewed for accuracy, fairness and legal risk before publication. Sponsored content is labelled and kept visibly separate from editorial.",
            "We publish corrections when we get something wrong. Our corrections policy explains how to raise an issue and how we respond.",
          ],
        },
        {
          heading: "Independence",
          body: [
            "Editorial decisions are made by the newsroom, not by advertisers or political interests. Where funding or partnerships could create a conflict, we disclose it in the relevant story or on this page.",
          ],
        },
        {
          heading: "Technology and privacy",
          body: [
            "MIC TECH runs on a first-party publishing platform. We use privacy-respecting analytics that count visits without selling reader data. Read our privacy policy for the details.",
          ],
        },
      ]}
      footer={
        <p>
          For newsroom enquiries, corrections or partnership questions, write to{" "}
          <a href="mailto:newsroom@mictech.news" className="link-gold font-semibold">newsroom@mictech.news</a>.
        </p>
      }
    />
  );
}
