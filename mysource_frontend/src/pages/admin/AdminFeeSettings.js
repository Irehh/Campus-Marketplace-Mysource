"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import api from "../../utils/api"
import toast from "react-hot-toast"
import { FiSettings, FiSave, FiRefreshCw } from "react-icons/fi"

const AdminFeeSettings = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feeConfig, setFeeConfig] = useState({
    basePercentage: 5,
    minimumFee: 50,
    maximumFee: 1000,
    campusDiscounts: {},
    freeThreshold: 10000,
  })

  useEffect(() => {
    // Redirect if not super admin
    if (user && user.role !== "SUPER_ADMIN") {
      toast.error("You don't have permission to access this page")
      navigate("/admin/dashboard")
      return
    }

    fetchFeeConfig()
  }, [user, navigate])

  const fetchFeeConfig = async () => {
    try {
      const response = await api.get("/fees/config")
      if (response.data.success) {
        setFeeConfig(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching fee config:", error)
      toast.error("Failed to load fee configuration")
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (field, value) => {
    setFeeConfig((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCampusDiscountChange = (campus, discount) => {
    setFeeConfig((prev) => ({
      ...prev,
      campusDiscounts: {
        ...prev.campusDiscounts,
        [campus]: Number.parseFloat(discount) || 0,
      },
    }))
  }

  const saveFeeConfig = async () => {
    setSaving(true)

    try {
      const response = await api.put("/fees/config", {
        config: feeConfig,
      })

      if (response.data.success) {
        toast.success("Fee configuration updated successfully")
      }
    } catch (error) {
      console.error("Error saving fee config:", error)
      toast.error(error.response?.data?.message || "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset to default settings?")) {
      setFeeConfig({
        basePercentage: 5,
        minimumFee: 50,
        maximumFee: 1000,
        campusDiscounts: {},
        freeThreshold: 10000,
      })
    }
  }

  const calculatePreviewFee = (amount) => {
    const percentage = feeConfig.basePercentage / 100
    let fee = amount * percentage

    // Apply minimum and maximum
    fee = Math.max(fee, feeConfig.minimumFee)
    fee = Math.min(fee, feeConfig.maximumFee)

    // Check free threshold
    if (amount >= feeConfig.freeThreshold) {
      fee = 0
    }

    return fee
  }

  const campuses = ["unilag", "uniben", "ui", "oau", "uniport"]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FiSettings className="mr-2" />
            Platform Fee Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure platform fees for transactions</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FiRefreshCw className="mr-2" size={16} />
            Reset to Defaults
          </button>
          <button
            onClick={saveFeeConfig}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Configuration */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Fee Structure</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={feeConfig.basePercentage}
                onChange={(e) => handleConfigChange("basePercentage", Number.parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Percentage of transaction amount</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Fee (₦)</label>
              <input
                type="number"
                min="0"
                value={feeConfig.minimumFee}
                onChange={(e) => handleConfigChange("minimumFee", Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum fee charged regardless of percentage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Fee (₦)</label>
              <input
                type="number"
                min="0"
                value={feeConfig.maximumFee}
                onChange={(e) => handleConfigChange("maximumFee", Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum fee cap for large transactions</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Threshold (₦)</label>
              <input
                type="number"
                min="0"
                value={feeConfig.freeThreshold}
                onChange={(e) => handleConfigChange("freeThreshold", Number.parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Transactions above this amount are fee-free</p>
            </div>
          </div>
        </div>

        {/* Campus Discounts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Campus-Specific Discounts</h2>

          <div className="space-y-3">
            {campuses.map((campus) => (
              <div key={campus}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{campus} Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={feeConfig.campusDiscounts[campus] || 0}
                  onChange={(e) => handleCampusDiscountChange(campus, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Campus discounts are applied as percentage reductions to the calculated fee.
            </p>
          </div>
        </div>

        {/* Fee Preview */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Fee Preview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1000, 5000, 15000].map((amount) => (
              <div key={amount} className="border rounded-md p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Transaction Amount</p>
                  <p className="text-lg font-semibold">₦{amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2">Platform Fee</p>
                  <p className="text-lg font-semibold text-primary">₦{calculatePreviewFee(amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((calculatePreviewFee(amount) / amount) * 100).toFixed(2)}% of transaction
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>How fees are calculated:</strong>
            </p>
            <ol className="text-sm text-gray-600 mt-2 list-decimal list-inside space-y-1">
              <li>Calculate {feeConfig.basePercentage}% of transaction amount</li>
              <li>Apply minimum fee of ₦{feeConfig.minimumFee} if calculated fee is lower</li>
              <li>Apply maximum fee cap of ₦{feeConfig.maximumFee} if calculated fee is higher</li>
              <li>Apply campus-specific discounts if applicable</li>
              <li>Set fee to ₦0 if transaction is above ₦{feeConfig.freeThreshold.toLocaleString()}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFeeSettings
