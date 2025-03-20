"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaTelegram } from "react-icons/fa";
import { FiX, FiCheck } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const LinkTelegram = () => {
  const { user, token, updateProfile } = useAuth();
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleLink = async (e) => {
    e.preventDefault();
    if (!telegramId.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        "/api/telegram/link",
        { telegramId: telegramId.startsWith("@") ? telegramId : `@${telegramId}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(
        `Verification code sent! Check @${process.env.REACT_APP_TELEGRAM_BOT_USERNAME} and send /link <code>`
      );
      setTelegramId("");
    } catch (error) {
      toast.error("Failed to send code. Start the bot first by messaging @" + process.env.REACT_APP_TELEGRAM_BOT_USERNAME);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Telegram account?")) return;

    setDisconnecting(true);
    try {
      await axios.post("/api/auth/unlink-telegram", {}, { headers: { Authorization: `Bearer ${token}` } });
      await updateProfile({});
      toast.success("Telegram account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Telegram account");
    } finally {
      setDisconnecting(false);
    }
  };

  if (user?.telegramChatId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center text-green-600">
          <FaTelegram className="mr-2" />
          <span>Telegram linked: @{user.telegramId || "Connected"}</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="flex items-center text-red-500 hover:text-red-700 text-sm"
        >
          <FiX className="mr-1" />
          {disconnecting ? "Disconnecting..." : "Disconnect Telegram"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLink} className="space-y-4">
      <div>
        <label htmlFor="telegramId" className="label">
          Telegram Username
        </label>
        <input
          type="text"
          id="telegramId"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          placeholder="e.g. @username"
          className="input"
          required
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          1. Start a chat with @{process.env.REACT_APP_TELEGRAM_BOT_USERNAME} using /start
          <br />
          2. Enter your Telegram username above
          <br />
          3. Send the code you receive with /link &lt;code&gt;
        </p>
      </div>
      <button type="submit" className="btn btn-primary flex items-center justify-center" disabled={loading}>
        <FaTelegram className="mr-2" />
        {loading ? "Sending..." : "Link Telegram"}
      </button>
    </form>
  );
};

export default LinkTelegram;