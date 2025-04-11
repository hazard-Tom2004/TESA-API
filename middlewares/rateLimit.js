import rateLimit from "express-rate-limit";

const resendVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Max 3 requests per windowMs
    message: (req, res) => {
        console.log(`Rate limit exceeded for: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many verification requests. Please try again in 15 minutes.",
            retryAfter: "15 minutes",
        });
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit headers
})

export default resendVerificationLimiter;