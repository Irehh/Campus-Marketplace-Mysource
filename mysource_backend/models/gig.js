module.exports = (sequelize, DataTypes) => {
  const Gig = sequelize.define(
    "Gig",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Duration in days",
      },
      campus: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      skills: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue("skills")
          return value ? value.split(",") : []
        },
        set(val) {
          this.setDataValue("skills", val.join(","))
        },
      },
      status: {
        type: DataTypes.ENUM("open", "in_progress", "completed", "cancelled"),
        defaultValue: "open",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      freelancerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "in_escrow", "released", "refunded"),
        defaultValue: "pending",
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "Gigs",
      timestamps: true,
    },
  )

  Gig.associate = (models) => {
    Gig.belongsTo(models.User, { as: "client", foreignKey: "userId" })
    Gig.belongsTo(models.User, { as: "freelancer", foreignKey: "freelancerId" })
    Gig.hasMany(models.Bid, { foreignKey: "gigId", onDelete: "CASCADE" })
    Gig.hasMany(models.Image, { foreignKey: "gigId", onDelete: "CASCADE" })
    Gig.hasMany(models.Transaction, {
      foreignKey: "gigId",
      onDelete: "SET NULL",
      scope: {
        transactionType: ["gig_payment", "gig_escrow", "gig_release"],
      },
    })
    Gig.hasMany(models.View, { foreignKey: "gigId", onDelete: "CASCADE" })
  }

  return Gig
}
