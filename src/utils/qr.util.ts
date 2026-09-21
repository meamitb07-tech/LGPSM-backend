import QRCode from 'qrcode';

export const generateQRCodeDataURL = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, { errorCorrectionLevel: 'H' });
  } catch (error) {
    throw new Error('Failed to generate QR Code');
  }
};
