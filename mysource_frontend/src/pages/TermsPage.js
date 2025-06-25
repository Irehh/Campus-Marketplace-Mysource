import PageHeader from "../components/PageHeader";

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="Terms of Service" />

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <p className="text-sm text-secondary-500 mb-4">Last updated: June 25, 2025</p>

        <section className="prose prose-secondary max-w-none">
          <p className="mb-4">
            Welcome to <strong>Mysource Campus Marketplace</strong> ("Mysource," "we," "us," or "our"), a Progressive Web App (PWA) accessible at{" "}
            <a href="https://mysource.ng/" className="text-primary-500 hover:underline">
              https://mysource.ng/
            </a>
            . By accessing or using our platform, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with these Terms, please do not use our platform. These Terms govern your use of Mysource as a buyer, seller, or visitor, whether you are a registered user or not.
          </p>

          <p className="mb-4">
            Mysource is a marketplace designed to connect Nigerian campus communities for buying and selling new and used goods, services, and gigs. We aim to provide a safe, convenient, and reliable space for students and others to trade within Nigeria. As a one-man startup, we are committed to solving problems for the campus community, but we rely on your cooperation to ensure the platform operates smoothly.
          </p>

          <p className="mb-4">
            Please read these Terms carefully. For updates to these Terms, check our social media channels or visit{" "}
            <a href="https://mysource.ng/about" className="text-primary-500 hover:underline">
              https://mysource.ng/about
            </a>
            . If you have questions, contact us at{" "}
            <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">
              admin@mysource.ng
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">1. Definitions</h2>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Platform</strong>: Refers to the Mysource Campus Marketplace PWA, accessible at <a href="https://mysource.ng/" className="text-primary-500 hover:underline">https://mysource.ng/</a>, including all features, services, and content.</li>
            <li><strong>User</strong>: Any individual who accesses or uses the Platform, whether as a buyer, seller, or visitor, registered or unregistered.</li>
            <li><strong>Registered User</strong>: A User who creates an account on the Platform.</li>
            <li><strong>Content</strong>: Any text, images, videos, reviews, or other material posted or shared on the Platform or our social media channels.</li>
            <li><strong>Goods</strong>: New or used physical items listed for sale on the Platform.</li>
            <li><strong>Services</strong>: Non-physical offerings, such as tutoring, freelance gigs, or other tasks listed on the Platform.</li>
            <li><strong>Campus Community</strong>: Primarily students, faculty, and staff of Nigerian tertiary institutions, though the Platform is open to all eligible Users in Nigeria.</li>
            <li><strong>Admin</strong>: The platform owner (the sole proprietor of Mysource) or appointed affiliates managing specific campuses.</li>
            <li><strong>Payment Gateway</strong>: Third-party services, such as Paystack, used to process payments on the Platform.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. Eligibility</h2>
          <p className="mb-4">2.1. <strong>Age Restriction</strong>: You must be at least 18 years old to use the Platform. By using Mysource, you confirm you meet this age requirement. Users under 18 are not permitted to access or use the Platform.</p>
          <p className="mb-4">2.2. <strong>Nigerian Users Only</strong>: The Platform is exclusively for Users located in Nigeria. By using Mysource, you confirm you are accessing the Platform from within Nigeria.</p>
          <p className="mb-4">2.3. <strong>Campus Community Focus</strong>: While the Platform targets the campus community (students, faculty, and staff of Nigerian tertiary institutions), it is open to all eligible Nigerian Users who comply with these Terms.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">3. Platform Overview</h2>
          <p className="mb-4">3.1. <strong>Purpose</strong>: Mysource is a marketplace for buying and selling new or used Goods, Services, and gigs within Nigeria. It functions as a PWA installable on devices, offering features like listings, messaging, and payment processing.</p>
          <p className="mb-4">3.2. <strong>Role of Mysource</strong>: We provide a platform to connect buyers and sellers. Unless explicitly stated, Mysource does not own, sell, or guarantee the Goods or Services listed. Transactions are primarily between Users, though we may facilitate payments or act as a middleman in some cases.</p>
          <p className="mb-4">3.3. <strong>Registration</strong>:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Users may browse the Platform without registering, but certain features (e.g., listing Goods/Services, messaging, or making payments) require a registered account.</li>
            <li>To register, you must provide accurate information, such as your name, email, and phone number. You are responsible for keeping your account details secure and updated.</li>
          </ul>
          <p className="mb-4">3.4. <strong>Seller Information</strong>: Sellers’ contact details are displayed on the product or service details page. Buyers may contact sellers directly or via Platform messaging.</p>
          <p className="mb-4">3.5. <strong>Affiliates/Admins</strong>: Mysource may appoint affiliates or campus-specific Admins to manage operations, act as middlemen, or facilitate transactions. These Admins are authorized to represent Mysource in resolving disputes or coordinating activities.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">4. User Responsibilities</h2>
          <p className="mb-4">4.1. <strong>Compliance with Laws</strong>: You agree to use the Platform in compliance with all applicable laws.</p>
          <p className="mb-4">4.2. <strong>Prohibited Items and Activities</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You may not list, sell, or buy Goods or Services that are illegal in Nigeria, including but not limited to alcohol, drugs, weapons, counterfeit items.</li>
              <li>You may not engage in fraudulent activities, scams, or misrepresentation of Goods/Services.</li>
              <li>Inappropriate Content, such as offensive, defamatory, or copyrighted material, is prohibited.</li>
            </ul>
          <p className="mb-4">4.3. <strong>Accurate Information</strong>: You must provide truthful and accurate information in your account, listings, and communications. Misleading descriptions or false claims about Goods/Services are prohibited.</p>
          <p className="mb-4">4.4. <strong>Transaction Responsibilities</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Buyers and sellers are responsible for agreeing on transaction terms (e.g., price, delivery, condition of Goods).</li>
              <li>Users may arrange delivery independently, but Mysource offers delivery services as an option.</li>
              <li>If using the Platform’s payment system, buyers must complete payments promptly, and sellers must deliver Goods/Services as agreed.</li>
            </ul>
          <p className="mb-4">4.5. <strong>Account Security</strong>: You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a> if you suspect unauthorized access.</p>
          <p className="mb-4">4.6. <strong>Respectful Conduct</strong>: You agree to interact respectfully with other Users, Admins, and the Mysource team. Harassment, abusive language, or discriminatory behavior is prohibited.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">5. Payments and Fees</h2>
          <p className="mb-4">5.1. <strong>Payment Processing</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mysource facilitates payments through third-party gateways like Paystack. Payments are processed securely and credited to the seller’s dashboard, minus any applicable fees.</li>
              <li>Users may also arrange payments directly (e.g., cash or third-party apps), but Mysource is not responsible for disputes arising from off-Platform payments.</li>
            </ul>
          <p className="mb-4">5.2. <strong>Fees</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mysource may charge fees for certain services, such as listing Goods/Services, transaction processing, or delivery. Any applicable fees will be disclosed at the time of the transaction.</li>
              <li>Payment gateway fees (e.g., Paystack charges) may apply and will be deducted from the seller’s payout.</li>
            </ul>
          <p className="mb-4">5.3. <strong>Refunds and Disputes</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>If a transaction goes wrong, contact us at <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a> within 7 days of the issue. We will review the matter and, if necessary, mediate between the buyer and seller to find a solution within 2 months.</li>
              <li>Refunds are subject to the agreement between the buyer and seller and the nature of the issue (e.g., non-delivery, defective Goods). Mysource does not guarantee refunds for transactions conducted outside our payment system.</li>
            </ul>
          <p className="mb-4">5.4. <strong>Escrow/Middleman Role</strong>: In some cases, Mysource or its appointed Admins may act as a middleman or escrow, holding payments until the buyer confirms receipt of Goods/Services. This service is subject to additional terms and fees, if applicable.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">6. Delivery</h2>
          <p className="mb-4">6.1. <strong>User-Arranged Delivery</strong>: Buyers and sellers may coordinate delivery independently. Mysource is not responsible for delays, damages, or losses in such cases.</p>
          <p className="mb-4">6.2. <strong>Mysource Delivery Service</strong>: If you use our delivery service, we will coordinate with trusted partners to deliver Goods. Delivery fees and timelines will be communicated at the time of the transaction.</p>
          <p className="mb-4">6.3. <strong>Delivery Disputes</strong>: Report delivery issues to <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a> within 48 hours of the expected delivery date. We will investigate and work with both parties to resolve the issue within 2 months.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">7. Content and Intellectual Property</h2>
          <p className="mb-4">7.1. <strong>User Content</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You retain ownership of any Content you post on the Platform (e.g., product photos, descriptions, reviews).</li>
              <li>By posting Content, you grant Mysource a non-exclusive, royalty-free license to use, display, and reproduce your Content on the Platform and our social media channels for promotional purposes.</li>
            </ul>
          <p className="mb-4">7.2. <strong>Prohibited Content</strong>: You may not post Content that is offensive, defamatory, obscene, or infringes on third-party rights (e.g., copyrighted material).</p>
          <p className="mb-4">7.3. <strong>Mysource Content</strong>: All content created by Mysource, including logos, designs, and text, is our property and may not be used without our written permission.</p>
          <p className="mb-4">7.4. <strong>Removal of Content</strong>: We reserve the right to remove any Content that violates these Terms or is deemed inappropriate, at our sole discretion.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">8. Data Privacy</h2>
          <p className="mb-4">8.1. <strong>Data Collection</strong>: We collect information you provide, such as your name, email, phone number, and payment details, to operate the Platform and process transactions.</p>
          <p className="mb-4">8.2. <strong>Data Use</strong>: We use your data to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Facilitate transactions and communication.</li>
              <li>Improve the Platform’s functionality.</li>
              <li>Send updates or promotional messages (with your consent).</li>
            </ul>
          <p className="mb-4">8.3. <strong>Data Sharing</strong>: We do not share your personal data with third parties except:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>With payment gateways (e.g., Paystack) to process payments.</li>
              <li>With delivery partners to fulfill orders.</li>
              <li>As required by law or to protect our legal rights.</li>
            </ul>
          <p className="mb-4">8.4. <strong>Data Security</strong>: We take reasonable measures to protect your data but cannot guarantee absolute security. You use the Platform at your own risk.</p>
          <p className="mb-4">8.5. <strong>Privacy Policy</strong>: For more details, refer to our Privacy Policy at <a href="https://mysource.ng/about" className="text-primary-500 hover:underline">https://mysource.ng/about</a> (if available) or contact us at <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a>.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">9. Liability and Disclaimers</h2>
          <p className="mb-4">9.1. <strong>As-Is Basis</strong>: The Platform is provided “as-is” without warranties of any kind, express or implied, including fitness for a particular purpose or uninterrupted access.</p>
          <p className="mb-4">9.2. <strong>No Liability for User Transactions</strong>:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Mysource is not responsible for the quality, safety, or legality of Goods/Services listed or sold.</li>
              <li>We are not liable for disputes, losses, or damages arising from transactions, especially those conducted outside our payment or delivery systems.</li>
            </ul>
          <p className="mb-4">9.3. <strong>No Warranties</strong>: Unless explicitly stated, Mysource does not provide warranties or guarantees for Goods/Services. Buyers and sellers assume all risks associated with their transactions.</p>
          <p className="mb-4">9.4. <strong>Limitation of Liability</strong>: To the fullest extent permitted by Nigerian law, Mysource, its owner, and affiliates shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
          <p className="mb-4">9.5. <strong>Third-Party Services</strong>: We are not responsible for the performance of third-party services (e.g., Paystack, delivery partners) integrated with the Platform.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">10. Dispute Resolution</h2>
          <p className="mb-4">10.1. <strong>Mediation</strong>: Disputes between Users or between Users and Mysource will be resolved through mediation. Contact us at <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a> to initiate mediation. We aim to resolve disputes within 2 months from the date the issue is reported.</p>
          <p className="mb-4">10.2. <strong>Admin Resolution</strong>: The platform owner or an appointed Admin will act as a mediator to facilitate a fair resolution. Their decision is final, subject to applicable laws.</p>
          <p className="mb-4">10.3. <strong>Governing Law</strong>: These Terms are governed by the laws of the Federal Republic of Nigeria. Any legal disputes shall be resolved in the courts of Nigeria.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">11. Account Termination</h2>
          <p className="mb-4">11.1. <strong>User Termination</strong>: You may deactivate your account by contacting us at <a href="mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a>.</p>
          <p className="mb-4">11.2. <strong>Mysource Termination</strong>: We may suspend or terminate your account, at our discretion, for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Violation of these Terms.</li>
              <li>Fraudulent or illegal activity.</li>
              <li>Posting inappropriate Content.</li>
              <li>Failure to comply with payment or delivery obligations.</li>
            </ul>
          <p className="mb-4">11.3. <strong>Effect of Termination</strong>: Upon termination, you lose access to your account, and any pending transactions may be canceled. You remain liable for any obligations incurred prior to termination.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">12. Updates to Terms</h2>
          <p className="mb-4">12.1. <strong>Changes</strong>: We may update these Terms to reflect changes in our operations, features, or legal requirements. Updates will be posted on our social media channels or at <a href="https://mysource.ng/about" className="text-primary-500 hover:underline">https://mysource.ng/about</a>.</p>
          <p className="mb-4">12.2. <strong>Notification</strong>: By continuing to use the Platform after updates, you agree to the revised Terms. Check our social media channels or website regularly for changes.</p>

          <h2 className="text-xl font-semibold mt-6 mb-4">13. Miscellaneous</h2>
          <p className="mb-4">13.1. <strong>No Affiliation</strong>: Mysource is not affiliated with any Nigerian tertiary institution or campus unless explicitly stated.</p>
          <p className="mb-4">13.2. <strong>Force Majeure</strong>: We are not liable for delays or failures in performance due to events beyond our control, such as natural disasters, government actions, or internet outages.</p>
          <p className="mb-4">13.3. <strong>Severability</strong>: If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions remain in effect.</p>
          <p className="mb-4">13.4. <strong>Entire Agreement</strong>: These Terms constitute the entire agreement between you and you, usuperseding any prior agreements or understandings.</p>
          <p className="mb-4">13.5. <strong>Contact</strong>: For questions, complaints, complaints, or support, reach us at <a href="mailto:mailto:admin@mysource.ng" className="text-primary-500 hover:underline">admin@mysource.ng</a> or visit <a href="https://mysource.ng/about" className="text-primary-500 hover:underline">https://mysource.ng/about</a>.</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">14. Acknowledgment</h2>
          <p className="mb-4">
              By using Mysource Campus Marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms. We are a one-man startup dedicated to serving the Nigerian campus community, and we appreciate your support in making this platform a safe and vibrant marketplace for buying and selling—connecting a campus community. Let’s build a trusted space for Nigerians—by Nigerians, for Nigerians.
          </p>

        </section>
      </div>
    </div>
  );
};

export default TermsPage;