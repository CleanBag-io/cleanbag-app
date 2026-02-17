import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - CleanBag",
  description: "Terms of Service for the CleanBag platform.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: 17 February 2026</p>

      <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900">1. About CleanBag</h2>
          <p className="mt-3">
            CleanBag is an online marketplace platform operated by <strong>Antonis D. Demetriou Enterprises Ltd</strong> (Registration No. HE364859), registered at Sapfous 7 Street, Aglantzia 1070, Nicosia, Cyprus (&quot;we&quot;, &quot;us&quot;, &quot;the Company&quot;).
          </p>
          <p className="mt-3">
            The platform connects delivery drivers (&quot;Drivers&quot;) with cleaning facilities (&quot;Cleaning Facilities&quot;) for the professional cleaning of food delivery bags. By using CleanBag, you agree to these Terms of Service (&quot;Terms&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">2. Eligibility</h2>
          <p className="mt-3">
            You must be at least 18 years old to create an account and use CleanBag. By registering, you confirm that you meet this age requirement and that the information you provide is accurate and complete.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">3. Account Registration</h2>
          <p className="mt-3">
            To use CleanBag, you must create an account by providing your name, email address, and a password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>
          <p className="mt-3">
            You may register as one of three roles: Driver, Cleaning Facility, or Company. You may only maintain one account per email address. We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">4. How CleanBag Works</h2>
          <h3 className="mt-4 text-lg font-medium text-gray-900">For Drivers</h3>
          <p className="mt-2">
            Drivers can browse cleaning facilities, view their locations and ratings, and book cleaning services for their delivery bags. Payment is collected at the time of booking. Cleaning facilities fulfil the service independently.
          </p>
          <h3 className="mt-4 text-lg font-medium text-gray-900">For Cleaning Facilities</h3>
          <p className="mt-2">
            Cleaning Facilities list their services on CleanBag and receive orders from Drivers. Facilities must accept, fulfil, and complete orders in a timely manner. Earnings are transferred to the Facility&apos;s connected Stripe account after order completion, minus the CleanBag commission.
          </p>
          <h3 className="mt-4 text-lg font-medium text-gray-900">For Companies</h3>
          <p className="mt-2">
            Companies (delivery service employers such as Wolt, Bolt, Foody, or staffing agencies) can associate with their Drivers to monitor fleet compliance and cleaning activity. Companies do not directly participate in transactions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">5. Pricing and Payments</h2>
          <p className="mt-3">
            The current price for a delivery bag cleaning service is <strong>&euro;4.50</strong> per clean. Prices are displayed before booking and may be updated with reasonable notice.
          </p>
          <p className="mt-3">
            All payments are processed securely through <strong>Stripe</strong>. CleanBag does not store your payment card details. By making a payment, you agree to Stripe&apos;s terms of service.
          </p>
          <p className="mt-3">
            CleanBag retains a commission on each transaction. The remaining amount is transferred to the Cleaning Facility upon order completion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">6. Cancellations and Refunds</h2>
          <p className="mt-3">
            <strong>Driver cancellations:</strong> Drivers may cancel a pending order before it is accepted by the Cleaning Facility. Cancelled orders are refunded automatically via Stripe.
          </p>
          <p className="mt-3">
            <strong>Quality issues:</strong> If you are dissatisfied with a cleaning service, please contact the Cleaning Facility directly in the first instance. If the issue cannot be resolved, contact us at{" "}
            <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
              support@cleanbag.io
            </a>{" "}
            and we will review your case. Refunds for quality issues are processed at our discretion through Stripe.
          </p>
          <p className="mt-3">
            <strong>Facility cancellations:</strong> If a Cleaning Facility cancels an accepted order, the Driver will receive an automatic full refund.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">7. CleanBag&apos;s Role</h2>
          <p className="mt-3">
            CleanBag is a marketplace platform that facilitates connections between Drivers and Cleaning Facilities. We do not perform cleaning services ourselves. The cleaning service is provided by independent Cleaning Facilities, and CleanBag is not responsible for the quality, timeliness, or outcome of any cleaning service.
          </p>
          <p className="mt-3">
            We do not guarantee the availability of Cleaning Facilities in any particular area or at any particular time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">8. User Conduct</h2>
          <p className="mt-3">You agree not to:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Provide false or misleading information during registration or use of the platform</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to access another user&apos;s account</li>
            <li>Interfere with or disrupt the platform&apos;s operation</li>
            <li>Circumvent the payment system to transact outside of CleanBag</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">9. Intellectual Property</h2>
          <p className="mt-3">
            All content on the CleanBag platform, including the name, logo, design, and software, is the property of Antonis D. Demetriou Enterprises Ltd and is protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of the platform without our written consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">10. Limitation of Liability</h2>
          <p className="mt-3">
            To the maximum extent permitted by law, CleanBag and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of revenue, data, or business opportunities.
          </p>
          <p className="mt-3">
            Our total liability for any claim arising from your use of the platform shall not exceed the total amount you have paid through CleanBag in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">11. Termination</h2>
          <p className="mt-3">
            You may close your account at any time by contacting us at{" "}
            <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
              support@cleanbag.io
            </a>
            . We may suspend or terminate your account if you violate these Terms or if we determine, at our sole discretion, that continued use poses a risk to the platform or other users.
          </p>
          <p className="mt-3">
            Upon termination, any pending orders will be cancelled and refunded. Outstanding payouts to Cleaning Facilities will be processed within a reasonable timeframe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">12. Changes to These Terms</h2>
          <p className="mt-3">
            We may update these Terms from time to time. If we make material changes, we will notify you by email or through a notice on the platform. Your continued use of CleanBag after any changes constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">13. Governing Law and Disputes</h2>
          <p className="mt-3">
            These Terms are governed by and construed in accordance with the laws of the Republic of Cyprus. Any disputes arising from or relating to these Terms or your use of CleanBag shall be subject to the exclusive jurisdiction of the courts of Cyprus.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">14. Contact Us</h2>
          <p className="mt-3">
            If you have any questions about these Terms, please contact us:
          </p>
          <ul className="mt-2 space-y-1">
            <li><strong>Email:</strong>{" "}
              <a href="mailto:support@cleanbag.io" className="text-brand-pink hover:text-brand-pink-dark">
                support@cleanbag.io
              </a>
            </li>
            <li><strong>Company:</strong> Antonis D. Demetriou Enterprises Ltd (HE364859)</li>
            <li><strong>Address:</strong> Sapfous 7 Street, Aglantzia 1070, Nicosia, Cyprus</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
