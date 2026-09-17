const express = require('express');
const multer = require('multer');
const path = require('path');
const prisma = require('../lib/prisma');

const router = express.Router();

const { makeFileFilter } = require('../utils/fileValidation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: makeFileFilter(function (req, file, cb) {
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only images, PDF, Word, and Excel files are allowed.'), false);
    }
  })
});

// Upload project document endpoint
router.post('/projects/upload-doc', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    res.json({
      success: true,
      data: {
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname
      },
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

// Upload image endpoint
router.post('/inventory/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { itemId, shopId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    if (!itemId || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID and Shop ID are required'
      });
    }

    // Update the inventory item with the image path
    const updatedItem = await prisma.inventoryItem.update({
      where: {
        id: parseInt(itemId),
        shopId: parseInt(shopId)
      },
      data: {
        item_image: `/uploads/${req.file.filename}`
      }
    });

    res.json({
      success: true,
      data: {
        imageUrl: `/uploads/${req.file.filename}`,
        item: updatedItem
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image: ' + error.message
    });
  }
});

module.exports = router;