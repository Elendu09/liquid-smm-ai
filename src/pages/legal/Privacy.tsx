import { LegalLayout, Section, Bullets } from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How SMMSAAS collects, uses, and protects the information you and your team share with the platform."
      updated="July 2026"
    >
      <Section heading="Information we collect">
        <p>We collect only what the product needs to work for you:</p>
        <Bullets
          items={[
            "Account details you provide — name, email address, workspace name, and profile settings.",
            "Content you create in the app — captions, scheduled posts, media, templates, reports, and notes.",
            "Social platform data returned by channels you connect, such as profile handles, published posts, and engagement metrics.",
            "Technical data needed to operate the service — sign-in events, device and browser information, and error logs.",
          ]}
        />
      </Section>

      <Section heading="How we use your information">
        <Bullets
          items={[
            "To provide core features: scheduling, publishing, analytics, inbox, and automation.",
            "To generate AI assistance such as captions, hashtags, summaries, and voice replies when you request them.",
            "To secure accounts, prevent abuse, and troubleshoot issues you report.",
            "To send service and billing notices, plus any product updates you have opted into.",
          ]}
        />
        <p>We do not sell your personal information or your audience data.</p>
      </Section>

      <Section heading="Connected social accounts">
        <p>
          When you connect a channel, you authorize SMMSAAS through that platform's official OAuth
          flow. We store access tokens so scheduled actions can run on your behalf, and we request
          only the permissions the connected feature needs. You can disconnect any channel at any
          time from Settings, which revokes our stored tokens for that channel.
        </p>
      </Section>

      <Section heading="Demo mode">
        <p>
          Demo (guest) sessions run on sample data only. Guest sessions are read-only, are kept
          strictly separate from authenticated accounts, and never expose real customer data.
        </p>
      </Section>

      <Section heading="Storage, hosting, and security">
        <p>
          The application is built and hosted on Lovable Cloud, which provides the managed database,
          authentication, file storage, and serverless functions behind the product. Data is
          encrypted in transit, access to production data is restricted to authorized personnel, and
          database access rules scope records to the owning account. These are the platform and
          product controls we operate; they are not an independent certification.
        </p>
      </Section>

      <Section heading="Retention and deletion">
        <p>
          We keep your workspace content while your account is active. You can delete individual
          items at any time from within the app. When you close your account, we remove or anonymize
          associated workspace data, except records we must keep for billing, tax, or legal reasons.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can request access to, correction of, or deletion of your personal information, and you
          can ask for a copy of the content stored in your workspace. Contact us and we will respond
          within a reasonable timeframe.
        </p>
      </Section>

      <Section heading="Children">
        <p>SMMSAAS is intended for business use and is not directed at children under 16.</p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If we make material changes, we will update the date at the top of this page and notify
          account owners in the product.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Privacy questions and requests:{" "}
          <a className="text-primary hover:underline" href="mailto:privacy@smmsaas.app">
            privacy@smmsaas.app
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}
