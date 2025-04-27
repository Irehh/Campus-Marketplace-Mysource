const { Comment, Product, Business, User } = require('../models');
const { emitEvent } = require('../utils/eventEmitter');

// Get comments for a product or business
exports.getComments = async (req, res) => {
  const { itemType, itemId } = req.params;

  // Validate itemType
  if (!['product', 'business'].includes(itemType)) {
    return res.status(400).json({ message: 'Invalid item type' });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    const comments = await Comment.findAll({
      where: {
        [itemType === 'product' ? 'productId' : 'businessId']: itemIdInt,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// Create a new comment
exports.createComment = async (req, res) => {
  const { content, itemId, itemType } = req.body;
  const userId = req.user.id; // Integer from auth middleware

  // Validate inputs
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  if (!['product', 'business'].includes(itemType)) {
    return res.status(400).json({ message: 'Invalid item type' });
  }

  // Parse itemId to integer
  const itemIdInt = parseInt(itemId, 10);
  if (isNaN(itemIdInt)) {
    return res.status(400).json({ message: 'Invalid item ID' });
  }

  try {
    // Check if the item exists
    if (itemType === 'product') {
      const product = await Product.findOne({ where: { id: itemIdInt } });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } else {
      const business = await Business.findOne({ where: { id: itemIdInt } });
      if (!business) {
        return res.status(404).json({ message: 'Business not found' });
      }
    }

    // Create the comment
    const comment = await Comment.create({
      content,
      userId,
      [itemType === 'product' ? 'productId' : 'businessId']: itemIdInt,
    });

    // Fetch the created comment with user data
    const commentWithUser = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });

    // Emit event for real-time updates
    emitEvent('newComment', {
      message: `New comment from ${req.user.name || 'Someone'} on a ${itemType}`,
      campus: req.user.campus,
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const commentId = parseInt(id, 10); // Convert string to integer
  const { content } = req.body;
  const userId = req.user.id; // Integer

  // Validate inputs
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    // Check if comment exists and belongs to user
    const existingComment = await Comment.findOne({ where: { id: commentId } });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    // Update the comment
    await Comment.update(
      { content },
      { where: { id: commentId } }
    );

    // Fetch updated comment
    const updatedComment = await Comment.findOne({
      where: { id: commentId },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const commentId = parseInt(id, 10); // Convert string to integer
  const userId = req.user.id; // Integer

  // Validate ID
  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    // Check if comment exists and belongs to user
    const existingComment = await Comment.findOne({ where: { id: commentId } });

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete the comment
    await Comment.destroy({ where: { id: commentId } });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};