import PageHeader from "../components/PageHeader"

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Privacy Policy" />

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <p className="text-sm text-gray-500 mb-4">Last updated: April 30, 2023</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="mb-3">
            Campus Marketplace ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our website and mobile
            application (collectively, the "Platform").
          </p>
          <p>
            Please read this Privacy Policy carefully. By accessing or using the Platform, you acknowledge that you have
            read, understood, and agree to be bound by this Privacy Policy.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

          <h3 className="text-lg font-medium mb-2">2.1 Personal Information</h3>
          <p className="mb-3">We may collect personal information that you voluntarily provide, including:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Name, email address, and password when you register</li>
            <li>Profile information such as campus, phone number, and profile picture</li>
            <li>Messages sent through our platform</li>
            <li>Product and business listings you create</li>
            <li>Transaction information</li>
          </ul>

          <h3 className="text-lg font-medium mb-2">2.2 Automatically Collected Information</h3>
          <p className="mb-3">When you access our Platform, we automatically collect:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Device information (type, operating system, browser)</li>
            <li>IP address and location data</li>
            <li>Usage data and browsing history on our Platform</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Provide, maintain, and improve our Platform</li>
            <li>Process transactions and send related information</li>
            <li>Send administrative messages and updates</li>
            <li>Respond to your comments and questions</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect and prevent fraudulent or unauthorized activities</li>
            <li>Personalize your experience</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="mb-3">
            We implement appropriate technical and organizational measures to protect your personal information.
            However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
          <p className="mb-3">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 mb-3 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to our processing of your information</li>
            <li>Request restriction of processing</li>
            <li>Request data portability</li>
            <li>Withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{" "}
            <a href="mailto:privacy@campusmarketplace.ng" className="text-primary hover:underline">
              privacy@campusmarketplace.ng
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The updated version will be indicated by an updated
            "Last Updated" date. We encourage you to review this Privacy Policy frequently.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@campusmarketplace.ng" className="text-primary hover:underline">
              privacy@campusmarketplace.ng
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
