const { Wallet, Transaction, User } = require("../models")
const { Op } = require("sequelize")
const axios = require("axios")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const { sendEmail } = require("../utils/emailUtils")
const logger = require("../utils/logger")

// Create a log directory if it doesn't exist
const logDir = path.join(__dirname, "../../logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Create a transaction log file
const transactionLogPath = path.join(logDir, "transactions.log")

// Function to log financial transactions
const logTransaction = (transaction) => {
  const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(transaction)}\n`
  fs.appendFileSync(transactionLogPath, logEntry)
  logger.info(`Transaction logged: ${transaction.type} - ${transaction.amount}`)
}

// Get user's wallet
exports.getWallet = async (req, res) => {
  const userId = req.user.id

  try {
    // Find or create wallet
    let wallet = await Wallet.findOne({
      where: { userId },
    })

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      })
    }

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 10,
    })

    res.json({
      wallet,
      recentTransactions,
    })
  } catch (error) {
    console.error("Error fetching wallet:", error)
    res.status(500).json({ message: "Failed to fetch wallet" })
  }
}

// Initialize deposit (generate Paystack payment link)
exports.initializeDeposit = async (req, res) => {
  const { amount } = req.body
  const userId = req.user.id

  try {
    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({ message: "Amount must be at least ₦100" })
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({
      where: { userId },
    })

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      })
    }

    // Generate a unique reference
    const reference = `dep_${Date.now()}_${userId}_${Math.floor(Math.random() * 1000000)}`

    // Create a pending transaction
    const transaction = await Transaction.create({
      type: "deposit",
      amount: Number.parseFloat(amount),
      status: "pending",
      reference,
      userId,
      walletId: wallet.id,
      description: "Wallet deposit",
    })

    // Initialize Paystack transaction
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount * 100, // Paystack amount is in kobo (100 kobo = 1 Naira)
        reference,
        callback_url: `${process.env.FRONTEND_URL}/wallet/verify-payment`,
        metadata: {
          userId,
          transactionId: transaction.id,
          type: "deposit",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    // Log the initialization
    logTransaction({
      type: "deposit_init",
      amount,
      userId,
      reference,
      timestamp: new Date().toISOString(),
    })

    res.json({
      transaction,
      authorization_url: response.data.data.authorization_url,
      reference,
    })
  } catch (error) {
    console.error("Error initializing deposit:", error)
    res.status(500).json({ message: "Failed to initialize deposit" })
  }
}

// Verify deposit (callback from Paystack)
exports.verifyDeposit = async (req, res) => {
  const { reference } = req.query

  try {
    // Verify the transaction with Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const { status, data } = response.data

    if (status && data.status === "success") {
      // Find the transaction
      const transaction = await Transaction.findOne({
        where: { reference },
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
      })

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" })
      }

      // Check if transaction is already processed
      if (transaction.status === "completed") {
        return res.json({
          message: "Transaction already processed",
          transaction,
        })
      }

      // Update transaction status
      await transaction.update({
        status: "completed",
        metadata: {
          ...transaction.metadata,
          paystack_reference: data.reference,
          paystack_transaction_id: data.id,
        },
      })

      // Update wallet balance
      const wallet = await Wallet.findByPk(transaction.walletId)
      await wallet.update({
        balance: wallet.balance + transaction.amount,
      })

      // Log the successful deposit
      logTransaction({
        type: "deposit_success",
        amount: transaction.amount,
        userId: transaction.userId,
        reference,
        timestamp: new Date().toISOString(),
      })

      // Send email notification
      try {
        await sendEmail({
          to: transaction.User.email,
          subject: "Deposit Successful",
          text: `Your deposit of ₦${transaction.amount} has been successfully processed and added to your wallet.`,
          html: `
            <h2>Deposit Successful!</h2>
            <p>Your deposit of <strong>₦${transaction.amount}</strong> has been successfully processed and added to your wallet.</p>
            <p>Transaction Reference: ${reference}</p>
            <p>Thank you for using Campus Marketplace!</p>
          `,
        })
      } catch (error) {
        console.error("Error sending email notification:", error)
        // Continue even if email fails
      }

      res.json({
        message: "Deposit successful",
        transaction,
      })
    } else {
      // Find the transaction
      const transaction = await Transaction.findOne({
        where: { reference },
      })

      if (transaction) {
        // Update transaction status
        await transaction.update({
          status: "failed",
          metadata: {
            ...transaction.metadata,
            paystack_reference: data.reference,
            paystack_transaction_id: data.id,
            failure_reason: data.gateway_response,
          },
        })
      }

      // Log the failed deposit
      logTransaction({
        type: "deposit_failed",
        reference,
        reason: data.gateway_response,
        timestamp: new Date().toISOString(),
      })

      res.status(400).json({
        message: "Deposit failed",
        reason: data.gateway_response,
      })
    }
  } catch (error) {
    console.error("Error verifying deposit:", error)
    res.status(500).json({ message: "Failed to verify deposit" })
  }
}

// Withdraw funds
exports.withdraw = async (req, res) => {
  const { amount, bankCode, accountNumber, accountName } = req.body
  const userId = req.user.id
  const WITHDRAWAL_FEE = 200 // Fixed fee of 200 Naira

  try {
    // Validate required fields
    if (!amount || !bankCode || !accountNumber || !accountName) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Validate amount
    if (amount < 1000) {
      return res.status(400).json({ message: "Minimum withdrawal amount is ₦1,000" })
    }

    // Calculate total amount with fee
    const totalAmount = Number.parseFloat(amount) + WITHDRAWAL_FEE

    // Find user's wallet
    const wallet = await Wallet.findOne({
      where: { userId },
    })

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" })
    }

    // Check if user has enough balance
    if (wallet.balance < totalAmount) {
      return res.status(400).json({
        message: `Insufficient funds. You need ₦${totalAmount} (including ₦${WITHDRAWAL_FEE} withdrawal fee)`,
        requiredAmount: totalAmount,
        currentBalance: wallet.balance,
        fee: WITHDRAWAL_FEE,
      })
    }

    // Generate a unique reference
    const reference = `wit_${Date.now()}_${userId}_${Math.floor(Math.random() * 1000000)}`

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      type: "withdrawal",
      amount: Number.parseFloat(amount),
      fee: WITHDRAWAL_FEE,
      status: "pending",
      reference,
      userId,
      walletId: wallet.id,
      description: "Wallet withdrawal",
      metadata: {
        bankCode,
        accountNumber,
        accountName,
      },
    })

    // Create fee transaction
    const feeTransaction = await Transaction.create({
      type: "withdrawal_fee",
      amount: WITHDRAWAL_FEE,
      status: "completed",
      userId,
      walletId: wallet.id,
      description: "Withdrawal fee",
      metadata: {
        withdrawalId: transaction.id,
      },
    })

    // Update wallet balance
    await wallet.update({
      balance: wallet.balance - totalAmount,
      lastWithdrawal: new Date(),
    })

    // In a real-world scenario, you would initiate a bank transfer here
    // For now, we'll simulate a successful withdrawal

    // Update transaction status
    await transaction.update({
      status: "completed",
    })

    // Log the withdrawal
    logTransaction({
      type: "withdrawal",
      amount: Number.parseFloat(amount),
      fee: WITHDRAWAL_FEE,
      userId,
      reference,
      bankDetails: {
        bankCode,
        accountNumber,
        accountName,
      },
      timestamp: new Date().toISOString(),
    })

    // Send email notification
    try {
      await sendEmail({
        to: req.user.email,
        subject: "Withdrawal Successful",
        text: `Your withdrawal of ₦${amount} has been processed. A fee of ₦${WITHDRAWAL_FEE} was deducted. The funds should arrive in your bank account within 1-3 business days.`,
        html: `
          <h2>Withdrawal Successful!</h2>
          <p>Your withdrawal of <strong>₦${amount}</strong> has been processed.</p>
          <p>A fee of <strong>₦${WITHDRAWAL_FEE}</strong> was deducted.</p>
          <p>The funds should arrive in your bank account (${accountName}, ${accountNumber}) within 1-3 business days.</p>
          <p>Transaction Reference: ${reference}</p>
          <p>Thank you for using Campus Marketplace!</p>
        `,
      })
    } catch (error) {
      console.error("Error sending email notification:", error)
      // Continue even if email fails
    }

    res.json({
      message: "Withdrawal successful",
      transaction,
      fee: feeTransaction,
    })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    res.status(500).json({ message: "Failed to process withdrawal" })
  }
}

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  const userId = req.user.id
  const { type, status, startDate, endDate, limit = 20, page = 1 } = req.query
  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

  const where = { userId }

  // Add filters
  if (type) where.type = type
  if (status) where.status = status
  if (startDate && endDate) {
    where.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    }
  } else if (startDate) {
    where.createdAt = {
      [Op.gte]: new Date(startDate),
    }
  } else if (endDate) {
    where.createdAt = {
      [Op.lte]: new Date(endDate),
    }
  }

  try {
    const transactions = await Transaction.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number.parseInt(limit),
      offset: skip,
    })

    const total = await Transaction.count({ where })

    res.json({
      transactions,
      pagination: {
        total,
        page: Number.parseInt(page),
        pageSize: Number.parseInt(limit),
        totalPages: Math.ceil(total / Number.parseInt(limit)),
      },
    })
  } catch (error) {
    console.error("Error fetching transaction history:", error)
    res.status(500).json({ message: "Failed to fetch transaction history" })
  }
}

// Get wallet summary (for dashboard)
exports.getWalletSummary = async (req, res) => {
  const userId = req.user.id

  try {
    // Find or create wallet
    let wallet = await Wallet.findOne({
      where: { userId },
    })

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      })
    }

    // Get transaction counts
    const pendingTransactions = await Transaction.count({
      where: {
        userId,
        status: "pending",
      },
    })

    const completedTransactions = await Transaction.count({
      where: {
        userId,
        status: "completed",
      },
    })

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 5,
    })

    // Calculate monthly earnings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyEarnings = await Transaction.sum("amount", {
      where: {
        userId,
        type: "release",
        status: "completed",
        createdAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    })

    res.json({
      wallet,
      pendingTransactions,
      completedTransactions,
      recentTransactions,
      monthlyEarnings: monthlyEarnings || 0,
    })
  } catch (error) {
    console.error("Error fetching wallet summary:", error)
    res.status(500).json({ message: "Failed to fetch wallet summary" })
  }
}

// Get bank list (for withdrawals)
exports.getBankList = async (req, res) => {
  try {
    // Fetch bank list from Paystack
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    res.json(response.data.data)
  } catch (error) {
    console.error("Error fetching bank list:", error)
    res.status(500).json({ message: "Failed to fetch bank list" })
  }
}

// Verify bank account
exports.verifyBankAccount = async (req, res) => {
  const { accountNumber, bankCode } = req.body

  try {
    // Validate required fields
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ message: "Account number and bank code are required" })
    }

    // Verify account with Paystack
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    )

    res.json(response.data.data)
  } catch (error) {
    console.error("Error verifying bank account:", error)

    if (error.response && error.response.data) {
      return res.status(error.response.status).json({
        message: error.response.data.message || "Failed to verify bank account",
      })
    }

    res.status(500).json({ message: "Failed to verify bank account" })
  }
}

// Webhook for Paystack events
exports.paystackWebhook = async (req, res) => {
  // Verify that the request is from Paystack
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex")

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ message: "Invalid signature" })
  }

  const event = req.body

  // Handle different event types
  switch (event.event) {
    case "charge.success":
      // Handle successful charge
      await handleSuccessfulCharge(event.data)
      break

    case "transfer.success":
      // Handle successful transfer (withdrawal)
      await handleSuccessfulTransfer(event.data)
      break

    case "transfer.failed":
      // Handle failed transfer (withdrawal)
      await handleFailedTransfer(event.data)
      break

    default:
      // Log unknown event
      console.log(`Unhandled Paystack event: ${event.event}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send("Webhook received")
}

// Helper function to handle successful charge
const handleSuccessfulCharge = async (data) => {
  try {
    const { reference, amount, metadata } = data

    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { reference },
    })

    if (!transaction) {
      console.error(`Transaction not found for reference: ${reference}`)
      return
    }

    // Check if transaction is already processed
    if (transaction.status === "completed") {
      console.log(`Transaction ${reference} already processed`)
      return
    }

    // Update transaction status
    await transaction.update({
      status: "completed",
      metadata: {
        ...transaction.metadata,
        paystack_data: data,
      },
    })

    // Update wallet balance
    const wallet = await Wallet.findByPk(transaction.walletId)
    await wallet.update({
      balance: wallet.balance + transaction.amount,
    })

    // Log the successful charge
    logTransaction({
      type: "deposit_success_webhook",
      amount: transaction.amount,
      userId: transaction.userId,
      reference,
      timestamp: new Date().toISOString(),
    })

    // Send email notification
    const user = await User.findByPk(transaction.userId)
    if (user) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Deposit Successful",
          text: `Your deposit of ₦${transaction.amount} has been successfully processed and added to your wallet.`,
          html: `
            <h2>Deposit Successful!</h2>
            <p>Your deposit of <strong>₦${transaction.amount}</strong> has been successfully processed and added to your wallet.</p>
            <p>Transaction Reference: ${reference}</p>
            <p>Thank you for using Campus Marketplace!</p>
          `,
        })
      } catch (error) {
        console.error("Error sending email notification:", error)
      }
    }
  } catch (error) {
    console.error("Error handling successful charge:", error)
  }
}

// Helper function to handle successful transfer
const handleSuccessfulTransfer = async (data) => {
  try {
    const { reference } = data

    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { reference },
    })

    if (!transaction) {
      console.error(`Transaction not found for reference: ${reference}`)
      return
    }

    // Check if transaction is already processed
    if (transaction.status === "completed") {
      console.log(`Transaction ${reference} already processed`)
      return
    }

    // Update transaction status
    await transaction.update({
      status: "completed",
      metadata: {
        ...transaction.metadata,
        paystack_data: data,
      },
    })

    // Log the successful transfer
    logTransaction({
      type: "withdrawal_success_webhook",
      amount: transaction.amount,
      userId: transaction.userId,
      reference,
      timestamp: new Date().toISOString(),
    })

    // Send email notification
    const user = await User.findByPk(transaction.userId)
    if (user) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Withdrawal Successful",
          text: `Your withdrawal of ₦${transaction.amount} has been successfully processed. The funds should arrive in your bank account within 1-3 business days.`,
          html: `
            <h2>Withdrawal Successful!</h2>
            <p>Your withdrawal of <strong>₦${transaction.amount}</strong> has been successfully processed.</p>
            <p>The funds should arrive in your bank account within 1-3 business days.</p>
            <p>Transaction Reference: ${reference}</p>
            <p>Thank you for using Campus Marketplace!</p>
          `,
        })
      } catch (error) {
        console.error("Error sending email notification:", error)
      }
    }
  } catch (error) {
    console.error("Error handling successful transfer:", error)
  }
}

// Helper function to handle failed transfer
const handleFailedTransfer = async (data) => {
  try {
    const { reference, reason } = data

    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { reference },
    })

    if (!transaction) {
      console.error(`Transaction not found for reference: ${reference}`)
      return
    }

    // Update transaction status
    await transaction.update({
      status: "failed",
      metadata: {
        ...transaction.metadata,
        paystack_data: data,
        failure_reason: reason,
      },
    })

    // Refund the amount to the user's wallet
    const wallet = await Wallet.findByPk(transaction.walletId)
    await wallet.update({
      balance: wallet.balance + transaction.amount + transaction.fee,
    })

    // Log the failed transfer
    logTransaction({
      type: "withdrawal_failed_webhook",
      amount: transaction.amount,
      userId: transaction.userId,
      reference,
      reason,
      timestamp: new Date().toISOString(),
    })

    // Send email notification
    const user = await User.findByPk(transaction.userId)
    if (user) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Withdrawal Failed",
          text: `Your withdrawal of ₦${transaction.amount} has failed. The funds have been returned to your wallet. Reason: ${reason}`,
          html: `
            <h2>Withdrawal Failed</h2>
            <p>Your withdrawal of <strong>₦${transaction.amount}</strong> has failed.</p>
            <p>The funds have been returned to your wallet.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Transaction Reference: ${reference}</p>
            <p>Please try again or contact support if the issue persists.</p>
          `,
        })
      } catch (error) {
        console.error("Error sending email notification:", error)
      }
    }
  } catch (error) {
    console.error("Error handling failed transfer:", error)
  }
}