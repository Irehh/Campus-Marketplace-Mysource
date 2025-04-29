import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader"

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader title="About Us" />

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
        <p className="mb-4">
          Campus Marketplace is dedicated to creating a safe, convenient, and efficient platform for students and campus
          communities to buy, sell, and discover products and services within their local campus environment.
        </p>
        <p className="mb-4">
          We believe in empowering students to make the most of their resources, reduce waste through reuse and
          recycling, and build stronger campus communities through local commerce.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Our Story</h2>
        <p className="mb-4">
          Campus Marketplace was founded in 2023 by a group of university students who recognized the need for a
          dedicated platform to connect buyers and sellers within campus communities.
        </p>
        <p className="mb-4">
          What started as a simple idea has grown into a comprehensive marketplace serving multiple universities across
          the country, helping thousands of students find what they need without leaving campus.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Our Values</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Community First:</strong> We prioritize the needs and safety of campus communities.
          </li>
          <li>
            <strong>Sustainability:</strong> We promote reuse and recycling to reduce waste.
          </li>
          <li>
            <strong>Accessibility:</strong> We strive to make our platform accessible to all students.
          </li>
          <li>
            <strong>Innovation:</strong> We continuously improve our platform based on user feedback.
          </li>
          <li>
            <strong>Trust:</strong> We build trust through transparency and reliable service.
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <p className="text-secondary-600">
          Have questions?{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AboutPage
