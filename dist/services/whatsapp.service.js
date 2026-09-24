"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = void 0;
exports.normalizePhoneNumber = normalizePhoneNumber;
const env_1 = require("../config/env");
function normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string')
        return '';
    let cleaned = phone.replace(/\D/g, '');
    cleaned = cleaned.replace(/^0+/, '');
    if (cleaned.length === 10) {
        cleaned = `91${cleaned}`;
    }
    return cleaned;
}
exports.whatsappService = {
    normalizePhoneNumber,
    async uploadMedia(qrBuffer) {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || env_1.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || env_1.env.WHATSAPP_PHONE_NUMBER_ID;
        const apiVersion = process.env.WHATSAPP_API_VERSION || env_1.env.WHATSAPP_API_VERSION || 'v25.0';
        if (!accessToken) {
            throw new Error('WHATSAPP_CONFIG_MISSING: Access token not configured');
        }
        if (!phoneNumberId) {
            throw new Error('WHATSAPP_CONFIG_MISSING: Phone number ID not configured');
        }
        const formData = new FormData();
        formData.append('messaging_product', 'whatsapp');
        const blob = new Blob([qrBuffer], { type: 'image/png' });
        formData.append('file', blob, 'invitation-qr.png');
        const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok || !data.id) {
            const errMsg = data.error?.message || data.error?.error_data?.details || 'Media upload failed';
            throw new Error(`WHATSAPP_MEDIA_UPLOAD_FAILED: ${errMsg}`);
        }
        return data.id;
    },
    async sendTemplateMessage(params) {
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || env_1.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || env_1.env.WHATSAPP_PHONE_NUMBER_ID;
        const apiVersion = process.env.WHATSAPP_API_VERSION || env_1.env.WHATSAPP_API_VERSION || 'v25.0';
        const templateName = process.env.WHATSAPP_INVITATION_TEMPLATE || env_1.env.WHATSAPP_INVITATION_TEMPLATE || 'lgpsm_event_invitation';
        const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || env_1.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
        if (!accessToken) {
            throw new Error('WHATSAPP_CONFIG_MISSING: Access token not configured');
        }
        if (!phoneNumberId) {
            throw new Error('WHATSAPP_CONFIG_MISSING: Phone number ID not configured');
        }
        const formattedPhone = normalizePhoneNumber(params.recipientPhone);
        if (!formattedPhone || formattedPhone.length < 10 || formattedPhone.length > 15) {
            throw new Error('INVALID_PHONE_NUMBER: Phone number format is invalid');
        }
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                components: [
                    {
                        type: 'header',
                        parameters: [
                            {
                                type: 'image',
                                image: {
                                    id: params.mediaId,
                                },
                            },
                        ],
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: params.inviteeName || 'Guest' },
                            { type: 'text', text: params.eventTitle || 'Event' },
                            { type: 'text', text: params.eventDate || 'TBA' },
                            { type: 'text', text: params.eventTime || 'TBA' },
                            { type: 'text', text: params.venue || 'TBA' },
                        ],
                    },
                ],
            },
        };
        const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            const errMsg = data.error?.message || data.error?.error_data?.details || 'WhatsApp API request failed';
            throw new Error(`WHATSAPP_TEMPLATE_SEND_FAILED: ${errMsg}`);
        }
        const messageId = data.messages?.[0]?.id || '';
        return { messageId };
    },
    async sendInvitationWhatsApp(params) {
        const mediaId = await this.uploadMedia(params.qrBuffer);
        const { messageId } = await this.sendTemplateMessage({
            recipientPhone: params.recipientPhone,
            mediaId,
            inviteeName: params.inviteeName,
            eventTitle: params.eventTitle,
            eventDate: params.eventDate,
            eventTime: params.eventTime,
            venue: params.venue,
        });
        return { messageId, mediaId };
    },
};
