"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeDataURL = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const generateQRCodeDataURL = async (data) => {
    try {
        return await qrcode_1.default.toDataURL(data, { errorCorrectionLevel: 'H' });
    }
    catch (error) {
        throw new Error('Failed to generate QR Code');
    }
};
exports.generateQRCodeDataURL = generateQRCodeDataURL;
