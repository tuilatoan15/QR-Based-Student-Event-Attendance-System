const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');
require('dotenv').config();

class GoogleSheetService {
  constructor() {
    this.doc = null;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    this.sheetId = process.env.GOOGLE_SHEET_ID;
  }

  async authenticate() {
    if (!this.doc) {
      this.doc = new GoogleSpreadsheet(this.sheetId);
      await this.doc.useServiceAccountAuth({
        client_email: this.serviceAccountEmail,
        private_key: this.privateKey,
      });
    }
  }

  async createEventSheet(event) {
    try {
      await this.authenticate();

      // Create a new sheet for the event
      const newSheet = await this.doc.addSheet({
        title: `Event_${event.id}_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}`,
        headerValues: ['Student_ID', 'Student_Name', 'Email', 'QR_Code', 'Attendance_Status', 'Checkin_Time']
      });

      return {
        sheetId: newSheet.sheetId,
        title: newSheet.title,
        url: `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit#gid=${newSheet.sheetId}`
      };
    } catch (error) {
      console.error('Error creating event sheet:', error);
      throw error;
    }
  }

  async addStudentToSheet(eventId, student) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      const sheetName = Object.keys(this.doc.sheetsByTitle).find(title =>
        title.startsWith(`Event_${eventId}_`)
      );

      if (!sheetName) {
        throw new Error(`Sheet for event ${eventId} not found`);
      }

      const sheet = this.doc.sheetsByTitle[sheetName];
      await sheet.addRow({
        Student_ID: student.student_id,
        Student_Name: student.student_name,
        Email: student.email,
        QR_Code: student.qr_code,
        Attendance_Status: 'NO',
        Checkin_Time: ''
      });

    } catch (error) {
      console.error('Error adding student to sheet:', error);
      throw error;
    }
  }

  async markAttendance(qrCode) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      // Find the sheet that contains this QR code
      let targetSheet = null;
      let rowIndex = -1;

      for (const [sheetName, sheet] of Object.entries(this.doc.sheetsByTitle)) {
        if (!sheetName.startsWith('Event_')) continue;

        const rows = await sheet.getRows();
        const foundRow = rows.findIndex(row => row.QR_Code === qrCode);
        if (foundRow !== -1) {
          targetSheet = sheet;
          rowIndex = foundRow;
          break;
        }
      }

      if (!targetSheet || rowIndex === -1) {
        throw new Error(`QR code ${qrCode} not found in any sheet`);
      }

      const rows = await targetSheet.getRows();
      const row = rows[rowIndex];

      row.Attendance_Status = 'YES';
      row.Checkin_Time = new Date().toISOString();
      await row.save();

    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getEventSheetUrl(eventId) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      const sheetName = Object.keys(this.doc.sheetsByTitle).find(title =>
        title.startsWith(`Event_${eventId}_`)
      );

      if (!sheetName) {
        return null;
      }

      const sheet = this.doc.sheetsByTitle[sheetName];
      return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit#gid=${sheet.sheetId}`;
    } catch (error) {
      console.error('Error getting event sheet URL:', error);
      return null;
    }
  }
}

module.exports = new GoogleSheetService();