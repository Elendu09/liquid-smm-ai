import { LegalLayout, Section, Bullets } from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The agreement between you and SMMSAAS covering accounts, acceptable use, billing, and responsibilities."
      updated="July 2026"
    >
      <Section heading="Accepting these terms">
        <p>
          By creating an account or using SMMSAAS, you agree to these terms. If you are accepting on
          behalf of a company, you confirm you are authorized to bind that company.
        </p>
      </Section>

      <Section heading="Your account">
        <Bullets
          items={[
            "You are responsible for the accuracy of your account details and for keeping credentials secure.",
            "Workspace owners and admins control who can invite, remove, and edit team members.",
            "You are responsible for activity carried out under your account, including actions taken by teammates you invite.",
          ]}
        />
      </Section>

      <Section heading="Acceptable use">
        <p>You agree not to use SMMSAAS to:</p>
        <Bullets
          items={[
            "Publish unlawful, deceptive, harassing, or infringing content.",
            "Violate the terms, rate limits, or automation policies of any connected social platform.",
            "Send spam, run engagement schemes, or artificially inflate metrics.",
            "Attempt to breach, reverse engineer, or disrupt the service or other customers' data.",
          ]}
        />
        <p>
          We may suspend accounts that put the service, connected platforms, or other customers at
          risk.
        </p>
      </Section>

      <Section heading="Your content">
        <p>
          You keep ownership of the content you upload or create. You grant us the limited rights
          needed to store, process, and publish that content to the channels you connect, so the
          product can do what you ask of it.
        </p>
      </Section>

      <Section heading="AI features and credits">
        <p>
          AI assistance — captions, hashtags, summaries, remixes, and voice — consumes credits from
          your workspace balance. AI output can be inaccurate; review generated content before
          publishing. You remain responsible for anything you post.
        </p>
      </Section>

      <Section heading="Plans, billing, and credits">
        <Bullets
          items={[
            "Paid plans renew automatically for the billing period you selected until cancelled.",
            "Credit top-ups are applied to your balance when the billing event is confirmed.",
            "Fees are charged in advance and are non-refundable except where required by law.",
            "You can cancel at any time; access continues to the end of the current billing period.",
          ]}
        />
      </Section>

      <Section heading="Third-party platforms">
        <p>
          Connected social networks are independent services with their own terms and APIs. Changes,
          outages, or policy decisions on their side can affect scheduling, publishing, and
          analytics, and are outside our control.
        </p>
      </Section>

      <Section heading="Availability and disclaimers">
        <p>
          We work to keep SMMSAAS reliable, but the service is provided "as is" without warranties of
          any kind. We do not guarantee uninterrupted availability, specific growth outcomes, or that
          every scheduled action will be accepted by a third-party platform.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, our aggregate liability arising from your use of
          SMMSAAS is limited to the amount you paid us in the twelve months before the claim. We are
          not liable for indirect, incidental, or consequential damages, including lost profits or
          lost data.
        </p>
      </Section>

      <Section heading="Termination">
        <p>
          You may stop using the service at any time. We may suspend or terminate accounts that
          breach these terms or create legal or security risk. On termination, your right to use the
          service ends and workspace data is handled as described in the Privacy Policy.
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          We may update these terms as the product evolves. Material changes will be reflected in the
          date above and communicated in the product before they take effect.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms:{" "}
          <a className="text-primary hover:underline" href="mailto:legal@smmsaas.app">
            legal@smmsaas.app
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}
