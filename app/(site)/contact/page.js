import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LegalPage from "@/components/public/LegalPage";

export const metadata = buildMetadata({
  title: "Contact the newsroom",
  description: "Contact MIC TECH with news tips, corrections, feedback or partnership enquiries.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Talk to us"
      title="Contact the newsroom"
      intro="We read every message. For the fastest response, choose the address that matches your reason for writing."
      sections={[
        {
          heading: "Editorial and news tips",
          body: [
            "Send context, documents or story ideas to the newsroom. We protect confidential sources and will agree terms before publication.",
          ],
          list: ["Newsroom: newsroom@mictech.news", "Tips: tips@mictech.news"],
        },
        {
          heading: "Corrections and complaints",
          body: [
            "If a story is inaccurate, unfair or missing important context, tell us what is wrong and include a link. Our corrections policy explains the process.",
          ],
          list: ["Corrections: corrections@mictech.news"],
        },
        {
          heading: "Accounts, privacy and security",
          body: [
            "For help with a reader account, a data request or a security concern, contact the team responsible for the platform.",
          ],
          list: ["Reader support: support@mictech.news", "Privacy: privacy@mictech.news"],
        },
        {
          heading: "Advertising and partnerships",
          body: [
            "Sponsored content is always labelled. We do not allow advertisers to influence editorial coverage.",
          ],
          list: ["Partnerships: partners@mictech.news"],
        },
      ]}
      footer={
        <p>
          We aim to acknowledge editorial and corrections messages within two working days. Response
          times are not guaranteed. For urgent safety issues, include “URGENT” in the subject line.
          You can also read our <Link href="/privacy" className="link-gold font-semibold">privacy policy</Link>{" "}
          before sending personal information.
        </p>
      }
    />
  );
}
