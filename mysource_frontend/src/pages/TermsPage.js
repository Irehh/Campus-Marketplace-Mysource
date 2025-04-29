import PageHeader from "../components/PageHeader"

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Terms of Service" />

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <p className="text-sm text-secondary-500 mb-4">Last updated: May 1, 2023</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Campus Marketplace, you agree to be bound by these Terms of Service. If you do not
            agree to these Terms, you may not access or use our services.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">2. Eligibility</h2>
          <p className="mb-2">
            You must be at least 18 years old and a current student or staff member of a recognized educational
            institution to use our services.
          </p>
          <p>We reserve the right to request verification of your student or staff status at any time.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">3. User Accounts</h2>
          <p className="mb-2">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities
            that occur under your account.
          </p>
          <p>
            You agree to provide accurate and complete information when creating an account and to update your
            information as needed.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">4. User Content</h2>
          <p className="mb-2">
            You retain ownership of any content you post on our Platform, but you grant us a non-exclusive, royalty-free
            license to use, display, and distribute your content in connection with our services.
          </p>
          <p className="mb-2">You are solely responsible for the content you post and must not post content that:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Is illegal, harmful, threatening, abusive, or harassing</li>
            <li>Infringes on the rights of others</li>
            <li>Is false, misleading, or deceptive</li>
            <li>Contains malware or other harmful code</li>
            <li>Violates our Community Guidelines</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">5. Prohibited Items</h2>
          <p className="mb-2">The following items may not be listed or sold on our Platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Illegal items or services</li>
            <li>Weapons and dangerous items</li>
            <li>Alcohol, tobacco, and drugs</li>
            <li>Counterfeit or stolen goods</li>
            <li>Academic materials intended for cheating</li>
            <li>Adult content or services</li>
            <li>Personal information of others</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">6. Transactions</h2>
          <p className="mb-2">
            We are not a party to transactions between users. We do not guarantee the quality, safety, or legality of
            items listed or the ability of users to complete transactions.
          </p>
          <p>
            Users are responsible for complying with all applicable laws and regulations related to their transactions.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">7. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account and access to our services at any time, without
            notice, for any reason, including violation of these Terms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">8. Disclaimer of Warranties</h2>
          <p>
            Our services are provided "as is" and "as available" without warranties of any kind, either express or
            implied.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages resulting from your use of or inability to use our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Continued use of our services after any such changes constitutes your
            acceptance of the new Terms.
          </p>
        </section>
      </div>
    </div>
  )
}

export default TermsPage
