"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = void 0;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
