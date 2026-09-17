const prisma = require('../../database/prisma');

// GET all reviews
exports.getAllReviews = async (req, res) => {
    try {
        const { status, rating, search } = req.query;
        const where = {};
        
        if (status && status !== 'All') where.status = status;
        if (rating) where.rating = parseInt(rating);
        
        if (search) {
            where.OR = [
                { reviewerName: { contains: search, mode: 'insensitive' } },
                { comment: { contains: search, mode: 'insensitive' } }
            ];
        }

        const reviews = await prisma.review.findMany({
            where,
            orderBy: { serialId: 'desc' }
        });
        
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Fetch Reviews Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET review by ID
exports.getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = {};
        
        if (id.startsWith('REV-')) {
            query = { serialId: parseInt(id.split('-')[1]) };
        } else {
            query = { id };
        }

        const review = await prisma.review.findUnique({ where: query });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error('Fetch Review Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// POST create review
exports.createReview = async (req, res) => {
    try {
        const { reviewerName, rating, comment, status } = req.body;
        
        if (!reviewerName || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Reviewer name, rating, and comment are required.' });
        }

        const review = await prisma.review.create({
            data: {
                reviewerName,
                rating: parseInt(rating),
                comment
            }
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// PUT update review
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewerName, rating, comment, status } = req.body;
        
        let query = id.startsWith('REV-') ? { serialId: parseInt(id.split('-')[1]) } : { id };

        const updateData = {};
        if (reviewerName) updateData.reviewerName = reviewerName;
        if (rating !== undefined) updateData.rating = parseInt(rating);
        if (comment) updateData.comment = comment;
        if (status) updateData.status = status;

        const review = await prisma.review.update({ where: query, data: updateData });
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error('Update Review Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// DELETE review
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        let query = id.startsWith('REV-') ? { serialId: parseInt(id.split('-')[1]) } : { id };

        await prisma.review.delete({ where: query });
        res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
