"use client"
import { FiClipboard, FiInfo, FiCheck } from "react-icons/fi"
import { FaTelegram } from "react-icons/fa"

const TelegramSetupGuide = () => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <FaTelegram className="text-blue-500 text-4xl mr-3" />
          <h1 className="text-2xl font-bold">Telegram Bot Setup Guide</h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
            <div>
              <p className="text-blue-700 font-medium">What you'll need</p>
              <ul className="text-blue-600 text-sm mt-1 list-disc ml-4">
                <li>Your backend server running locally</li>
                <li>ngrok installed on your computer</li>
                <li>A Telegram bot (create one with @BotFather on Telegram)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Step 1: Install ngrok</h2>
            <p className="mb-3">
              If you haven't installed ngrok yet, download it from{" "}
              <a
                href="https://ngrok.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                ngrok.com/download
              </a>{" "}
              and follow their setup instructions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Step 2: Start your backend server</h2>
            <p className="mb-2">
              Make sure your backend server is running locally, typically at{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5000</code>
            </p>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm">
              <div className="flex justify-between items-center">
                <code>cd mysource_backend</code>
                <button
                  onClick={() => copyToClipboard("cd mysource_backend")}
                  className="text-gray-400 hover:text-white"
                >
                  <FiClipboard />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <code>npm run dev</code>
                <button onClick={() => copyToClipboard("npm run dev")} className="text-gray-400 hover:text-white">
                  <FiClipboard />
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Step 3: Start ngrok to expose your backend</h2>
            <p className="mb-2">
              Open a new terminal and run the following command to create a secure tunnel to your backend:
            </p>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm">
              <div className="flex justify-between items-center">
                <code>ngrok http 5000</code>
                <button onClick={() => copyToClipboard("ngrok http 5000")} className="text-gray-400 hover:text-white">
                  <FiClipboard />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              This will display a forwarding URL like{" "}
              <code className="bg-gray-100 px-1 rounded">https://abc123.ngrok.io</code> which makes your local server
              accessible from the internet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Step 4: Update your Telegram bot webhook</h2>
            <p className="mb-2">
              Use the ngrok URL to set up your Telegram bot webhook. You need to connect your backend (not frontend) to
              Telegram:
            </p>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm">
              <p className="text-gray-400 mb-1"># Replace with your actual bot token and ngrok URL</p>
              <div className="flex justify-between items-center">
                <code>
                  curl -F "url=https://83e3-102-90-45-166.ngrok-free.app/api/telegram/webhook" https://api.telegram.org/bot
                  {"{YOUR_BOT_TOKEN}"}/setWebhook
                </code>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `curl -F "url=https://your-ngrok-url.ngrok.io/api/telegram/webhook" https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook`,
                    )
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <FiClipboard />
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Step 5: Update your environment variables</h2>
            <p className="mb-2">Ensure your backend .env file has the following Telegram-related configurations:</p>
            <div className="bg-gray-800 text-gray-200 p-4 rounded-md font-mono text-sm">
              <div className="text-gray-200">
                <div>ENABLE_TELEGRAM=true</div>
                <div>TELEGRAM_USE_POLLING=false</div>
                <div>TELEGRAM_BOT_TOKEN=your_telegram_bot_token</div>
                <div>TELEGRAM_BOT_USERNAME=your_bot_username</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Step 6: Test your Telegram bot integration</h2>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" size={20} />
                <div>
                  <p className="text-green-700 font-medium">Your setup is complete when:</p>
                  <ul className="text-green-600 mt-2 space-y-2 text-sm">
                    <li className="flex items-start">
                      <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span>You can link your Telegram account in the app profile section</span>
                    </li>
                    <li className="flex items-start">
                      <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span>Users receive notifications via Telegram when they get new messages</span>
                    </li>
                    <li className="flex items-start">
                      <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span>Users can search and post products via Telegram bot commands</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <p className="text-sm text-gray-600">
              <strong>Important:</strong> The ngrok URL changes every time you restart ngrok (unless you have a paid
              account). You'll need to update your webhook URL whenever you restart ngrok.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              For production, you should set up the webhook using your actual deployed backend URL, not ngrok.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TelegramSetupGuide

