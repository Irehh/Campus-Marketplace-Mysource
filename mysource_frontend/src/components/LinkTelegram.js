"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaTelegram } from "react-icons/fa";
import { FiX, FiCheck } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const LinkTelegram = () => {
  const { user, token, updateProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      await axios.post("/api/telegram/verify-link", { code }, { headers: { Authorization: `Bearer ${token}` } });
      await updateProfile({});
      toast.success("Telegram account linked successfully!");
      setCode("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to link account. Check the code and try again.");
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
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <label htmlFor="code" className="label">
          Telegram Linking Code
        </label>
        <input
          type="text"
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="input"
          required
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          1. Send /link to @{process.env.REACT_APP_TELEGRAM_BOT_USERNAME} in Telegram
          <br />
          2. Copy the 6-digit code you receive
          <br />
          3. Paste it here and submit
        </p>
      </div>
      <button type="submit" className="btn btn-primary flex items-center justify-center" disabled={loading}>
        <FaTelegram className="mr-2" />
        {loading ? "Verifying..." : "Link Telegram"}
      </button>
    </form>
  );
};

export default LinkTelegram;