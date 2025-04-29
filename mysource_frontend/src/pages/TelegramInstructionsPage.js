
import { FaTelegram } from "react-icons/fa"
import { FiCheck, FiInfo, FiMessageSquare, FiSearch, FiImage } from "react-icons/fi"

const TelegramInstructionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <FaTelegram className="text-blue-500 text-4xl mr-3" />
          <h1 className="text-2xl font-bold">How to Use Our Telegram Bot</h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
            <div>
              <p className="text-blue-700 font-medium">Before you begin</p>
              <p className="text-blue-600 text-sm mt-1">
                You need to start a conversation with our bot by searching for <strong>@YourBotUsername</strong> on
                Telegram and sending the <strong>/start</strong> command.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FiMessageSquare className="mr-2 text-primary" />
              Getting Started
            </h2>
            <div className="ml-8 space-y-4">
              <div className="flex">
                <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Search for our bot</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Open Telegram and search for <strong>@YourBotUsername</strong>
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Start the bot</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Send the <code className="bg-gray-100 px-1 rounded">/start</code> command to initialize the bot
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Link your account</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Go to your profile on Campus Marketplace and link your Telegram account
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FiSearch className="mr-2 text-primary" />
              Searching for Products
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <FiSearch className="text-blue-500" size={24} />
                </div>
                <div>
                  <p className="font-medium">Simply send a text message</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Type what you're looking for and send it to the bot. For example:
                  </p>
                  <div className="bg-white p-2 rounded border mt-2 text-sm">
                    <p>laptop</p>
                    <p className="text-xs text-gray-500 mt-1">
                      This will search for laptops in your campus marketplace
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <FiImage className="mr-2 text-primary" />
              Posting Products
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <FiImage className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="font-medium">Send a photo with description</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Send a photo with a caption describing your product. You can include the price like this:
                  </p>
                  <div className="bg-white p-2 rounded border mt-2 text-sm">
                    <p>HP Laptop, barely used, comes with charger and case</p>
                    <p>Price: 45000</p>
                    <p className="text-xs text-gray-500 mt-1">
                      This will create a product listing with the price set to ₦45,000
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What You'll Receive</h2>
            <div className="space-y-3 ml-8">
              <div className="flex items-start">
                <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm">Notifications when someone sends you a message</p>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm">Updates when your products receive comments</p>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm">Reminders about unread messages</p>
              </div>
              <div className="flex items-start">
                <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm">Important announcements from your campus marketplace</p>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> You can disable Telegram notifications at any time from your profile settings or
              messages page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TelegramInstructionsPage

