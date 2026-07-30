import { LegalLayout, Section, Bullets } from "./LegalLayout";

export default function Cookies() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="What we store in your browser, why it is needed, and how you can control it."
      updated="July 2026"
    >
      <Section heading="What we store">
        <p>
          SMMSAAS uses cookies and browser storage (localStorage) to keep you signed in and to
          remember your workspace preferences. We keep this footprint deliberately small.
        </p>
      </Section>

      <Section heading="Categories we use">
        <Bullets
          items={[
            "Essential — authentication session tokens that keep you signed in and protect against request forgery. The product does not work without these.",
            "Preferences — theme (dark or light), sidebar state, saved views, selected account, and onboarding progress.",
            "Demo mode — a single flag that marks a guest session so demo data stays isolated from real accounts.",
            "Operational — short-lived values used for OAuth flows when connecting a social channel.",
          ]}
        />
      </Section>

      <Section heading="Third-party cookies">
        <p>
          When you connect a social channel, that platform's own sign-in page may set its own cookies
          during the authorization step. Those cookies are governed by that platform's policy, not
          ours.
        </p>
      </Section>

      <Section heading="Managing cookies">
        <p>
          You can clear or block cookies and site storage in your browser settings at any time.
          Blocking essential cookies will sign you out and prevent the dashboard from loading. Signing
          out of SMMSAAS clears the session token, and leaving demo mode clears the guest flag.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If we introduce new categories of cookies, such as analytics or marketing, we will update
          this page and ask for consent where required.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about cookies:{" "}
          <a className="text-primary hover:underline" href="mailto:privacy@smmsaas.app">
            privacy@smmsaas.app
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}
