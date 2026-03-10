const { GoogleSpreadsheet } = require('google-spreadsheet');
const path = require('path');
require('dotenv').config();

class GoogleSheetService {
  constructor() {
    this.doc = null;
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;
    this.sheetId = process.env.GOOGLE_SHEET_ID;
  }

  async authenticate() {
    if (!this.doc) {
      if (!this.sheetId || !this.serviceAccountEmail || !this.privateKey) {
        throw new Error('Google Sheets credentials not configured');
      }

      this.doc = new GoogleSpreadsheet(this.sheetId);
      await this.doc.useServiceAccountAuth({
        client_email: this.serviceAccountEmail,
        private_key: this.privateKey,
      });
    }
  }

  /**
   * Create a new sheet for an event
   * @param {string} eventTitle - The title of the event
   * @param {number} eventId - The ID of the event
   * @returns {Object} - Sheet information
   */
  async createEventSheet(eventTitle, eventId) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      // Create a new sheet for the event with format: Event_{eventId}_{eventTitle}
      const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 30);
      const sheetName = `Event_${eventId}_${cleanTitle}`;

      const newSheet = await this.doc.addSheet({
        title: sheetName,
        headerValues: ['Student Name', 'Student Code', 'Email', 'QR Token', 'Registration Status', 'Attendance Status', 'Check-in Time']
      });

      return {
        sheetId: newSheet.sheetId.toString(),
        sheetName: sheetName,
        url: `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit#gid=${newSheet.sheetId}`
      };
    } catch (error) {
      console.error('Error creating event sheet:', error);
      throw new Error(`Failed to create Google Sheet: ${error.message}`);
    }
  }

  /**
   * Add a student to an event's Google Sheet
   * @param {string} sheetName - The name of the sheet
   * @param {Object} studentData - Student information
   */
  async addStudentToSheet(sheetName, studentData) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      await sheet.addRow({
        'Student Name': studentData.student_name,
        'Student Code': studentData.student_code || '',
        'Email': studentData.email,
        'QR Token': studentData.qr_token,
        'Registration Status': 'Registered',
        'Attendance Status': 'Not Attended',
        'Check-in Time': ''
      });

    } catch (error) {
      console.error('Error adding student to sheet:', error);
      throw new Error(`Failed to add student to Google Sheet: ${error.message}`);
    }
  }

  /**
   * Update attendance status in Google Sheet
   * @param {string} sheetName - The name of the sheet
   * @param {string} qrToken - The QR token to find
   * @param {Date} checkinTime - The check-in timestamp
   */
  async updateAttendanceStatus(sheetName, qrToken, checkinTime = new Date()) {
    try {
      await this.authenticate();
      await this.doc.loadInfo();

      const sheet = this.doc.sheetsByTitle[sheetName];
      if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
      }

      const rows = await sheet.getRows();

      // Find the row with matching QR token
      const targetRow = rows.find(row => row['QR Token'] === qrToken);
      if (!targetRow) {
        throw new Error(`QR token ${qrToken} not found in sheet`);
      }

      // Update attendance status and check-in time
      targetRow['Attendance Status'] = 'Attended';
      targetRow['Check-in Time'] = checkinTime.toISOString();
      await targetRow.save();

    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw new Error(`Failed to update attendance in Google Sheet: ${error.message}`);
    }
  }

  /**
   * Get all sheets in the spreadsheet
   * @returns {Array} - List of sheet names
   */
  async getSheetNames() {
    try {
      await this.authenticate();
      await this.doc.loadInfo();
      return Object.keys(this.doc.sheetsByTitle);
    } catch (error) {
      console.error('Error getting sheet names:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetService();