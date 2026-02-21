import twilio from 'twilio';

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      console.warn('Twilio credentials not provided. SMS/WhatsApp alerts will be mocked.');
    }
  }

  async sendSMS(to, message) {
    if (!this.client) {
      console.log(`Mock SMS to ${to}: ${message}`);
      return { success: true, mock: true };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWhatsApp(to, message) {
    if (!this.client) {
      console.log(`Mock WhatsApp to ${to}: ${message}`);
      return { success: true, mock: true };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendAlert(users, message, type = 'sms') {
    const results = [];
    
    for (const user of users) {
      if (!user.phone || (!user.notifications.sms && type === 'sms') || (!user.notifications.whatsapp && type === 'whatsapp')) {
        continue;
      }

      let result;
      if (type === 'whatsapp') {
        result = await this.sendWhatsApp(user.phone, message);
      } else {
        result = await this.sendSMS(user.phone, message);
      }

      results.push({
        userId: user._id,
        name: user.name,
        phone: user.phone,
        type,
        ...result
      });
    }

    return results;
  }

  generateAlertMessage(alertType, data) {
    const timestamp = new Date().toLocaleString();
    
    switch (alertType) {
      case 'emission':
        return `🚨 NTPC ALERT - Emission Threshold Exceeded\n\n` +
               `Parameter: ${data.parameter}\n` +
               `Value: ${data.value} ${data.unit}\n` +
               `Threshold: ${data.threshold} ${data.unit}\n` +
               `Location: ${data.location}\n` +
               `Time: ${timestamp}\n\n` +
               `Immediate action required!`;

      case 'maintenance':
        return `⚠️ NTPC ALERT - Maintenance Required\n\n` +
               `Equipment: ${data.equipment}\n` +
               `Risk Level: ${data.riskLevel}\n` +
               `Issue: ${data.issue}\n` +
               `Time: ${timestamp}\n\n` +
               `Schedule maintenance immediately.`;

      case 'load':
        return `📊 NTPC ALERT - Load Warning\n\n` +
               `Current Load: ${data.currentLoad} MW\n` +
               `Capacity: ${data.capacity} MW\n` +
               `Status: ${data.status}\n` +
               `Time: ${timestamp}\n\n` +
               `Monitor grid stability.`;

      case 'ash':
        return `🏭 NTPC ALERT - Ash Management\n\n` +
               `Type: ${data.type}\n` +
               `Storage Level: ${data.level}%\n` +
               `Action: ${data.action}\n` +
               `Time: ${timestamp}\n\n` +
               `Disposal arrangements needed.`;

      default:
        return `🚨 NTPC System Alert\n\n${data.message}\n\nTime: ${timestamp}`;
    }
  }
}

export default new TwilioService();