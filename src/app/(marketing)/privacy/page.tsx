import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - CleanBag",
  description: "Privacy Policy for the CleanBag platform. GDPR-compliant data processing information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: 17 February 2026</p>

      <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. Data Controller</h2>
          <p className="mt-3">
            The data controller for the CleanBag platform is:
          </p>
          <ul className="mt-2 space-y-1">
            <li><strong>Company:</strong> Antonis D. Demetriou Enterprises Ltd</li>
            <li><strong>Registration No.:</strong> HE364859</li>
            <li><strong>Address:</strong> Sapfous 7 Street, Aglantzia 1070, Nicosia, Cyprus</li>
            <li><strong>Email:</strong>{" "}
              <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
                support@cleanbag.io
              </a>
            </li>
            <li><strong>Data Protection Contact:</strong> Antonis D. Demetriou</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. What Data We Collect</h2>
          <p className="mt-3">
            We collect the following personal data when you use CleanBag:
          </p>

          <h3 className="mt-4 text-lg font-medium text-gray-900">Data you provide directly</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Account information:</strong> Full name, email address, password</li>
            <li><strong>Profile information:</strong> Phone number, city, vehicle type (Drivers), business name and address (Cleaning Facilities), company name (Companies)</li>
            <li><strong>Payment information:</strong> Payment card details are collected and processed by Stripe. We do not store your card details on our servers.</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-gray-900">Data collected automatically</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Usage data:</strong> Pages visited, features used, and interactions with the platform (via Vercel Analytics)</li>
            <li><strong>Device information:</strong> Browser type, operating system, and screen size</li>
            <li><strong>Location data:</strong> Cleaning facility addresses are geocoded (converted to map coordinates) using Google Maps to display facility locations on maps</li>
          </ul>

          <h3 className="mt-4 text-lg font-medium text-gray-900">Data generated through use</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Order history:</strong> Cleaning orders, dates, amounts, and status</li>
            <li><strong>Compliance data:</strong> Last cleaning date, compliance status, cleaning frequency</li>
            <li><strong>Ratings:</strong> Star ratings given to Cleaning Facilities</li>
            <li><strong>Notifications:</strong> In-app and push notification preferences and history</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Data</h2>
          <p className="mt-3">We process your personal data for the following purposes:</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-gray-900">Purpose</th>
                <th className="pb-2 font-semibold text-gray-900">Legal Basis (GDPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4">Providing the CleanBag marketplace service</td>
                <td className="py-2">Performance of contract</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Processing payments and payouts</td>
                <td className="py-2">Performance of contract</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Sending order updates and notifications</td>
                <td className="py-2">Performance of contract</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Tracking cleaning compliance</td>
                <td className="py-2">Legitimate interest</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Displaying facility locations on maps</td>
                <td className="py-2">Legitimate interest</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Improving the platform (analytics)</td>
                <td className="py-2">Legitimate interest</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Sending push notifications</td>
                <td className="py-2">Consent</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. Data Sharing and Third-Party Processors</h2>
          <p className="mt-3">
            We do not sell your personal data. We share data only with the following service providers who process data on our behalf:
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-semibold text-gray-900">Provider</th>
                <th className="pb-2 pr-4 font-semibold text-gray-900">Purpose</th>
                <th className="pb-2 font-semibold text-gray-900">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 pr-4">Supabase</td>
                <td className="py-2 pr-4">Database, authentication, real-time features</td>
                <td className="py-2">United States</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Stripe</td>
                <td className="py-2 pr-4">Payment processing and payouts</td>
                <td className="py-2">United States</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Vercel</td>
                <td className="py-2 pr-4">Website hosting and analytics</td>
                <td className="py-2">United States</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Google Maps</td>
                <td className="py-2 pr-4">Address geocoding and map display</td>
                <td className="py-2">United States</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3">
            These providers are based in the United States and comply with applicable data protection standards, including EU Standard Contractual Clauses (SCCs) for international data transfers.
          </p>
          <p className="mt-3">
            <strong>Data visible to other users:</strong> Cleaning Facility names, addresses, cities, and ratings are visible to Drivers. Driver names and compliance status are visible to their associated Company. Order details are shared between the Driver and the Cleaning Facility involved in the transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Data Retention</h2>
          <p className="mt-3">
            We retain your personal data for as long as your account is active and as needed to provide our services. If you request account deletion, we will delete your personal data within <strong>30 days</strong>, except where we are required to retain certain data for legal or regulatory purposes (such as transaction records for tax compliance).
          </p>
          <p className="mt-3">
            Order and transaction records may be retained for up to 6 years after account deletion to comply with Cyprus tax regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Your Rights (GDPR)</h2>
          <p className="mt-3">
            Under the General Data Protection Regulation (GDPR), you have the following rights:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Right of access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Right to rectification:</strong> Request correction of inaccurate or incomplete data</li>
            <li><strong>Right to erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Right to restrict processing:</strong> Request that we limit how we use your data</li>
            <li><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Right to object:</strong> Object to processing based on legitimate interest</li>
            <li><strong>Right to withdraw consent:</strong> Withdraw consent for push notifications at any time through your browser or device settings</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
              support@cleanbag.io
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. Cookies and Tracking</h2>
          <p className="mt-3">
            CleanBag uses only essential cookies required for the platform to function:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Authentication cookies:</strong> To keep you logged in to your account (managed by Supabase Auth)</li>
          </ul>
          <p className="mt-3">
            We use <strong>Vercel Analytics</strong> for privacy-friendly usage analytics. Vercel Analytics does not use cookies and does not track individual users across sites.
          </p>
          <p className="mt-3">
            We do not use advertising cookies, social media trackers, or any third-party marketing tools.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. Data Security</h2>
          <p className="mt-3">
            We implement appropriate technical and organisational measures to protect your personal data, including:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Encryption in transit (HTTPS/TLS) for all data transfers</li>
            <li>Encryption at rest for database storage</li>
            <li>Row-level security (RLS) policies ensuring users can only access their own data</li>
            <li>Secure password hashing (managed by Supabase Auth)</li>
            <li>Payment data handled exclusively by PCI DSS-compliant Stripe</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
          <p className="mt-3">
            CleanBag is not intended for use by anyone under 18 years of age. We do not knowingly collect personal data from children. If we become aware that we have collected data from a person under 18, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. International Data Transfers</h2>
          <p className="mt-3">
            Your data may be transferred to and processed in the United States by our service providers (Supabase, Stripe, Vercel, Google). These transfers are protected by EU Standard Contractual Clauses (SCCs) and other appropriate safeguards in accordance with GDPR Article 46.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Changes to This Policy</h2>
          <p className="mt-3">
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or through a notice on the platform. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. Supervisory Authority</h2>
          <p className="mt-3">
            If you believe that we have not adequately addressed your data protection concerns, you have the right to lodge a complaint with the:
          </p>
          <ul className="mt-2 space-y-1">
            <li><strong>Commissioner for the Protection of Personal Data</strong></li>
            <li>Address: 1 Iasonos Street, 1082, Nicosia, Cyprus</li>
            <li>
              Website:{" "}
              <a
                href="https://www.dataprotection.gov.cy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-pink hover:text-brand-pink-dark"
              >
                www.dataprotection.gov.cy
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">13. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:
          </p>
          <ul className="mt-2 space-y-1">
            <li><strong>Email:</strong>{" "}
              <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
                support@cleanbag.io
              </a>
            </li>
            <li><strong>Data Protection Contact:</strong> Antonis D. Demetriou</li>
            <li><strong>Company:</strong> Antonis D. Demetriou Enterprises Ltd (HE364859)</li>
            <li><strong>Address:</strong> Sapfous 7 Street, Aglantzia 1070, Nicosia, Cyprus</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
